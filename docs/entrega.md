# OS Monitor — Entrega Final do MVP

**Versão:** 1.0.0 | **Data:** Maio 2026

---

## 1. Checklist de Apresentação

Antes de demonstrar:

- [ ] PostgreSQL 18 rodando (serviço `postgresql-x64-18`)
- [ ] Banco `os_monitor` populado com seed (`npx prisma db seed`)
- [ ] Backend iniciado (`cd backend && npm run dev`) — `http://localhost:3001`
- [ ] Frontend iniciado ou buildado (`cd frontend && npm run dev`) — `http://localhost:5173`
- [ ] Navegador aberto, sem outras abas que exponham dados sensíveis
- [ ] Usuário admin logado: `admin@osmonitor.local` / `admin123`
- [ ] Rede local configurada (se for demonstrar de outra máquina): `http://<ip>:3001`

---

## 2. Roteiro de Demonstração (10 minutos)

### Minuto 0–1: Login e Dashboard
- Mostrar tela de login
- Logar com `admin@osmonitor.local`
- Apontar os cards do dashboard: 12 OS, 5 pendências abertas, 2 OS sem PDF, 10 clientes
- Mostrar a distribuição por 9 estágios

### Minuto 1–3: Clientes
- Navegar para "Clientes"
- Mostrar a lista paginada (10 clientes)
- Demonstrar busca por nome
- Criar um cliente rápido (nome, telefone)
- Editar o cliente recém-criado

### Minuto 3–5: Criação de OS
- Navegar para "Ordens de Serviço" — mostrar filtros por estágio
- Clicar "Nova OS", selecionar cliente, preencher título
- Apontar que a OS inicia em `ABERTA` automaticamente
- Clicar no número da OS → tela de detalhe

### Minuto 5–7: Fluxo da OS e Histórico
- No detalhe, mostrar o estágio atual (badge colorido)
- Avançar estágio: `ABERTA` → `EM_ANALISE` → `ENVIADA_AO_CLIENTE`
- Apontar a timeline do histórico se atualizando a cada mudança
- Tentar pular para `CONCLUIDA` diretamente → mostrar erro 409
- Fazer retrocesso: voltar para `EM_ANALISE` → ok

### Minuto 7–8: Pendências
- Criar uma pendência: "Verificar garantia"
- Criar outra: "Comprar peça"
- Concluir a primeira pendência
- Mostrar o histórico registrando cada operação

### Minuto 8–9: PDF e Encerramento
- Avançar OS até `CONCLUIDA`
- Clicar "Gerar PDF" → badge "PDF gerado" aparece
- Avançar para `RELATORIO_ENTREGUE` → permitido (tem PDF)
- Clicar "Download PDF" → abrir PDF no navegador
- Avançar para `ENCERRADA` → OS entra em modo leitura
- Mostrar que todos os botões desabilitam

### Minuto 9–10: Anexos e Encerramento
- Voltar para uma OS em `EM_EXECUCAO`
- Arrastar uma imagem para upload
- Mostrar o anexo na lista
- Baixar o anexo
- Resumo: "12 operações, tudo registrado no histórico, tudo transacionado"

---

## 3. README para Usuário Técnico

```
OS Monitor v1.0.0 — Sistema de Monitoramento de Ordens de Serviço
================================================================

PARA INICIAR:
  cd backend  && npm run dev     → http://localhost:3001
  cd frontend && npm run dev     → http://localhost:5173

ACESSO:
  admin@osmonitor.local    / admin123
  tecnico@osmonitor.local  / admin123

ESTRUTURA:
  backend/          API Node.js + Express (porta 3001)
  frontend/         React + Vite (porta 5173 dev)
  storage/          PDFs e anexos (raiz do projeto)
  docs/             Documentação técnica
  scripts/          setup-postgresql.ps1

COMANDOS ÚTEIS:
  npx prisma db seed          recriar dados de exemplo
  npx prisma migrate dev      aplicar migrations pendentes
  npx prisma studio           inspecionar banco visualmente

BACKUP:
  pg_dump os_monitor > backup.sql
  Compactar pasta storage/

REDE LOCAL:
  Backend escuta em 0.0.0.0:3001
  Frontend build servido pelo Express
  Acessar via http://<ip-do-servidor>:3001

LIMITES:
  Anexos: até 10 MB, extensões jpg/png/pdf/doc/docx/xls/xlsx
  Pendências: até 500 caracteres por descrição
  Título OS: 5 a 200 caracteres
```

---

## 4. Funcionalidades Entregues

| # | Funcionalidade | Detalhe |
|---|---------------|---------|
| 1 | Login local | JWT, 2 usuários via seed, sem CRUD de usuários |
| 2 | Dashboard | 4 cards resumo + breakdown por 9 estágios |
| 3 | Cadastro de clientes | CRUD completo, busca, paginação |
| 4 | Cadastro de OS | Criação com numeração automática (`OS-AAAA-NNNNN`) |
| 5 | Detalhe da OS | Dados, cliente, estágio, pendências, histórico, anexos, PDF |
| 6 | Fluxo de 9 estágios | Com avanços, retrocessos e bloqueios |
| 7 | Matriz de transição | Validação backend, seletor filtrado no frontend |
| 8 | Histórico auditável | Imutável, 6 tipos de evento, registrado em transação |
| 9 | Pendências | Criar, concluir, idempotente, vinculadas à OS |
| 10 | Anexos | Upload único, validação de tipo/tamanho, download |
| 11 | Relatório PDF | Geração HTML→PDF, armazenado em `storage/relatorios/` |
| 12 | Bloqueios de estágio | `RELATORIO_ENTREGUE` requer PDF, `ENCERRADA` requer entrega |
| 13 | Modo leitura | OS encerrada bloqueia todas as operações |
| 14 | Armazenamento local | `storage/` na raiz, banco guarda só metadados |
| 15 | Acesso rede local | Backend em `0.0.0.0:3001`, CORS configurado |
| 16 | Tratamento de erros | Estados loading/erro/vazio, mensagens 400/401/404/409 |

---

## 5. Limitações Conhecidas (MVP v1.0.0)

| # | Limitação | Impacto |
|---|-----------|---------|
| 1 | Sem CRUD de usuários | Apenas 2 usuários do seed. Admin deve criar novos via banco. |
| 2 | Sem perfis de acesso | Todos os usuários têm acesso total. |
| 3 | Sem recuperação de senha | Reset manual via `ALTER USER` no PostgreSQL. |
| 4 | Sem exclusão de registros | Clientes, OS, pendências e anexos não podem ser excluídos. |
| 5 | Sem gráficos no dashboard | Apenas cards numéricos. |
| 6 | Upload único de anexo | Um arquivo por vez, sem seleção múltipla. |
| 7 | Sem preview de imagem | Apenas download, sem visualização inline. |
| 8 | Sem modo escuro | Apenas tema claro. |
| 9 | Sem responsivo mobile | Otimizado para desktop/notebook (1024px+). |
| 10 | Sem internacionalização | Apenas português. |
| 11 | Sem notificações em tempo real | Dashboard atualiza a cada 30s via polling. |
| 12 | Sem exportação CSV/Excel | Listas não podem ser exportadas. |
| 13 | PDF placeholder HTML | O PDF gerado é um arquivo HTML salvo como `.pdf`. Puppeteer/Playwright não integrado. |
| 14 | Sem backup automático | Dump manual do PostgreSQL + ZIP do `storage/`. |
| 15 | Sem instalador | Setup manual via instruções no README. |
| 16 | Sem testes automatizados | Testes manuais apenas. |

---

## 6. Próximas Melhorias Recomendadas (v1.1)

| # | Melhoria | Prioridade | Esforço |
|---|----------|-----------|---------|
| 1 | **PDF com Puppeteer/Playwright** — gerar PDF real em vez de HTML | Alta | 4h |
| 2 | **Exclusão lógica** — permitir arquivar/inativar registros | Alta | 3h |
| 3 | **CRUD de usuários** — interface para gerenciar usuários | Alta | 4h |
| 4 | **Perfis de acesso** — admin vs técnico vs somente leitura | Média | 6h |
| 5 | **Filtros por período** — dashboard com range de datas | Média | 3h |
| 6 | **Ordenação de tabelas** — clique no cabeçalho para ordenar | Média | 2h |
| 7 | **Upload múltiplo** — selecionar vários arquivos de uma vez | Baixa | 3h |
| 8 | **Preview de imagens** — miniatura inline antes do download | Baixa | 2h |
| 9 | **Exportação CSV** — exportar listas de clientes e OS | Baixa | 2h |
| 10 | **Backup via interface** — botão para gerar dump + ZIP | Baixa | 4h |
| 11 | **Docker** — containerizar para deploy simplificado | Média | 6h |
| 12 | **Testes automatizados** — Vitest + Supertest | Média | 8h |

---

## 7. Checklist de Backup Antes da Entrega

- [ ] Dump do banco: `pg_dump -U osmonitor_user -h localhost os_monitor > os_monitor_backup_$(date +%Y%m%d).sql`
- [ ] ZIP do storage: compactar pasta `storage/` com todos os PDFs e anexos
- [ ] ZIP do código fonte: compactar o projeto (sem `node_modules/` e `dist/`)
- [ ] `.env` do backend copiado para local seguro (contém credenciais)
- [ ] Lista de dependências: `npm ls --depth=0` em backend e frontend
- [ ] Documentação: `docs/` completo (api.md, frontend.md, backlog.md, homologacao.md)
- [ ] Senha do PostgreSQL documentada separadamente
- [ ] Instruções de restore testadas em ambiente limpo
