# OS Monitor — Especificação de Telas Frontend (MVP)

---

## 1. Estrutura de Rotas (React Router v6)

```
/                          → redireciona para /dashboard
/login                     → LoginPage         (pública)
/dashboard                 → DashboardPage      (protegida)
/clientes                  → ClientesPage       (protegida)
/ordens                    → OrdensPage         (protegida)
/ordens/:id                → OrdemDetalhePage   (protegida)
*                          → NotFoundPage       (404)
```

**AuthGuard:** componente wrapper que verifica `token` no `localStorage`. Se ausente ou expirado, redireciona para `/login`.

---

## 2. Estrutura de Componentes (árvore)

```
App
├── AuthProvider            (Context: token, usuario, login, logout)
├── QueryClientProvider     (TanStack Query)
├── BrowserRouter
│   ├── /login
│   │   └── LoginPage
│   │
│   └── / (AuthGuard)
│       └── AppLayout
│           ├── Sidebar
│           │   ├── Logo
│           │   ├── NavItem  (Dashboard)
│           │   ├── NavItem  (Clientes)
│           │   ├── NavItem  (Ordens)
│           │   └── UserMenu (nome, logout)
│           │
│           └── <Outlet>
│               ├── DashboardPage
│               │   └── StatCard (×5 cards de resumo)
│               │
│               ├── ClientesPage
│               │   ├── PageHeader (título + botão Novo)
│               │   ├── SearchInput
│               │   ├── ClienteTable
│               │   │   └── ClienteRow
│               │   ├── Pagination
│               │   └── ClienteModal (criar/editar)
│               │
│               ├── OrdensPage
│               │   ├── PageHeader (título + botão Nova OS)
│               │   ├── FilterBar (estágio, cliente, busca)
│               │   ├── OrdemTable
│               │   │   └── OrdemRow
│               │   ├── Pagination
│               │   └── OrdemModal (criar)
│               │
│               └── OrdemDetalhePage
│                   ├── BackButton
│                   ├── OrdemHeader
│                   │   ├── EstagioBadge
│                   │   ├── EstagioSelect (dropdown + confirmar)
│                   │   └── GerarPdfButton
│                   ├── OrdemInfoCard
│                   │   └── ClienteCard
│                   ├── PendenciasSection
│                   │   ├── PendenciaForm
│                   │   └── PendenciaList
│                   │       └── PendenciaItem
│                   ├── HistoricoSection
│                   │   └── Timeline
│                   │       └── TimelineItem
│                   ├── AnexosSection
│                   │   ├── AnexoUpload
│                   │   └── AnexoList
│                   │       └── AnexoItem
│                   └── RelatorioSection
│                       └── RelatorioCard
```

---

## 3. Estrutura de `services/api.ts`

```ts
// frontend/src/services/api.ts

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Injeta token em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 global → logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

**VITE_API_URL** em dev aponta para `http://localhost:3001`. Em produção na rede local, aponta para `http://<ip-servidor>:3001`.

---

## 4. Estrutura de hooks (TanStack Query)

```
frontend/src/hooks/
├── useAuth.ts            (login, logout, me)
├── useClientes.ts        (list, detail, create, update)
├── useOrdens.ts          (list, detail, create, update, changeStage)
├── usePendencias.ts      (list, create, resolve)
├── useRelatorio.ts       (metadata, generate, download)
├── useAnexos.ts          (list, upload, download)
└── useDashboard.ts       (summary)
```

Cada hook encapsula `useQuery` (GET) e `useMutation` (POST/PUT/PATCH) com invalidação de cache apropriada.

---

## 5. Layout Visual

```
┌──────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌─────────────────────────────────────┐ │
│ │          │ │                                     │ │
│ │  LOGO    │ │  CABEÇALHO DA PÁGINA                │ │
│ │          │ │  Título           [Ação principal]   │ │
│ │──────────│ │─────────────────────────────────────│ │
│ │Dashboard │ │                                     │ │
│ │Clientes  │ │  CONTEÚDO                           │ │
│ │Ordens    │ │                                     │ │
│ │          │ │                                     │ │
│ │          │ │                                     │ │
│ │──────────│ │                                     │ │
│ │Usuário ▼ │ │                                     │ │
│ └──────────┘ └─────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
   Sidebar 240px        Área de conteúdo (flex-1)
```

**Cores (Tailwind):** fundo `gray-50`, sidebar `gray-900`, cards `white`, ações `blue-600`, alertas `amber-500`, sucesso `green-600`, erro `red-600`.

---

## 6. Telas

### 6.1 Login (`LoginPage`)

**Objetivo:** autenticar usuário local.

**Componentes:**
```
LoginPage
├── Logo (nome do sistema)
├── EmailInput
├── SenhaInput
├── LoginButton
├── ErrorMessage (condicional)
└── Spinner (durante submit)
```

**Dados consumidos:** `POST /api/auth/login`

**Ações:**
- Preencher email e senha → clicar "Entrar" (ou Enter).
- Se sucesso: armazenar `token` e `usuario` no `AuthContext`, redirecionar para `/dashboard`.
- Se erro 401: exibir "Email ou senha incorretos." abaixo do botão.
- Se erro 403: exibir "Usuário inativo."

**Estados:**

| Estado | Renderização |
|--------|-------------|
| Inicial | Formulário limpo, foco no campo email. |
| Carregando | Botão desabilitado + spinner + label "Entrando..." |
| Erro | Mensagem em `text-red-600` abaixo do botão. Inputs mantêm valores. |
| Sucesso | Redirecionamento imediato (sem feedback visual). |

**Validações:**
- Email obrigatório, formato `algo@algo.algo`.
- Senha obrigatória, mínimo 4 caracteres.
- Ambos os campos com `aria-required` e `aria-invalid` quando erro.

**UX:**
- `Enter` no campo senha dispara submit.
- Mensagem de erro desaparece ao começar a digitar novamente.
- Sem link de "esqueci minha senha" no MVP (sem email).

**O que não entra:** cadastro de usuário, recuperação de senha, checkbox "lembrar-me", logo customizável.

---

### 6.2 Dashboard (`DashboardPage`)

**Objetivo:** visão resumo do sistema ao abrir.

**Componentes:**
```
DashboardPage
├── PageHeader ("Dashboard")
├── StatCardGrid (grid 3-4 colunas)
│   ├── StatCard (Total de OS, ícone: clipboard, valor: 128)
│   ├── StatCard (Pendências abertas, ícone: alert, valor: 34, cor: amber)
│   ├── StatCard (OS sem PDF, ícone: file, valor: 40, cor: red)
│   ├── StatCard (Total de clientes, ícone: users, valor: 89)
│   └── StatCard (OS concluídas este mês, ícone: check, valor: 15)
```

**Dados consumidos:** `GET /api/dashboard`

**Ações:** nenhuma ação além de visualizar. Cards não são clicáveis para navegação no MVP.

**Estados:**

| Estado | Renderização |
|--------|-------------|
| Carregando | 5 skeletons (retângulos `animate-pulse`) no lugar dos cards. |
| Erro | Mensagem centralizada "Erro ao carregar dashboard." + botão "Tentar novamente". |
| Vazio | Sistema recém-instalado: todos os cards mostram "0". Sem mensagem de vazio. |
| Dados | Cards com números reais. |

**UX:**
- Cards com números grandes (`text-3xl font-bold`) e label abaixo.
- Cores diferentes para chamar atenção: pendências em amber, sem PDF em red.
- Atualização: `refetchInterval: 30_000` (30 segundos de polling silencioso no TanStack Query).

**O que não entra:** gráficos, tendências, comparativos, filtros por período, dashboard personalizável, atalhos para criação rápida.

---

### 6.3 Clientes (`ClientesPage`)

**Objetivo:** listar, buscar, criar e editar clientes.

**Componentes:**
```
ClientesPage
├── PageHeader
│   ├── Título "Clientes"
│   └── Button "Novo cliente" → abre ClienteModal (modo criação)
├── SearchInput (busca por nome/email/documento, debounce 300ms)
├── ClienteTable
│   ├── thead: Nome | Email | Telefone | Documento | Ações
│   └── tbody:
│       └── ClienteRow
│           ├── Nome (link para filtrar OS por cliente? Não no MVP)
│           ├── Email
│           ├── Telefone
│           ├── Documento (formatado)
│           └── Button "Editar" → abre ClienteModal (modo edição)
├── Pagination
└── ClienteModal (criar/editar)
    ├── ModalOverlay
    ├── ModalContent
    │   ├── ModalHeader (título + fechar)
    │   ├── NomeInput*
    │   ├── EmailInput
    │   ├── TelefoneInput
    │   ├── DocumentoInput
    │   ├── EnderecoInput (textarea)
    │   ├── ObservacoesInput (textarea)
    │   └── ModalFooter
    │       ├── Button "Cancelar"
    │       └── Button "Salvar" (com spinner quando carregando)
    └── ErrorMessage (erro de validação ou API)
```

**Dados consumidos:**
- `GET /api/clientes?pagina=1&limite=20&busca=xxx`
- `POST /api/clientes` (criar)
- `PUT /api/clientes/:id` (editar)

**Ações:**
- Buscar: digitar no campo de busca (dispara após 300ms sem digitar).
- Criar: botão "Novo cliente" → modal → preencher → "Salvar".
- Editar: botão "Editar" na linha → modal preenchido → alterar → "Salvar".
- Navegar: paginação no rodapé.

**Estados:**

| Estado | Renderização |
|--------|-------------|
| Carregando | 5 linhas de skeleton na tabela. |
| Erro (lista) | Mensagem "Erro ao carregar clientes." + botão "Tentar novamente". |
| Erro (modal) | Mensagem abaixo do campo inválido ou toast de erro da API. |
| Vazio (sem busca) | Ilustração simples + "Nenhum cliente cadastrado." + botão "Cadastrar primeiro cliente". |
| Vazio (com busca) | "Nenhum cliente encontrado para '{busca}'." |
| Dados | Tabela preenchida. |

**Validações (client-side + server-side):**
- `nome`: obrigatório, 3-150 caracteres.
- `email`: se preenchido, formato válido.
- `documento`: se preenchido, formato CPF ou CNPJ (máscara visual).
- `documento`: unicidade validada no backend (erro 409 tratado no modal).

**UX:**
- Modal fecha com Escape, clique fora, ou botão Cancelar.
- Após criar/editar com sucesso: modal fecha, tabela recarrega automaticamente (invalidação React Query).
- Máscara de documento: `999.999.999-99` (CPF) ou `99.999.999/9999-99` (CNPJ).
- Coluna "Ações" com largura fixa de 80px, alinhada à direita.

**O que não entra:** exclusão de cliente, endereço completo (CEP, cidade, estado), tipo de pessoa (física/jurídica), busca avançada com múltiplos filtros, ordenação por coluna, exportação de lista.

---

### 6.4 Ordens de Serviço (`OrdensPage`)

**Objetivo:** listar, filtrar e criar OS.

**Componentes:**
```
OrdensPage
├── PageHeader
│   ├── Título "Ordens de Serviço"
│   └── Button "Nova OS" → abre OrdemModal
├── FilterBar
│   ├── SearchInput (busca por número, título, cliente)
│   ├── EstagioSelect (dropdown com todos os estágios + opção "Todos")
│   └── ClienteSelect (dropdown assíncrono com busca)
├── OrdemTable
│   ├── thead: Nº OS | Título | Cliente | Estágio | Pendências | PDF | Data
│   └── tbody:
│       └── OrdemRow
│           ├── Número (link → /ordens/:id)
│           ├── Título (truncado em 1 linha)
│           ├── Nome do cliente
│           ├── EstagioBadge (com cor por estágio)
│           ├── PendenciaBadge (ícone de alerta se houver pendência não resolvida)
│           ├── PdfBadge (ícone de check se PDF existe, ícone de alerta se não)
│           └── Data de criação (formatada DD/MM/AAAA)
├── Pagination
└── OrdemModal (criação)
    ├── ModalOverlay
    ├── ModalContent
    │   ├── ModalHeader ("Nova Ordem de Serviço")
    │   ├── ClienteSelect* (dropdown com busca, obrigatório)
    │   ├── TituloInput* (obrigatório, 5-200 caracteres)
    │   ├── DescricaoTextarea
    │   ├── DataPrevisaoInput (type=date, min=hoje)
    │   └── ModalFooter
    │       ├── Button "Cancelar"
    │       └── Button "Criar OS" (com spinner)
    └── ErrorMessage
```

**Dados consumidos:**
- `GET /api/ordens?pagina=1&limite=20&estagio=xxx&cliente_id=xxx&busca=xxx`
- `GET /api/clientes?limite=100` (para popular ClienteSelect)
- `POST /api/ordens`

**Ações:**
- Filtrar: selecionar estágio e/ou cliente e/ou digitar busca → tabela atualiza.
- Criar: botão "Nova OS" → modal → preencher → "Criar OS" → redireciona para `/ordens/:id`.
- Navegar: clicar no número da OS → `/ordens/:id`.
- Paginar.

**Cores dos EstagioBadge (Tailwind):**

| Estágio | Cor do badge |
|---------|-------------|
| ABERTA | `blue-100 text-blue-800` |
| EM_ANALISE | `purple-100 text-purple-800` |
| ENVIADA_AO_CLIENTE | `indigo-100 text-indigo-800` |
| AGUARDANDO_RETORNO | `amber-100 text-amber-800` |
| AGENDADA | `cyan-100 text-cyan-800` |
| EM_EXECUCAO | `orange-100 text-orange-800` |
| CONCLUIDA | `green-100 text-green-800` |
| RELATORIO_ENTREGUE | `teal-100 text-teal-800` |
| ENCERRADA | `gray-200 text-gray-600` |

**Estados:**

| Estado | Renderização |
|--------|-------------|
| Carregando | 7 linhas de skeleton. |
| Erro | "Erro ao carregar ordens." + "Tentar novamente". |
| Vazio (sem filtro) | "Nenhuma ordem de serviço." + botão "Criar primeira OS". |
| Vazio (com filtro) | "Nenhuma OS encontrada para os filtros atuais." |
| Dados | Tabela preenchida. |

**UX:**
- Filtros aplicam automaticamente ao mudar seleção (sem botão "Filtrar").
- URL da página reflete os filtros via query params para deep-link: `/ordens?estagio=EM_EXECUCAO`.
- ClienteSelect carrega clientes com busca local (fetch único de até 100 clientes, filtra no client-side).
- Após criar OS, redireciona para o detalhe dela (onde o usuário pode gerenciar pendências, anexos, estágio).

**O que não entra:** edição inline na tabela, exclusão de OS, seleção múltipla, ações em lote, mudança de estágio direto na lista, ordenação por coluna clicável, exportação CSV/PDF da lista.

---

### 6.5 Detalhe da OS (`OrdemDetalhePage`)

**Objetivo:** tela central do sistema. Exibe todos os dados da OS e permite todas as operações: mudar estágio, gerenciar pendências, anexos, gerar PDF e visualizar histórico.

**Componentes:**
```
OrdemDetalhePage
├── BackButton ("← Voltar para Ordens")
├── OrdemHeader
│   ├── Número + Título
│   ├── EstagioBadge (estágio atual)
│   ├── EstagioSelect (dropdown com próximos estágios permitidos)
│   ├── Button "Confirmar mudança" (só visível se estágio selecionado ≠ atual)
│   ├── PdfStatusBadge ("PDF gerado" ou "Sem PDF")
│   └── GerarPdfButton (ícone + "Gerar PDF")
│
├── Grid (2 colunas no desktop, 1 no mobile)
│   ├── Coluna esquerda
│   │   ├── OrdemInfoCard
│   │   │   ├── Descrição (texto completo)
│   │   │   ├── Data de abertura
│   │   │   ├── Previsão
│   │   │   └── Criado por
│   │   ├── PendenciasSection
│   │   │   ├── SectionHeader ("Pendências", contador)
│   │   │   ├── PendenciaForm
│   │   │   │   ├── TextInput + Button "Adicionar"
│   │   │   │   └── Caracteres restantes (500 - digitados)
│   │   │   └── PendenciaList
│   │   │       └── PendenciaItem
│   │   │           ├── CheckCircle (verde se resolvida, cinza se não)
│   │   │           ├── Descrição
│   │   │           ├── Data de criação
│   │   │           ├── Criado por
│   │   │           └── Button "Concluir" (só se não resolvida)
│   │   └── AnexosSection
│   │       ├── SectionHeader ("Anexos", contador)
│   │       ├── AnexoUpload (drag & drop ou input file)
│   │       └── AnexoList
│   │           └── AnexoItem
│   │               ├── Ícone (imagem, PDF, doc genérico)
│   │               ├── Nome original
│   │               ├── Tamanho (formatado: KB/MB)
│   │               ├── Data de upload
│   │               └── Button "Download"
│   │
│   └── Coluna direita
│       ├── ClienteCard
│       │   ├── Nome do cliente (link para cliente? Não no MVP)
│       │   ├── Email
│       │   ├── Telefone
│       │   ├── Documento
│       │   └── Endereço
│       └── HistoricoSection
│           ├── SectionHeader ("Histórico")
│           └── Timeline
│               └── TimelineItem
│                   ├── Ícone do tipo (círculo colorido)
│                   ├── Descrição
│                   ├── Estágio anterior → novo (se MUDANCA_ESTAGIO)
│                   ├── Usuário
│                   └── Data/hora (formatado DD/MM/AAAA HH:mm)
```

**Dados consumidos:**
- `GET /api/ordens/:id` (retorna tudo: OS + cliente + pendências + histórico + anexos + relatórios)
- `PATCH /api/ordens/:id/estagio`
- `POST /api/ordens/:id/pendencias`
- `PATCH /api/ordens/:id/pendencias/:id/concluir`
- `POST /api/ordens/:id/relatorio`
- `GET /api/ordens/:id/relatorio/download`
- `POST /api/ordens/:id/anexos`
- `GET /api/ordens/:id/anexos/:id/download`

**Ações:**
- Mudar estágio: selecionar novo estágio no dropdown → clicar "Confirmar mudança".
- Adicionar pendência: digitar descrição → Enter ou clicar "Adicionar".
- Concluir pendência: clicar "Concluir" no item.
- Upload anexo: arrastar arquivo ou clicar para selecionar → upload automático.
- Gerar PDF: clicar "Gerar PDF" → spinner → PDF disponível para download.
- Baixar anexo/PDF: clicar ícone de download.
- Voltar: botão "← Voltar para Ordens".

**Validações e regras visuais:**
- EstagioSelect mostra apenas estágios permitidos pela matriz de transição (filtro client-side baseado na matriz documentada na API).
- Se OS está `CONCLUIDA` sem PDF: `GerarPdfButton` fica em destaque (`amber-500`, pulsando?), badge "Sem PDF" em vermelho.
- Se OS está `CONCLUIDA` sem PDF e usuário tenta ir para `RELATORIO_ENTREGUE`: API retorna 409, toast de erro "É necessário gerar o PDF antes.".
- Se OS está `ENCERRADA`: todos os botões de ação ficam desabilitados. Apenas leitura.
- Upload de anexo: mostra barra de progresso. Se arquivo > 10 MB, toast de erro antes de enviar (validação client-side).
- Pendência: botão "Concluir" some após clique, item fica com fundo levemente verde e check verde.

**Estados:**

| Estado | Renderização |
|--------|-------------|
| Carregando inicial | Skeleton da página inteira (header + 2 colunas com retângulos). |
| Erro (carregar OS) | "Erro ao carregar OS." + botão "Tentar novamente". |
| Erro 404 | "OS não encontrada." + botão "Voltar para lista". |
| Erro (operação) | Toast no canto superior direito com mensagem do `error.response.data.error.mensagem`. |
| Dados | Layout completo com todas as seções. |
| OS Encerrada | Todos os botões de ação desabilitados, tooltip "OS encerrada". |

**Detalhes da Timeline (Histórico):**

```
○ Ordem de serviço criada.                    Antônio  13/05/2026 10:00
│
● Estágio alterado: ABERTA → EM_ANALISE       Antônio  13/05/2026 10:15
│
○ Pendência criada: "Confirmar garantia"      Antônio  13/05/2026 10:30
│
○ Anexo adicionado: "foto_notebook.jpg"       Antônio  13/05/2026 11:00
│
● Estágio alterado: EM_ANALISE → EM_EXECUCAO  Antônio  13/05/2026 11:45
│
○ PDF gerado.                                 Antônio  13/05/2026 15:00
│
✓ Pendência concluída: "Confirmar garantia"   Antônio  13/05/2026 16:00
```

Cores dos ícones na timeline:
- `●` azul: `MUDANCA_ESTAGIO`
- `○` cinza: `CRIACAO_OS`, `ANEXO_ADICIONADO`, `PDF_GERADO`
- `○` amber: `PENDENCIA_CRIADA`
- `✓` verde: `PENDENCIA_CONCLUIDA`

**UX:**
- EstagioSelect só habilita o botão "Confirmar mudança" se o valor selecionado ≠ estágio atual.
- Ao clicar "Confirmar mudança", botão mostra spinner e desabilita dropdown até resposta.
- Pendências resolvidas aparecem no final da lista com opacidade reduzida (após as não resolvidas).
- Upload com drag & drop: borda tracejada na área de drop quando arquivo é arrastado sobre ela.
- Toast de sucesso/erro aparece por 4 segundos e desaparece automaticamente (usar `react-hot-toast` ou similar leve).

**O que não entra:** edição inline dos dados da OS (título, descrição), reabertura de OS encerrada, exclusão de pendência, exclusão de anexo, visualização inline de imagem anexada (só download), comentários/discussão, múltiplas abas de OS.

---

## 7. Componentes Reutilizáveis Mínimos

| Componente | Props | Uso |
|-----------|-------|-----|
| `PageHeader` | `title: string`, `actionLabel?: string`, `onAction?: () => void` | Todas as páginas de lista |
| `SearchInput` | `value`, `onChange`, `placeholder` | Clientes, Ordens |
| `EstagioBadge` | `estagio: EstagioOS` | OrdensPage, OrdemDetalhePage |
| `Pagination` | `page`, `total`, `limit`, `onChange` | Clientes, Ordens |
| `Modal` | `open`, `onClose`, `title`, `children` | ClienteModal, OrdemModal |
| `StatCard` | `label`, `value`, `icon`, `color?` | Dashboard |
| `Toast` | (global, via `react-hot-toast`) | Feedback de operações |
| `Skeleton` | `className` (tailwind) | Estados de carregamento |
| `EmptyState` | `message`, `actionLabel?`, `onAction?` | Listas vazias |
| `Spinner` | `size?: 'sm' | 'md'` | Botões e carregamentos inline |

---

## 8. Checklist de Aceite Frontend

- [ ] `LoginPage`: login com sucesso redireciona para `/dashboard`.
- [ ] `LoginPage`: credenciais inválidas mostram erro sem limpar campos.
- [ ] `LoginPage`: usuário inativo mostra erro específico.
- [ ] `LoginPage`: ao recarregar com token válido, vai direto para `/dashboard`.
- [ ] `LoginPage`: ao recarregar com token expirado, cai no `/login`.
- [ ] `Dashboard`: 5 cards carregam dados reais da API.
- [ ] `Dashboard`: polling de 30s atualiza cards sem piscar a tela.
- [ ] `Dashboard`: estado de erro mostra botão "Tentar novamente" funcional.
- [ ] `ClientesPage`: busca com debounce de 300ms funciona.
- [ ] `ClientesPage`: modal de criação salva e fecha com sucesso.
- [ ] `ClientesPage`: modal de edição carrega dados atuais e salva alterações.
- [ ] `ClientesPage`: paginação funciona (avançar, voltar).
- [ ] `ClientesPage`: estado vazio mostra CTA para cadastrar.
- [ ] `OrdensPage`: filtros combinados funcionam (estágio + cliente + busca).
- [ ] `OrdensPage`: criação de OS redireciona para o detalhe.
- [ ] `OrdensPage`: badges coloridos correspondem ao estágio correto.
- [ ] `OrdensPage`: indicador de pendência e PDF funcionam.
- [ ] `OrdemDetalhePage`: carrega todos os dados embutidos (pendências, histórico, anexos, relatórios).
- [ ] `OrdemDetalhePage`: dropdown de estágio mostra apenas transições permitidas.
- [ ] `OrdemDetalhePage`: bloquear `RELATORIO_ENTREGUE` sem PDF (mostrar erro do backend).
- [ ] `OrdemDetalhePage`: bloquear `ENCERRADA` sem `RELATORIO_ENTREGUE`.
- [ ] `OrdemDetalhePage`: ao encerrar, todos os botões desabilitam.
- [ ] `OrdemDetalhePage`: timeline de histórico em ordem cronológica inversa.
- [ ] `OrdemDetalhePage`: criar pendência funciona com Enter e com botão.
- [ ] `OrdemDetalhePage`: concluir pendência some o botão e atualiza visual.
- [ ] `OrdemDetalhePage`: upload de anexo mostra progresso e feedback de sucesso.
- [ ] `OrdemDetalhePage`: upload de arquivo > 10 MB é bloqueado no client-side.
- [ ] `OrdemDetalhePage`: gerar PDF mostra spinner e depois libera download.
- [ ] `OrdemDetalhePage`: download de PDF e anexos funcionam.
- [ ] `OrdemDetalhePage`: botão "Voltar" retorna para lista com filtros preservados.
- [ ] Sidebar: navegação entre páginas funciona.
- [ ] Sidebar: logout remove token e redireciona para `/login`.
- [ ] 401 global: qualquer resposta 401 faz logout automático.
- [ ] Toast: operações bem-sucedidas e erros mostram feedback visual.
- [ ] Layout: responsivo em 1024px+ (uso principal em desktop na rede local).

---

## 9. O que NÃO entra no frontend MVP

- Tela de gestão de usuários (CRUD de usuários).
- Tela de configurações (tema, logo, cores).
- Tela de backup.
- Tela de relatórios gerenciais.
- Gráficos no dashboard.
- Modo escuro.
- Internacionalização (i18n).
- Notificações em tempo real (WebSocket).
- Editor de rich text.
- Pré-visualização inline de anexos (imagens).
- Upload múltiplo de anexos (um por vez no MVP).
- Exclusão de qualquer entidade (cliente, OS, pendência, anexo).
- Ordenação de tabelas por clique no cabeçalho.
- Exportação de listas (CSV, Excel).
- Impressão direta da OS pelo navegador.
- Cache offline / PWA.
- Testes automatizados (fora do escopo inicial).
