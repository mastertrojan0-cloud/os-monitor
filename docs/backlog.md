# OS Monitor — Backlog MVP

## Visão Geral

| Item | Valor |
|------|-------|
| Duração estimada | 4 a 6 semanas |
| Sprints | 5 sprints de ±1 semana |
| Total de histórias | 24 |
| Épicos | 7 |
| Time | 1 fullstack ou 2 devs (1 back + 1 front) |

---

## Épicos

| # | Épico | Objetivo |
|---|-------|----------|
| E1 | Infraestrutura e Setup | Projeto base funcional: banco, servidor, autenticação, frontend rodando em rede local. |
| E2 | Gestão de Clientes | CRUD completo de clientes com busca e paginação. |
| E3 | Gestão de Ordens de Serviço | CRUD de OS, listagem com filtros, tela de detalhe. |
| E4 | Fluxo da OS | Transição de estágios com validações e histórico automático. |
| E5 | Pendências | Criação e conclusão de pendências vinculadas à OS, com histórico. |
| E6 | Relatórios e Anexos | Geração de PDF, upload/download de anexos, armazenamento local. |
| E7 | Dashboard | Tela inicial com resumo do sistema. |

---

## Histórias de Usuário

### E1 — Infraestrutura e Setup

**US-01: Setup do projeto**
> Como desenvolvedor, quero inicializar o projeto com estrutura de pastas, dependências e configurações de TypeScript, para ter uma base padronizada.

Critérios de aceite:
- [ ] Estrutura `os-monitor/backend/` com `package.json`, `tsconfig.json`, `.env`, `prisma/schema.prisma`.
- [ ] Estrutura `os-monitor/frontend/` com Vite + React + TypeScript + Tailwind.
- [ ] Estrutura `os-monitor/storage/relatorios/` e `os-monitor/storage/anexos/`.
- [ ] `README.md` com instruções de instalação e execução.
- [ ] `.gitignore` cobrindo `node_modules`, `.env`, `storage/`, `dist/`.

Prioridade: **P0** | Dependências: nenhuma | Estimativa: 2h

---

**US-02: Banco de dados e migration inicial**
> Como desenvolvedor, quero rodar a primeira migration do Prisma com todas as 7 tabelas, para ter o banco funcional.

Critérios de aceite:
- [ ] `prisma migrate dev` executa com sucesso.
- [ ] Todas as tabelas (`usuarios`, `clientes`, `ordens_servico`, `pendencias`, `historico`, `relatorios_pdf`, `anexos`) são criadas no PostgreSQL.
- [ ] Seed script insere 1 usuário admin (`admin@osmonitor.local` / `admin123`).

Prioridade: **P0** | Dependências: US-01 | Estimativa: 1h30

---

**US-03: Servidor Express e middleware de autenticação**
> Como desenvolvedor, quero um servidor Express com middleware de JWT, CORS e error handler global, para servir a API com segurança.

Critérios de aceite:
- [ ] `server.ts` sobe na porta `3001`.
- [ ] `authMiddleware` extrai e valida JWT do header `Authorization`.
- [ ] `errorHandler` captura exceções e retorna `{ error: { codigo, mensagem } }`.
- [ ] `cors` configurado para aceitar requisições da rede local.
- [ ] Resposta `GET /api/health` retorna `{ status: "ok" }` sem autenticação.

Prioridade: **P0** | Dependências: US-01 | Estimativa: 2h

---

**US-04: Login**
> Como usuário, quero fazer login com email e senha para acessar o sistema.

Critérios de aceite:
- [ ] `POST /api/auth/login` valida credenciais e retorna JWT + dados do usuário.
- [ ] Senha inválida retorna 401 com mensagem "Email ou senha incorretos.".
- [ ] Usuário inativo retorna 403 com mensagem "Usuário inativo.".
- [ ] `GET /api/auth/me` retorna dados do usuário autenticado.
- [ ] Tela de login com campos de email e senha.
- [ ] Após login, token armazenado em `localStorage` e usuário redirecionado para `/dashboard`.
- [ ] Token expirado ou ausente redireciona para `/login`.
- [ ] Logout limpa token e redireciona para `/login`.

Prioridade: **P0** | Dependências: US-02, US-03 | Estimativa: 4h

---

### E2 — Gestão de Clientes

**US-05: Criar cliente**
> Como usuário, quero cadastrar um novo cliente, para vinculá-lo a ordens de serviço.

Critérios de aceite:
- [ ] `POST /api/clientes` cria cliente com validação de campos obrigatórios.
- [ ] `nome` obrigatório (3-150 caracteres).
- [ ] `documento` único se informado (validação server-side).
- [ ] Modal de criação no frontend com campos: nome*, email, telefone, documento, endereço, observações.
- [ ] Ao salvar com sucesso, modal fecha e lista de clientes recarrega.
- [ ] Erros de validação aparecem abaixo do campo inválido.

Prioridade: **P1** | Dependências: US-04 | Estimativa: 3h

---

**US-06: Listar e buscar clientes**
> Como usuário, quero visualizar a lista de clientes e buscar por nome, email ou documento.

Critérios de aceite:
- [ ] `GET /api/clientes` retorna lista paginada.
- [ ] Query param `busca` filtra por `nome`, `email`, `documento`.
- [ ] Paginação funcional (20 por página, máximo 100).
- [ ] Tabela no frontend com colunas: nome, email, telefone, documento, ações.
- [ ] Campo de busca com debounce de 300ms.
- [ ] Paginação com botões anterior/próximo e indicação de página atual.
- [ ] Estado vazio: "Nenhum cliente cadastrado." + botão para cadastrar.
- [ ] Estado de carregamento: skeleton na tabela.

Prioridade: **P1** | Dependências: US-05 | Estimativa: 3h

---

**US-07: Editar cliente**
> Como usuário, quero editar os dados de um cliente existente, para manter o cadastro atualizado.

Critérios de aceite:
- [ ] `PUT /api/clientes/:id` atualiza campos informados.
- [ ] Modal de edição abre preenchido com dados atuais.
- [ ] Após salvar, modal fecha e lista recarrega.
- [ ] Botão "Editar" em cada linha da tabela.

Prioridade: **P2** | Dependências: US-06 | Estimativa: 2h

---

### E3 — Gestão de Ordens de Serviço

**US-08: Criar OS**
> Como usuário, quero criar uma nova ordem de serviço com cliente, título e descrição, para iniciar o atendimento.

Critérios de aceite:
- [ ] `POST /api/ordens` cria OS com `numero` gerado automaticamente (`OS-AAAA-NNNNN`).
- [ ] OS inicia sempre no estágio `ABERTA`.
- [ ] Criação gera automaticamente registro no histórico (`CRIACAO_OS`).
- [ ] Toda operação roda em transação Prisma.
- [ ] Modal de criação com campos: cliente* (dropdown), título*, descrição, data de previsão.
- [ ] Após criar, redireciona para tela de detalhe da OS (`/ordens/:id`).
- [ ] Validação: título obrigatório (5-200 caracteres), cliente obrigatório.

Prioridade: **P0** | Dependências: US-04, US-05 | Estimativa: 4h

---

**US-09: Listar e filtrar OS**
> Como usuário, quero visualizar a lista de OS e filtrar por estágio, cliente e busca textual.

Critérios de aceite:
- [ ] `GET /api/ordens` retorna lista paginada com filtros combináveis.
- [ ] Filtros: `estagio`, `cliente_id`, `busca` (número, título, nome do cliente).
- [ ] Tabela com colunas: número, título, cliente, estágio (badge colorido), pendências (indicador), PDF (indicador), data.
- [ ] Filtro de estágio: dropdown com opção "Todos".
- [ ] Filtro de cliente: dropdown com busca.
- [ ] Indicador visual de pendência não resolvida (ícone de alerta).
- [ ] Indicador visual se PDF foi gerado (check verde / alerta).
- [ ] Filtros preservados na URL (query params) e ao voltar do detalhe.

Prioridade: **P0** | Dependências: US-08 | Estimativa: 4h

---

**US-10: Detalhe da OS (dados e cliente)**
> Como usuário, quero visualizar todos os dados de uma OS e do cliente vinculado em uma tela dedicada.

Critérios de aceite:
- [ ] `GET /api/ordens/:id` retorna OS + cliente + pendências + histórico + anexos + relatórios (tudo em uma chamada).
- [ ] Tela exibe: número, título, descrição, estágio atual (badge), datas, cliente (nome, email, telefone, documento, endereço).
- [ ] Botão "Voltar para Ordens" retorna para a lista com filtros preservados.
- [ ] Estado de carregamento: skeleton completo da página.
- [ ] Estado 404: "OS não encontrada." + botão voltar.

Prioridade: **P0** | Dependências: US-08 | Estimativa: 4h

---

### E4 — Fluxo da OS

**US-11: Mudar estágio da OS**
> Como usuário, quero avançar ou retroceder o estágio da OS conforme o fluxo de trabalho, respeitando as regras de transição.

Critérios de aceite:
- [ ] `PATCH /api/ordens/:id/estagio` altera o estágio.
- [ ] Matriz de transição completa: avanços e retrocessos permitidos por estágio.
- [ ] Transição inválida retorna 409 com mensagem descritiva.
- [ ] OS `ENCERRADA` retorna 409: "OS encerrada não pode ser reaberta.".
- [ ] Toda mudança de estágio gera histórico (`MUDANCA_ESTAGIO`) com `estagio_anterior` e `estagio_novo`.
- [ ] Operação em transação Prisma (update OS + insert histórico).
- [ ] Dropdown de estágio no detalhe da OS mostra apenas transições permitidas.
- [ ] Botão "Confirmar mudança" só aparece se seleção ≠ estágio atual.
- [ ] Após confirmação, estágio e timeline atualizam sem recarregar a página inteira.

Prioridade: **P0** | Dependências: US-10 | Estimativa: 5h

---

**US-12: Exibir histórico da OS**
> Como usuário, quero visualizar o histórico completo de operações da OS, em ordem cronológica, para auditar o que foi feito.

Critérios de aceite:
- [ ] Histórico retornado embutido no `GET /api/ordens/:id`, ordenado por `criado_em DESC`.
- [ ] Timeline visual no detalhe da OS com ícones coloridos por tipo de evento.
- [ ] Cada item mostra: tipo (ícone), descrição, estágios (se mudança), usuário, data/hora.
- [ ] Histórico é somente leitura — sem botões de editar ou excluir.
- [ ] Timeline cobre todos os tipos: `CRIACAO_OS`, `MUDANCA_ESTAGIO`, `PENDENCIA_CRIADA`, `PENDENCIA_CONCLUIDA`, `ANEXO_ADICIONADO`, `PDF_GERADO`.

Prioridade: **P1** | Dependências: US-11 | Estimativa: 3h

---

**US-13: Bloquear RELATORIO_ENTREGUE sem PDF**
> Como usuário, quero que o sistema impeça a transição para RELATORIO_ENTREGUE se o relatório PDF não tiver sido gerado.

Critérios de aceite:
- [ ] `PATCH /api/ordens/:id/estagio` para `RELATORIO_ENTREGUE` valida existência de `RelatorioPdf`.
- [ ] Sem PDF: retorna 409 com código `PDF_NAO_GERADO`.
- [ ] Frontend exibe toast de erro: "É necessário gerar o relatório PDF antes.".
- [ ] Frontend destaca visualmente o botão "Gerar PDF" quando OS está `CONCLUIDA` sem PDF.

Prioridade: **P1** | Dependências: US-11, US-18 | Estimativa: 1h30

---

**US-14: Bloquear ENCERRADA sem RELATORIO_ENTREGUE**
> Como usuário, quero que o sistema impeça encerrar uma OS que não passou por RELATORIO_ENTREGUE.

Critérios de aceite:
- [ ] `PATCH /api/ordens/:id/estagio` para `ENCERRADA` valida que o estágio atual é `RELATORIO_ENTREGUE`.
- [ ] Transição inválida retorna 409 com código `TRANSICAO_INVALIDA`.
- [ ] OS encerrada bloqueia todas as ações no frontend (botões desabilitados, tooltip "OS encerrada").

Prioridade: **P1** | Dependências: US-11 | Estimativa: 1h30

---

### E5 — Pendências

**US-15: Criar pendência**
> Como usuário, quero adicionar pendências a uma OS, para registrar itens que precisam de atenção antes da conclusão.

Critérios de aceite:
- [ ] `POST /api/ordens/:ordemId/pendencias` cria pendência vinculada à OS.
- [ ] Criação gera histórico (`PENDENCIA_CRIADA`) em transação.
- [ ] Não permite criar pendência em OS `ENCERRADA` (retorna 400).
- [ ] Campo de texto + botão "Adicionar" na seção de pendências do detalhe da OS.
- [ ] Submissão com Enter ou clique no botão.
- [ ] Contador de caracteres restantes (limite 500).
- [ ] Nova pendência aparece na lista imediatamente após criada (invalidação otimista).

Prioridade: **P1** | Dependências: US-10 | Estimativa: 3h

---

**US-16: Concluir pendência**
> Como usuário, quero marcar uma pendência como resolvida, para indicar que o item foi tratado.

Critérios de aceite:
- [ ] `PATCH /api/ordens/:ordemId/pendencias/:id/concluir` marca como resolvida.
- [ ] Conclusão gera histórico (`PENDENCIA_CONCLUIDA`) em transação.
- [ ] Endpoint idempotente: chamar novamente em pendência já resolvida retorna 200 sem erro.
- [ ] Botão "Concluir" em cada pendência não resolvida.
- [ ] Após concluir: check verde, botão some, item com opacidade reduzida.
- [ ] Pendências resolvidas agrupadas abaixo das não resolvidas.

Prioridade: **P1** | Dependências: US-15 | Estimativa: 2h30

---

### E6 — Relatórios e Anexos

**US-17: Upload de anexo**
> Como usuário, quero anexar arquivos (imagens, documentos) a uma OS, para documentar o atendimento.

Critérios de aceite:
- [ ] `POST /api/ordens/:ordemId/anexos` recebe arquivo via `multipart/form-data`.
- [ ] Arquivo salvo em `storage/anexos/{ano}/{mes}/{cuid}_{nome_original}`.
- [ ] Banco registra apenas metadados (nome, caminho, tipo, tamanho).
- [ ] Upload gera histórico (`ANEXO_ADICIONADO`) em transação.
- [ ] Limite 10 MB validado no backend (middleware multer) e no frontend.
- [ ] Extensões permitidas: `.jpg`, `.jpeg`, `.png`, `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`.
- [ ] Não permite upload em OS `ENCERRADA`.
- [ ] Área de upload no detalhe da OS com drag & drop.
- [ ] Barra de progresso durante upload.
- [ ] Lista de anexos com nome, tamanho, data e botão download.

Prioridade: **P1** | Dependências: US-10 | Estimativa: 4h

---

**US-18: Gerar relatório PDF**
> Como usuário, quero gerar um relatório em PDF da OS com os dados do atendimento, para entrega ao cliente.

Critérios de aceite:
- [ ] `POST /api/ordens/:ordemId/relatorio` gera PDF via HTML → PDF (Puppeteer/Playwright).
- [ ] PDF salvo em `storage/relatorios/OS-{numero}_relatorio.pdf`.
- [ ] Banco registra metadados (nome, caminho, tamanho).
- [ ] Geração registra histórico (`PDF_GERADO`) em transação.
- [ ] Botão "Gerar PDF" no detalhe da OS.
- [ ] Spinner durante geração (pode levar alguns segundos).
- [ ] Após gerado, aparece badge "PDF gerado" e botão de download.
- [ ] `GET /api/ordens/:ordemId/relatorio` retorna metadados do PDF (null se não existe).
- [ ] `GET /api/ordens/:ordemId/relatorio/download` faz streaming do arquivo.

Prioridade: **P1** | Dependências: US-10 | Estimativa: 5h

---

### E7 — Dashboard

**US-19: Dashboard**
> Como usuário, quero ver um resumo do sistema na tela inicial, com totais de OS, pendências e clientes.

Critérios de aceite:
- [ ] `GET /api/dashboard` retorna agregados: total OS, OS por estágio, pendências abertas, OS sem PDF, total clientes.
- [ ] Cards no frontend: Total OS, Pendências abertas (amber), OS sem PDF (red), Total clientes.
- [ ] Atualização automática a cada 30s (polling silencioso).
- [ ] Estado de carregamento: skeleton nos cards.
- [ ] Estado de erro: mensagem + botão "Tentar novamente".
- [ ] Cards com números grandes e ícones representativos.
- [ ] Sem gráficos ou tabelas no MVP.

Prioridade: **P2** | Dependências: US-04 | Estimativa: 3h

---

### Ajustes finais e qualidade

**US-20: Navegação e layout**
> Como usuário, quero uma barra lateral de navegação com links para Dashboard, Clientes e Ordens, e meu nome com opção de logout.

Critérios de aceite:
- [ ] Sidebar fixa à esquerda (240px) com logo, itens de menu e rodapé com usuário.
- [ ] Item ativo destacado visualmente.
- [ ] Layout responsivo mínimo: sidebar colapsa em telas < 768px (MVP foca em desktop).
- [ ] Logout no menu do usuário limpa token e redireciona.

Prioridade: **P1** | Dependências: US-04 | Estimativa: 2h

---

**US-21: Tratamento de erros e feedback**
> Como usuário, quero receber feedback claro sobre o resultado das minhas ações, com mensagens de sucesso e erro.

Critérios de aceite:
- [ ] Toast de sucesso para operações bem-sucedidas (criação, edição, upload, etc.).
- [ ] Toast de erro para falhas com mensagem do backend.
- [ ] Estados de carregamento em todos os botões de ação (spinner + desabilitado).
- [ ] Estados de erro em todas as listas com botão "Tentar novamente".
- [ ] Estados vazios em todas as listas com CTA contextual.
- [ ] Tratamento global de 401 (logout automático).
- [ ] Tratamento global de 500 (mensagem genérica, sem stack trace).

Prioridade: **P1** | Dependências: US-04 | Estimativa: 3h

---

**US-22: Configuração de rede local**
> Como administrador, quero que o sistema seja acessível por outras máquinas da rede local, sem necessidade de internet.

Critérios de aceite:
- [ ] Backend escuta em `0.0.0.0:3001`.
- [ ] Frontend build servido pelo Express (estáticos da pasta `frontend/dist/`).
- [ ] `VITE_API_URL` configurável apontando para o IP do servidor.
- [ ] Acesso via `http://<ip-servidor>:3001` a partir de qualquer máquina da rede.
- [ ] Funcionamento validado sem conexão com internet (todas as dependências instaladas localmente).

Prioridade: **P1** | Dependências: US-03 | Estimativa: 2h

---

**US-23: Script de seed**
> Como desenvolvedor, quero um script que popule o banco com dados de exemplo, para testar e demonstrar o sistema.

Critérios de aceite:
- [ ] Seed cria: 2 usuários, 10 clientes, 15 OS em estágios variados, pendências, anexos de exemplo.
- [ ] `prisma db seed` executável via `npx prisma db seed`.
- [ ] Dados não conflitam com dados reais (ids aleatórios).

Prioridade: **P2** | Dependências: US-02 | Estimativa: 1h30

---

**US-24: Geração de PDF com dados reais**
> Como usuário, quero que o PDF gerado contenha os dados reais da OS: cabeçalho, cliente, descrição, estágio, pendências resolvidas e datas.

Critérios de aceite:
- [ ] Template HTML com: logo do sistema, número OS, título, cliente (nome, doc, endereço), descrição, estágio atual, data abertura, data previsão.
- [ ] Lista de pendências resolvidas com data de resolução.
- [ ] Rodapé com data de geração e usuário que gerou.
- [ ] Layout limpo, profissional, A4.
- [ ] Sem pendências não resolvidas no PDF (apenas as concluídas).
- [ ] Testado com OS em qualquer estágio (dados variam conforme preenchimento).

Prioridade: **P2** | Dependências: US-18 | Estimativa: 4h

---

## Sugestão de Sprints

### Sprint 1 — Fundação (Semana 1-2)
| US | Título | Esforço |
|----|--------|---------|
| US-01 | Setup do projeto | 2h |
| US-02 | Banco e migration | 1h30 |
| US-03 | Servidor + middleware | 2h |
| US-04 | Login | 4h |
| US-22 | Configuração rede local | 2h |
| **Total** | | **~11h30** |

**Entrega:** servidor rodando na rede local, login funcional.

---

### Sprint 2 — CRUDs Base (Semana 2-3)
| US | Título | Esforço |
|----|--------|---------|
| US-05 | Criar cliente | 3h |
| US-06 | Listar/buscar clientes | 3h |
| US-07 | Editar cliente | 2h |
| US-08 | Criar OS | 4h |
| US-09 | Listar/filtrar OS | 4h |
| US-10 | Detalhe da OS | 4h |
| US-20 | Navegação e layout | 2h |
| **Total** | | **~22h** |

**Entrega:** CRUD completo de clientes e OS, navegação funcional.

---

### Sprint 3 — Fluxo e Histórico (Semana 3-4)
| US | Título | Esforço |
|----|--------|---------|
| US-11 | Mudar estágio | 5h |
| US-12 | Exibir histórico | 3h |
| US-14 | Bloquear ENCERRADA | 1h30 |
| US-15 | Criar pendência | 3h |
| US-16 | Concluir pendência | 2h30 |
| US-21 | Tratamento de erros | 3h |
| **Total** | | **~18h** |

**Entrega:** fluxo completo de estágios com histórico e pendências.

---

### Sprint 4 — PDF e Anexos (Semana 4-5)
| US | Título | Esforço |
|----|--------|---------|
| US-17 | Upload de anexo | 4h |
| US-18 | Gerar PDF | 5h |
| US-13 | Bloquear RELATORIO_ENTREGUE | 1h30 |
| US-24 | Template PDF com dados reais | 4h |
| **Total** | | **~14h30** |

**Entrega:** upload de anexos, geração de PDF, todos os bloqueios funcionais.

---

### Sprint 5 — Dashboard e Finalização (Semana 5-6)
| US | Título | Esforço |
|----|--------|---------|
| US-19 | Dashboard | 3h |
| US-23 | Script de seed | 1h30 |
| — | Testes manuais de regressão | 3h |
| — | Ajustes finos de UX | 3h |
| — | Documentação de deploy local | 1h30 |
| **Total** | | **~12h** |

**Entrega:** sistema completo e testado.

---

## Ordem Recomendada de Implementação

```
Sprint 1          Sprint 2           Sprint 3           Sprint 4          Sprint 5
US-01 ───┐        US-05 ───┐         US-11 ───┐         US-17 ───┐        US-19
US-02 ───┤        US-06 ───┤         US-12 ───┤         US-18 ───┤        US-23
US-03 ───┤   →    US-07     │    →    US-14     │    →    US-13     │   →   Testes
US-04 ───┤        US-08 ───┤         US-15 ───┤         US-24      │        Ajustes
US-22 ───┘        US-09 ───┤         US-16     │                    │        Docs
                  US-10 ───┤         US-21 ───┘                    ┘
                  US-20 ───┘
```

Regra de ouro: **backend antes do frontend em cada história, exceto setup onde ambos são paralelos.**

---

## Itens EXPLICITAMENTE FORA do MVP

| # | Item | Motivo |
|----|------|--------|
| 1 | CRUD de usuários | Apenas seed inicial. Interface de gestão fica para v2. |
| 2 | Perfis/permissões (admin, técnico, etc.) | MVP tem um único nível de acesso. |
| 3 | Recuperação de senha | Sem envio de email. Reset manual pelo admin no banco. |
| 4 | Exclusão de qualquer entidade | Segurança: sem soft-delete nem hard-delete. |
| 5 | Dashboard com gráficos | Apenas cards numéricos no MVP. |
| 6 | Filtros por período/data no dashboard | Escopo futuro. |
| 7 | Ordenação de tabelas por clique no cabeçalho | Ordenação fixa (data de criação DESC). |
| 8 | Exportação CSV/Excel | Fora do escopo. |
| 9 | Múltiplos modelos de PDF | Um único template para todas as OS. |
| 10 | Assinatura digital no PDF | Complexidade desnecessária no MVP. |
| 11 | Pré-visualização inline de anexos | Apenas download. |
| 12 | Upload múltiplo de anexos | Um arquivo por vez no MVP. |
| 13 | Modo escuro / temas | Apenas tema claro padrão. |
| 14 | Responsivo mobile | Foco em desktop. Funcionalidade básica em tablet. |
| 15 | Internacionalização (i18n) | Apenas português. |
| 16 | WebSocket / notificações em tempo real | Polling simples no dashboard. |
| 17 | PWA / cache offline | Fora do escopo. |
| 18 | Logs em arquivo | Console.log suficiente para MVP. |
| 19 | Backup pela interface | Script manual de dump + ZIP. |
| 20 | Instalador / empacotamento | Instruções manuais de setup no README. |
| 21 | Docker / containers | Setup direto com Node.js + PostgreSQL. |
| 22 | Testes automatizados (unit/e2e) | Testes manuais no MVP. Framework de testes na v2. |
| 23 | CI/CD | Fora do escopo. |
| 24 | Validação de CPF/CNPJ real | Apenas formato e unicidade. |

---

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de histórias | 24 |
| Total de épicos | 7 |
| Sprints | 5 |
| Horas estimadas | ~78h |
| Semanas (1 dev) | 5-6 semanas |
| Semanas (2 devs) | 4-5 semanas |
