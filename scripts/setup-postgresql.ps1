#Requires -RunAsAdministrator
# =============================================================
# OS Monitor - PostgreSQL Setup Script
# Run as Administrator in PowerShell
# =============================================================

$ErrorActionPreference  = "Stop"
$ProgressPreference     = "SilentlyContinue"

# ---- Config ----
$pgBin       = "C:\Program Files\PostgreSQL\18\bin"
$pgData      = "C:\Program Files\PostgreSQL\18\data"
$pgService   = "postgresql-x64-18"
$psqlExe     = "$pgBin\psql.exe"
$pgHba       = "$pgData\pg_hba.conf"
$pgHbaBackup = "$pgData\pg_hba.conf.bak"

$projectRoot = "C:\FLUXO SERVI" + [char]199 + "O"
$backendDir  = Join-Path $projectRoot "backend"
$envFile     = Join-Path $backendDir ".env"
$prismaCache = Join-Path $backendDir "node_modules\.prisma\client"

$dbName      = "os_monitor"
$dbUser      = "osmonitor_user"
$dbPass      = "Izke1991@"
$pgSuperPass = "Izke1991@"

# ---- Helpers ----
function Log-Step { param($m) Write-Host "`n>>> $m" -ForegroundColor Cyan }
function Log-OK   { param($m) Write-Host "    [OK]   $m" -ForegroundColor Green }
function Log-WARN { param($m) Write-Host "    [WARN] $m" -ForegroundColor Yellow }
function Log-FAIL { param($m) Write-Host "    [FAIL] $m" -ForegroundColor Red }

function Run-Psql {
    param($User, $PassEnv, $DB, $SQL, $Host = "127.0.0.1", $Port = 5432)
    $env:PGPASSWORD = $PassEnv
    $out = & $psqlExe -U $User -h $Host -p $Port -d $DB -t -c $SQL 2>&1
    $code = $LASTEXITCODE
    $env:PGPASSWORD = ""
    return @{ ExitCode = $code; Output = ($out -join "`n") }
}

# ============================================================
# PRE-CHECKS
# ============================================================
Log-Step "Pre-checks"

$id = [Security.Principal.WindowsIdentity]::GetCurrent()
$pr = New-Object Security.Principal.WindowsPrincipal($id)
if (-not $pr.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Log-FAIL "Must run as Administrator. Right-click PowerShell > Run as Administrator."
    exit 1
}
Log-OK "Running as Administrator"

if (-not (Test-Path $psqlExe)) {
    Log-FAIL "psql not found: $psqlExe"
    Log-WARN "Verify PostgreSQL 18 is installed or adjust `$pgBin variable."
    exit 1
}
Log-OK "psql found: $psqlExe"

$svc = Get-Service -Name $pgService -ErrorAction SilentlyContinue
if ($null -eq $svc) {
    Log-FAIL "Service not found: $pgService"
    Log-WARN "Run to list PostgreSQL services:"
    Log-WARN "  Get-Service | Where-Object { `$_.Name -like '*postgresql*' }"
    Log-WARN "Update `$pgService variable and rerun."
    exit 1
}
Log-OK "Service found: $pgService (Status: $($svc.Status))"

if ($svc.Status -ne "Running") {
    Log-Step "Starting PostgreSQL service"
    Start-Service -Name $pgService
    Start-Sleep 3
    Log-OK "Service started"
}

if (-not (Test-Path $pgHba)) {
    Log-FAIL "pg_hba.conf not found: $pgHba"
    exit 1
}
Log-OK "pg_hba.conf found"

if (-not (Test-Path $backendDir)) {
    Log-FAIL "Backend directory not found: $backendDir"
    exit 1
}
Log-OK "Backend directory found"

# ============================================================
# PHASE 1: BACKUP + TEMP TRUST AUTH
# ============================================================
Log-Step "Backing up pg_hba.conf"
Copy-Item $pgHba $pgHbaBackup -Force
Log-OK "Backup: $pgHbaBackup"

$hbaRestored = $false

try {
    Log-Step "Setting trust auth for localhost (temporary)"

    $original = Get-Content $pgHba
    $modified  = foreach ($line in $original) {
        $s = $line.TrimStart()
        if ($s -match '^host\s+all\s+all\s+(127\.0\.0\.1/32|::1/128)\s+\S+') {
            "# ORIG: $line"
        } else {
            $line
        }
    }

    $trustBlock = @(
        "# --- TEMP TRUST BEGIN (setup-postgresql.ps1) ---",
        "host    all             all             127.0.0.1/32            trust",
        "host    all             all             ::1/128                 trust",
        "# --- TEMP TRUST END ---"
    )

    Set-Content $pgHba -Value ($trustBlock + $modified) -Encoding ASCII
    Log-OK "pg_hba.conf modified"

    Log-Step "Restarting PostgreSQL to apply trust auth"
    Restart-Service -Name $pgService -Force
    Start-Sleep 5
    Log-OK "Service restarted"

    # ---- Reset postgres superuser password ----
    Log-Step "Resetting postgres superuser password"
    $env:PGPASSWORD = ""
    $r = & $psqlExe -U postgres -h 127.0.0.1 -p 5432 -c "ALTER USER postgres WITH PASSWORD '$pgSuperPass';" 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Reset postgres password failed: $($r -join ' ')" }
    Log-OK "postgres password set"

    # ---- Create database ----
    Log-Step "Checking/creating database: $dbName"
    $env:PGPASSWORD = ""
    $chk = & $psqlExe -U postgres -h 127.0.0.1 -p 5432 -t -c "SELECT 1 FROM pg_database WHERE datname='$dbName';" 2>&1
    if (($chk -join "") -match "1") {
        Log-WARN "Database '$dbName' already exists - skipping CREATE"
    } else {
        $r = & $psqlExe -U postgres -h 127.0.0.1 -p 5432 -c "CREATE DATABASE $dbName;" 2>&1
        if ($LASTEXITCODE -ne 0) { throw "CREATE DATABASE failed: $($r -join ' ')" }
        Log-OK "Database created: $dbName"
    }

    # ---- Create/update user ----
    Log-Step "Checking/creating user: $dbUser"
    $env:PGPASSWORD = ""
    $chk = & $psqlExe -U postgres -h 127.0.0.1 -p 5432 -t -c "SELECT 1 FROM pg_roles WHERE rolname='$dbUser';" 2>&1
    if (($chk -join "") -match "1") {
        Log-WARN "User '$dbUser' already exists - updating password"
        $r = & $psqlExe -U postgres -h 127.0.0.1 -p 5432 -c "ALTER USER $dbUser WITH PASSWORD '$dbPass';" 2>&1
        if ($LASTEXITCODE -ne 0) { throw "ALTER USER failed: $($r -join ' ')" }
        Log-OK "Password updated for $dbUser"
    } else {
        $r = & $psqlExe -U postgres -h 127.0.0.1 -p 5432 -c "CREATE USER $dbUser WITH PASSWORD '$dbPass';" 2>&1
        if ($LASTEXITCODE -ne 0) { throw "CREATE USER failed: $($r -join ' ')" }
        Log-OK "User created: $dbUser"
    }

    # ---- Grant permissions ----
    Log-Step "Granting permissions on $dbName"
    $env:PGPASSWORD = ""

    $dbGrants = @(
        "GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;",
        "ALTER DATABASE $dbName OWNER TO $dbUser;"
    )
    foreach ($sql in $dbGrants) {
        $r = & $psqlExe -U postgres -h 127.0.0.1 -p 5432 -c $sql 2>&1
        if ($LASTEXITCODE -ne 0) { throw "DB grant failed [$sql]: $($r -join ' ')" }
    }

    $schemaGrants = @(
        "GRANT ALL ON SCHEMA public TO $dbUser;",
        "ALTER SCHEMA public OWNER TO $dbUser;",
        "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $dbUser;",
        "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $dbUser;",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $dbUser;",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $dbUser;"
    )
    foreach ($sql in $schemaGrants) {
        $r = & $psqlExe -U postgres -h 127.0.0.1 -p 5432 -d $dbName -c $sql 2>&1
        if ($LASTEXITCODE -ne 0) { Log-WARN "Schema grant note [$sql]: $($r -join ' ')" }
    }
    Log-OK "Permissions granted"

} catch {
    Log-FAIL "Error during trust-auth phase: $_"
    Log-WARN "Restoring pg_hba.conf from backup..."
    if (Test-Path $pgHbaBackup) {
        Copy-Item $pgHbaBackup $pgHba -Force
        Restart-Service -Name $pgService -Force -ErrorAction SilentlyContinue
        $hbaRestored = $true
        Log-OK "pg_hba.conf restored"
    }
    exit 1
}

# ============================================================
# PHASE 2: RESTORE pg_hba.conf
# ============================================================
Log-Step "Restoring original pg_hba.conf"
Copy-Item $pgHbaBackup $pgHba -Force
$hbaRestored = $true
Log-OK "pg_hba.conf restored"

Log-Step "Restarting PostgreSQL (original auth)"
Restart-Service -Name $pgService -Force
Start-Sleep 5
Log-OK "Service restarted with original auth"

# ============================================================
# PHASE 3: TEST CONNECTION WITH osmonitor_user
# ============================================================
Log-Step "Testing connection: $dbUser @ $dbName"
$env:PGPASSWORD = $dbPass
$r = & $psqlExe -U $dbUser -h 127.0.0.1 -p 5432 -d $dbName -c "SELECT 1;" 2>&1
$code = $LASTEXITCODE
$env:PGPASSWORD = ""

if ($code -ne 0) {
    Log-FAIL "Connection test FAILED: $($r -join ' ')"
    Log-WARN "pg_hba.conf may require 'md5' or 'scram-sha-256' for 127.0.0.1."
    Log-WARN "Check: Get-Content '$pgHba' | Select-String '127.0.0.1'"
    exit 1
}
Log-OK "Connection test passed: $dbUser can authenticate"

# ============================================================
# PHASE 4: WRITE backend/.env
# ============================================================
Log-Step "Writing backend/.env"
$envLines = @(
    'DATABASE_URL="postgresql://osmonitor_user:Izke1991%40@localhost:5432/os_monitor?schema=public"',
    'PORT=3001',
    'JWT_SECRET="trocar_essa_chave_em_producao"',
    'STORAGE_PATH="../storage"'
)
Set-Content -Path $envFile -Value $envLines -Encoding UTF8
Log-OK ".env written: $envFile"

# ============================================================
# PHASE 5: KILL NODE PROCESSES
# ============================================================
Log-Step "Killing node.exe processes (prevent EPERM on Prisma cache)"
$nodes = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodes) {
    $nodes | Stop-Process -Force
    Log-OK "Killed $($nodes.Count) node process(es)"
    Start-Sleep 2
} else {
    Log-WARN "No node.exe processes found"
}

# ============================================================
# PHASE 6: CLEAR PRISMA CACHE
# ============================================================
Log-Step "Removing Prisma client cache"
if (Test-Path $prismaCache) {
    Remove-Item $prismaCache -Recurse -Force -ErrorAction SilentlyContinue
    Log-OK "Prisma cache removed: $prismaCache"
} else {
    Log-WARN "Prisma cache not found (already clean)"
}

# ============================================================
# PHASE 7: PRISMA GENERATE + MIGRATE + SEED
# ============================================================
Log-Step "Running Prisma commands in: $backendDir"
Push-Location $backendDir

try {
    Write-Host "`n  npx prisma generate" -ForegroundColor White
    & npx prisma generate
    if ($LASTEXITCODE -ne 0) { throw "prisma generate failed (exit $LASTEXITCODE)" }
    Log-OK "prisma generate done"

    Write-Host "`n  npx prisma migrate dev --name init" -ForegroundColor White
    & npx prisma migrate dev --name init
    if ($LASTEXITCODE -ne 0) { throw "prisma migrate dev failed (exit $LASTEXITCODE)" }
    Log-OK "prisma migrate dev done"

    Write-Host "`n  npx prisma db seed" -ForegroundColor White
    & npx prisma db seed
    if ($LASTEXITCODE -ne 0) {
        Log-WARN "prisma db seed failed (exit $LASTEXITCODE)"
        Log-WARN "Check 'prisma.seed' entry exists in backend/package.json"
    } else {
        Log-OK "prisma db seed done"
    }

} catch {
    Log-FAIL "Prisma step failed: $_"
    Log-WARN "If EPERM error: close all editors/terminals using the backend dir, then rerun."
    Pop-Location
    exit 1
}

Pop-Location

# ============================================================
# DONE
# ============================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Test the backend:" -ForegroundColor Yellow
Write-Host "  cd `"$backendDir`""
Write-Host "  npm run dev"
Write-Host "  # Open: http://localhost:3001/api/health"
Write-Host ""
Write-Host "Validate DB connection directly:" -ForegroundColor Yellow
Write-Host "  `$env:PGPASSWORD='Izke1991@'; & '$psqlExe' -U osmonitor_user -h 127.0.0.1 -p 5432 -d os_monitor -c '\dt'; `$env:PGPASSWORD=''"
Write-Host ""
