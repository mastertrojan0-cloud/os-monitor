# OS Monitor — Checklist de Homologação (MVP)

## Ambiente

| Item | Valor |
|------|-------|
| Backend | `http://localhost:3001` |
| Frontend dev | `http://localhost:5173` |
| Banco | PostgreSQL 18, `os_monitor` |
| Usuário admin | `admin@osmonitor.local` / `admin123` |
| Usuário técnico | `tecnico@osmonitor.local` / `admin123` |

---

## 1. Autenticação

- [ ] **1.1** Login com `admin@osmonitor.local` / `admin123` → redireciona para `/dashboard`
- [ ] **1.2** Login com `tecnico@osmonitor.local` / `admin123` → redireciona para `/dashboard`
- [ ] **1.3** Login com credenciais inválidas → mensagem de erro
- [ ] **1.4** Token expirado/ausente → redireciona para `/login` (401)
- [ ] **1.5** Logout → token removido, redireciona para `/login`

---

## 2. Clientes

- [ ] **2.1** Lista de clientes carrega com paginação
- [ ] **2.2** Busca por nome/email/documento funciona (debounce 300ms)
- [ ] **2.3** Criar cliente — modal abre, salva, fecha, lista recarrega
- [ ] **2.4** Criar cliente sem nome → erro de validação
- [ ] **2.5** Editar cliente — modal abre com dados, salva, lista recarrega
- [ ] **2.6** Estado vazio (sem clientes) → mensagem + CTA

---

## 3. Ordens de Serviço

- [ ] **3.1** Lista de OS carrega com paginação
- [ ] **3.2** Filtro por estágio funciona
- [ ] **3.3** Busca textual por número/título/cliente funciona
- [ ] **3.4** Criar OS — modal abre com select de cliente, salva, redireciona para detalhe
- [ ] **3.5** Criar OS sem cliente → erro de validação
- [ ] **3.6** Clicar no número da OS → abre tela de detalhe
- [ ] **3.7** Criação de OS gera registro no histórico (`CRIACAO_OS`)

---

## 4. Detalhe da OS

- [ ] **4.1** Exibe número, título, descrição, cliente, datas
- [ ] **4.2** Badge do estágio atual com cor correta
- [ ] **4.3** Seletor de estágio mostra apenas transições permitidas
- [ ] **4.4** Mudança de estágio válida → sucesso, badge atualiza, histórico incrementa
- [ ] **4.5** Mudança de estágio inválida → erro 409 com mensagem
- [ ] **4.6** OS `ENCERRADA` → todos os botões desabilitados
- [ ] **4.7** Timeline do histórico exibe todos os tipos com ícones coloridos
- [ ] **4.8** Histórico em ordem cronológica inversa

---

## 5. Pendências

- [ ] **5.1** Criar pendência → aparece na lista, histórico incrementa
- [ ] **5.2** Criar pendência sem descrição → erro de validação
- [ ] **5.3** Concluir pendência → check verde, botão some, histórico incrementa
- [ ] **5.4** Concluir pendência já resolvida → idempotente, sem erro
- [ ] **5.5** Pendências resolvidas abaixo das pendentes
- [ ] **5.6** OS `ENCERRADA` → não permite criar/concluir pendências

---

## 6. Anexos

- [ ] **6.1** Upload de arquivo `.jpg`/`.png`/`.pdf` → sucesso
- [ ] **6.2** Upload de arquivo `.txt` → bloqueado (extensão inválida)
- [ ] **6.3** Upload acima de 10 MB → bloqueado
- [ ] **6.4** Anexo aparece na lista com nome, tamanho, data
- [ ] **6.5** Download do anexo funciona
- [ ] **6.6** Upload gera histórico (`ANEXO_ADICIONADO`)
- [ ] **6.7** OS `ENCERRADA` → não permite upload

---

## 7. Relatório PDF

- [ ] **7.1** Gerar PDF → sucesso, badge "PDF gerado" aparece
- [ ] **7.2** Download do PDF funciona
- [ ] **7.3** PDF salvo em `storage/relatorios/`
- [ ] **7.4** Geração de PDF gera histórico (`PDF_GERADO`)
- [ ] **7.5** `RELATORIO_ENTREGUE` sem PDF → bloqueado (409)
- [ ] **7.6** `RELATORIO_ENTREGUE` com PDF → permitido
- [ ] **7.7** `ENCERRADA` sem `RELATORIO_ENTREGUE` → bloqueado (409)
- [ ] **7.8** `ENCERRADA` a partir de `RELATORIO_ENTREGUE` → permitido

---

## 8. Dashboard

- [ ] **8.1** Cards principais: Total OS, Pendências abertas, OS sem PDF, Total clientes
- [ ] **8.2** Breakdown por estágio exibe os 9 estágios com contagem
- [ ] **8.3** Dados refletem o estado real do banco
- [ ] **8.4** Polling de 30s atualiza sem piscar

---

## 9. Infraestrutura

- [ ] **9.1** `GET /api/health` retorna `{"status":"ok"}`
- [ ] **9.2** `storage/` está na raiz do projeto
- [ ] **9.3** PDFs e anexos salvos em disco, não no banco
- [ ] **9.4** Banco guarda apenas metadados (nome, caminho, tamanho, tipo)
- [ ] **9.5** `.env` e `.env.example` sem aspas nos valores
- [ ] **9.6** Backend escuta em `0.0.0.0:3001`
- [ ] **9.7** Frontend build serve arquivos estáticos corretamente
- [ ] **9.8** Acesso via `http://<ip-servidor>:3001` funciona na rede local

---

## 10. Regras de negócio

- [ ] **10.1** Histórico é imutável — sem endpoints de update/delete
- [ ] **10.2** Não existe rota dedicada para histórico
- [ ] **10.3** Não existe endpoint de delete para OS
- [ ] **10.4** Não existe CRUD de usuários
- [ ] **10.5** Toda operação crítica gera histórico em transação
- [ ] **10.6** Erros 400/401/404/409 retornam mensagens claras
- [ ] **10.7** Erro 500 retorna mensagem genérica sem stack trace

---

## Limitações conhecidas do MVP

| # | Limitação |
|---|-----------|
| 1 | Sem CRUD de usuários (apenas seed inicial) |
| 2 | Sem perfis/permissões (admin, técnico) |
| 3 | Sem recuperação de senha |
| 4 | Sem exclusão de qualquer entidade |
| 5 | Sem gráficos no dashboard |
| 6 | Sem upload múltiplo de anexos |
| 7 | Sem preview inline de anexos |
| 8 | Sem modo escuro / temas |
| 9 | Sem responsivo mobile completo |
| 10 | Sem internacionalização |
| 11 | Sem WebSocket / notificações em tempo real |
| 12 | Sem exportação CSV/Excel |
| 13 | Sem backup via interface (script manual) |
| 14 | Sem instalador / empacotamento |
| 15 | Sem Docker |
| 16 | Sem testes automatizados |
| 17 | Sem CI/CD |
| 18 | Sem envio de email |
| 19 | Sem WhatsApp |
| 20 | Sem portal externo do cliente |

---

## Resultado da homologação

| Data | Responsável | Status |
|------|-------------|--------|
| 14/05/2026 | — | Pendente |
