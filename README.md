<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="version">
  <img src="https://img.shields.io/badge/license-private-red" alt="license">
  <img src="https://img.shields.io/badge/stack-React%20%2B%20Node.js%20%2B%20PostgreSQL-00d8ff" alt="stack">
</p>

# OS Monitor

**Sistema web local para monitoramento de ordens de serviço.**
Funciona sem internet, acessível via navegador na rede local.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Banco | PostgreSQL 18 |
| ORM | Prisma 6 |
| PDF | PDFKit (geração nativa, sem navegador) |
| Arquivos | Armazenamento local em disco |
| Auth | JWT + bcrypt |

## Funcionalidades

- ✅ Login local com JWT (expira em 8h)
- ✅ Cadastro de clientes (CRUD completo)
- ✅ Cadastro de ordens de serviço com numeração automática
- ✅ Fluxo de 9 estágios com transições validadas
- ✅ Histórico auditável e imutável (6 tipos de evento)
- ✅ Pendências vinculadas à OS
- ✅ Anexos com upload/download (até 10 MB)
- ✅ Relatório PDF com layout corporativo (PDFKit)
- ✅ Dashboard com métricas e indicadores
- ✅ Alertas por tempo parado no estágio (24h / 48h)
- ✅ Notas por estágio (observações na transição)
- ✅ Monitoramento de prazos por estágio
- ✅ Auditoria completa com filtros
- ✅ Estatísticas com gráficos de barra
- ✅ CRUD de usuários do sistema
- ✅ Layout responsivo (desktop + tablet)
- ✅ Barra de fluxo visual com 9 estágios coloridos
- ✅ Acesso multiusuário via rede local
- ✅ Bloqueio de encerramento sem PDF

## Fluxo da OS

```
ABERTA  →  EM_ANÁLISE  →  ENVIADA_AO_CLIENTE  →  AGUARDANDO_RETORNO
   ↓           ↓                  ↓                      ↓
AGENDADA  →  EM_EXECUÇÃO  →  CONCLUÍDA  →  RELATÓRIO_ENTREGUE  →  ENCERRADA
```

Cada transição gera histórico automático com registro de usuário, data/hora e nota opcional.

## Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 1. Configurar PostgreSQL

Execute como **Administrador**:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup-postgresql.ps1
```

O script cria o banco `os_monitor` e o usuário `osmonitor_user` automaticamente.

### 2. Instalar dependências

```bash
cd backend  && npm install
cd frontend && npm install
```

### 3. Configurar .env

```bash
cd backend
copy .env.example .env
```

Edite `DATABASE_URL` com suas credenciais:

```
DATABASE_URL=postgresql://osmonitor_user:SENHA@localhost:5432/os_monitor?schema=public
JWT_SECRET=sua-chave-secreta-aqui
PORT=3001
HOST=0.0.0.0
```

### 4. Criar banco e seed

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed          # Dados de demonstração
```

### 5. Iniciar

```bash
# Terminal 1 — Backend
cd backend && npm run dev     # http://localhost:3001

# Terminal 2 — Frontend
cd frontend && npm run dev    # http://localhost:5173
```

Ou use o atalho: **duplo clique em `inicio.bat`**

### 6. Acesso

| Usuário | Senha |
|---------|-------|
| `admin@osmonitor.local` | `admin123` |
| `tecnico@osmonitor.local` | `admin123` |

## Rede Local

O backend escuta em `0.0.0.0:3001`. Para acessar de outras máquinas:

```bash
# No frontend/.env
VITE_API_URL=http://192.168.1.100:3001/api

# Build do frontend
cd frontend && npm run build
```

Acesse `http://<ip-do-servidor>:3001` de qualquer navegador na rede.

## Estrutura do Projeto

```
os-monitor/
├── backend/
│   ├── prisma/              # Schema, migrations, seed
│   │   ├── schema.prisma    # 7 modelos, 2 enums
│   │   ├── migrations/
│   │   ├── seed.ts          # Dados de demonstração
│   │   └── seed-clean.ts    # Seed limpo (só usuários)
│   ├── src/
│   │   ├── server.ts        # Entry point
│   │   ├── app.ts           # Express + middlewares
│   │   ├── routes/          # 10 módulos de rota
│   │   ├── controllers/     # Handlers HTTP
│   │   ├── services/        # Lógica de negócio
│   │   ├── middlewares/     # Auth JWT + error handler
│   │   ├── lib/             # Prisma client
│   │   ├── utils/           # Constantes, paths, config
│   │   └── types/           # Tipos estendidos
│   └── assets/              # Logo (coloque aqui)
├── frontend/
│   ├── src/
│   │   ├── pages/           # 7 telas
│   │   ├── components/      # Layout, Flags, Loading
│   │   ├── contexts/        # AuthContext (JWT)
│   │   ├── services/        # API client (axios)
│   │   └── types/           # Tipos compartilhados
│   └── dist/                # Build de produção
├── storage/                 # PDFs e anexos (disco)
│   ├── relatorios/
│   └── anexos/
├── docs/                    # Documentação técnica
│   ├── api.md               # 23 endpoints REST
│   ├── frontend.md          # Especificação de telas
│   ├── backlog.md           # 24 histórias, 5 sprints
│   ├── homologacao.md       # 60 itens de validação
│   └── pacote-entrega.md    # Guia de entrega
├── scripts/
│   └── setup-postgresql.ps1 # Configuração do banco
├── inicio.bat               # Atalho para iniciar tudo
└── README.md
```

## API — Endpoints

| Módulo | Métodos | Rotas |
|--------|---------|-------|
| Auth | POST, GET | `/api/auth/login`, `/api/auth/me` |
| Clientes | GET, POST, PUT, DELETE | `/api/clientes` |
| Ordens | GET, POST, PUT, PATCH, DELETE | `/api/ordens` |
| Pendências | GET, POST, PATCH | `/api/ordens/:id/pendencias` |
| Relatórios | GET, POST | `/api/ordens/:id/relatorio` |
| Anexos | GET, POST | `/api/ordens/:id/anexos` |
| Dashboard | GET | `/api/dashboard` |
| Alertas | GET | `/api/alertas` |
| Auditoria | GET | `/api/auditoria` |
| Estatísticas | GET | `/api/estatisticas` |
| Usuários | GET, POST, PUT | `/api/usuarios` |
| Health | GET | `/api/health` |

**Formato de resposta:**

```json
// Sucesso
{ "data": { ... }, "meta": { "total": 128, "pagina": 1, "limite": 20 } }

// Erro
{ "error": { "codigo": "PDF_NAO_GERADO", "mensagem": "É necessário gerar o relatório PDF..." } }
```

## Comandos Úteis

```bash
# Seed de demonstração (12 OS, 10 clientes, 33 históricos)
cd backend && npx prisma db seed

# Seed limpo (só usuários, sem dados)
cd backend && npx tsx prisma/seed-clean.ts

# Inspecionar banco
cd backend && npx prisma studio

# Nova migration
cd backend && npx prisma migrate dev --name descricao

# Backup
pg_dump -U osmonitor_user -h localhost os_monitor > backup.sql
Compress-Archive -Path storage\* -DestinationPath storage_backup.zip
```

## Regras de Negócio

- **Histórico imutável**: sem update/delete, sem rota dedicada
- **Transações**: toda operação crítica roda em `prisma.$transaction`
- **Bloqueios**: `RELATORIO_ENTREGUE` requer PDF; `ENCERRADA` requer `RELATORIO_ENTREGUE`
- **OS encerrada**: modo somente leitura, todos os botões desabilitados
- **Anexos**: até 10 MB, extensões: jpg, jpeg, png, pdf, doc, docx, xls, xlsx
- **PDF**: gerado com PDFKit, salvo em `storage/relatorios/`
- **Alertas**: notificação visual para OS parada +24h (atenção) e +48h (crítico)

---

<p align="center">
  <sub>© Antonio M. — VE / BR</sub>
</p>
