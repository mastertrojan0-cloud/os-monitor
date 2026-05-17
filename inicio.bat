@echo off
title OS Monitor
echo ================================
echo   OS Monitor - Iniciando...
echo ================================
echo.

echo [1/3] Iniciando backend (porta 3001)...
start "OS Monitor - Backend" cmd /c "cd /d %~dp0backend && npm run dev"

echo [2/3] Iniciando frontend (porta 5173)...
start "OS Monitor - Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"

echo [3/3] Aguardando servidor...
timeout /t 6 /nobreak >nul

echo.
echo ================================
echo   Abrindo navegador...
echo ================================
start http://localhost:5173

echo.
echo Login: admin@osmonitor.local / admin123
echo.
echo Para parar: feche as janelas "OS Monitor - Backend" e "OS Monitor - Frontend"
echo.
pause
