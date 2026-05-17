# OS Monitor — Pacote de Entrega v1.0.0-mvp

---

## 1. Checklist Final de Empacotamento Manual

- [ ] `npx tsc --noEmit` passa limpo em `backend/`
- [ ] `npx tsc --noEmit && npm run build` passa limpo em `frontend/`
- [ ] `npx prisma db seed` executado — dados de demonstração populados
- [ ] `.env` sem aspas nos valores (já corrigido)
- [ ] Nenhum `console.log` de debug remanescente
- [ ] `storage/` contém apenas `.gitkeep` + arquivos do seed (sem lixo)
- [ ] `node_modules/` e `dist/` removidos de ambas as pastas
- [ ] `README.md` atualizado
- [ ] `docs/` completo (api.md, frontend.md, backlog.md, homologacao.md, entrega.md)
- [ ] `.gitignore` cobre `node_modules/`, `dist/`, `.env`, `storage/relatorios/*`, `storage/anexos/*`
- [ ] Senhas no `.env` e `.env.example` são as de demonstração (não de produção)
- [ ] Testado `npm install && npm run dev` limpo em ambas as pastas
- [ ] Acesso via rede local testado: `http://<ip>:3001`

---

## 2. Comandos para Backup

### Backup do PostgreSQL

```bash
# Windows (PowerShell)
$env:PGPASSWORD = 'Izke1991@'
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U osmonitor_user -h localhost -p 5432 -d os_monitor -F c -f os_monitor_backup.dump

# Ou em formato SQL texto (mais portável):
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U osmonitor_user -h localhost -p 5432 -d os_monitor --no-owner --no-acl > os_monitor_backup.sql
```

### Restore do backup

```bash
# Restore do dump binário:
$env:PGPASSWORD = 'Izke1991@'
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -U osmonitor_user -h localhost -p 5432 -d os_monitor --clean --if-exists os_monitor_backup.dump

# Restore do SQL texto:
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U osmonitor_user -h localhost -p 5432 -d os_monitor -f os_monitor_backup.sql
```

---

## 3. Comandos para Compactar storage/

```bash
# Windows (PowerShell) — ZIP
Compress-Archive -Path "C:\FLUXO SERVIÇO\storage\*" -DestinationPath "storage_backup.zip"

# Para extrair:
Expand-Archive -Path "storage_backup.zip" -DestinationPath "C:\FLUXO SERVIÇO\storage"
```

---

## 4. Estrutura Recomendada da Pasta de Entrega

```
os-monitor-v1.0.0-mvp/
│
├── os-monitor/                    # Código fonte completo
│   ├── backend/                   # API (limpa, sem node_modules/dist)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── frontend/                  # UI (limpa, sem node_modules/dist)
│   │   ├── src/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   ├── storage/                   # PDFs + anexos do seed
│   │   ├── anexos/
│   │   └── relatorios/
│   ├── docs/                      # Documentação
│   │   ├── api.md
│   │   ├── frontend.md
│   │   ├── backlog.md
│   │   ├── homologacao.md
│   │   └── entrega.md
│   ├── scripts/
│   │   └── setup-postgresql.ps1
│   ├── README.md
│   └── .gitignore
│
├── backup/                        # Backups do banco e storage
│   ├── os_monitor_backup.sql
│   └── storage_backup.zip
│
├── README_BACKUP.txt              # Instruções de restore (este arquivo)
│
└── versao.txt                     # Changelog resumido
```

---

## 5. README_BACKUP.txt

```
============================================================
OS MONITOR v1.0.0-mvp — Instruções de Restore
============================================================

PRÉ-REQUISITOS:
  - Node.js 18+
  - PostgreSQL 14+ (serviço rodando)
  - npm 9+

PASSO 1 — BANCO DE DADOS:
  Execute o script de setup do PostgreSQL (como Administrador):
    .\os-monitor\scripts\setup-postgresql.ps1

  Ou, se o banco e usuário já existirem, restaure o backup:
    set PGPASSWORD=Izke1991@
    "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U osmonitor_user -h localhost -p 5432 -d os_monitor -f .\backup\os_monitor_backup.sql

PASSO 2 — STORAGE:
  Extraia o ZIP dos arquivos:
    Expand-Archive -Path .\backup\storage_backup.zip -DestinationPath .\os-monitor\storage

PASSO 3 — DEPENDÊNCIAS:
  cd os-monitor\backend
  npm install
  npx prisma generate

  cd ..\frontend
  npm install

PASSO 4 — CONFIGURAÇÃO:
  cd ..\backend
  copy .env.example .env
  (editar DATABASE_URL se necessário)

PASSO 5 — INICIAR:
  Terminal 1: cd os-monitor\backend  && npm run dev
  Terminal 2: cd os-monitor\frontend && npm run dev

  Acessar: http://localhost:3001 (produção) ou http://localhost:5173 (dev)

LOGIN:
  admin@osmonitor.local    / admin123
  tecnico@osmonitor.local  / admin123

SUPORTE:
  Documentação completa em os-monitor\docs\
============================================================
```

---

## 6. Texto de Versão v1.0.0-mvp

```
OS Monitor v1.0.0-mvp — Maio 2026

Sistema web local para monitoramento de ordens de serviço.
Funciona sem internet, acessível via navegador na rede local.

Stack: React + TypeScript + Tailwind | Node.js + Express | PostgreSQL + Prisma

Entregue:
  16 funcionalidades   |   21 endpoints API
   5 telas              |    7 tabelas
   9 estágios de OS     |   33 registros de histórico (seed)
  12 OS de exemplo      |   10 clientes de exemplo

Próximo passo (v1.1): PDF real com Puppeteer, exclusão lógica, CRUD de usuários.
```

---

## 7. O Que NÃO Deve Ser Alterado Antes da Entrega

| # | Item | Motivo |
|---|------|--------|
| 1 | `schema.prisma` | Estrutura do banco validada. Alterações exigem nova migration. |
| 2 | Matriz de transição em `constants.ts` | Fluxo de 9 estágios homologado. |
| 3 | Regras de bloqueio (`PDF_NAO_GERADO`, `TRANSICAO_INVALIDA`) | Comportamento crítico validado. |
| 4 | `error.middleware.ts` | Formato de erro (`{ error: { codigo, mensagem } }`) é contrato da API. |
| 5 | `.env.example` | Sem aspas, estrutura estável. |
| 6 | `storage/` — caminhos relativos | `paths.ts` usa caminho relativo à raiz. Não alterar para absoluto. |
| 7 | `auth.middleware.ts` — assinatura JWT | Alterar JWT_SECRET invalida tokens existentes. |
| 8 | `seed.ts` — usuários padrão | `admin@osmonitor.local` e `tecnico@osmonitor.local` são referência nos docs. |
| 9 | `server.ts` — `dotenv.config()` antes de imports | Ordem de carregamento é crítica para JWT_SECRET. |
| 10 | Estrutura de pastas | `backend/`, `frontend/`, `storage/`, `docs/`, `scripts/` — referenciada em toda documentação. |
