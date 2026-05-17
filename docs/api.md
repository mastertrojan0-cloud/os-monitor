# OS Monitor — Contrato da API REST (MVP)

## Convenções

| Item | Padrão |
|------|--------|
| Base URL | `http://<ip-servidor>:3001/api` |
| Autenticação | `Authorization: Bearer <jwt>` em todas as rotas exceto `/auth/login` |
| Content-Type | `application/json` (exceto upload: `multipart/form-data`) |
| Envelope de resposta | `{ data }` (sucesso) — `{ error }` (falha) |
| Paginação | Query params `?pagina=1&limite=20`. Resposta inclui `meta: { total, pagina, limite }` |
| Ordenação | `?ordem=criado_em&direcao=desc` |
| Ids | `cuid()` — string de 25 caracteres |
| Erros | `{ error: { codigo: string, mensagem: string } }` |
| Status 200 | Sucesso com retorno |
| Status 201 | Recurso criado |
| Status 204 | Sucesso sem retorno (ex: resolver pendência) |
| Status 400 | Validação / regra de negócio |
| Status 401 | Não autenticado |
| Status 403 | Não autorizado |
| Status 404 | Recurso não encontrado |
| Status 409 | Conflito (estágio inválido, etc.) |
| Status 500 | Erro interno |

---

## 1. Auth

### `POST /api/auth/login`

Cria sessão JWT.

**Body:**
```json
{
  "email": "tecnico@exemplo.com",
  "senha": "********"
}
```

**Resposta 200:**
```json
{
  "data": {
    "token": "eyJhbGciOi...",
    "usuario": {
      "id": "cld...",
      "nome": "Antônio",
      "email": "tecnico@exemplo.com"
    }
  }
}
```

**Resposta 401:**
```json
{ "error": { "codigo": "CREDENCIAIS_INVALIDAS", "mensagem": "Email ou senha incorretos." } }
```

**Resposta 403:**
```json
{ "error": { "codigo": "USUARIO_INATIVO", "mensagem": "Usuário inativo. Contate o administrador." } }
```

**Regras:**
- `jwt` expira em 8h, payload contém `{ sub: usuario.id }`.
- Comparação de senha com `bcrypt.compare`.
- Se `usuario.ativo === false`, retornar 403.

---

### `GET /api/auth/me`

Retorna o usuário autenticado (útil para o frontend confirmar sessão ativa).

**Resposta 200:**
```json
{
  "data": {
    "id": "cld...",
    "nome": "Antônio",
    "email": "tecnico@exemplo.com",
    "ativo": true,
    "criado_em": "2026-05-13T10:00:00.000Z"
  }
}
```

---

## 2. Clientes

### `GET /api/clientes`

Lista clientes com paginação e busca.

**Query params:** `?pagina=1&limite=20&busca=João`

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "cld...",
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "(11) 99999-0000",
      "documento": "123.456.789-00",
      "endereco": "Rua A, 123",
      "observacoes": null,
      "criado_em": "2026-05-10T08:00:00.000Z",
      "atualizado_em": "2026-05-10T08:00:00.000Z",
      "criador": { "id": "cld...", "nome": "Antônio" }
    }
  ],
  "meta": { "total": 45, "pagina": 1, "limite": 20 }
}
```

**Validações:**
- `limite` máximo 100.
- `busca` aplica `contains` em `nome`, `email`, `documento`.

---

### `GET /api/clientes/:id`

Detalhe de um cliente com contagem de OS vinculadas.

**Resposta 200:**
```json
{
  "data": {
    "id": "cld...",
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 99999-0000",
    "documento": "123.456.789-00",
    "endereco": "Rua A, 123",
    "observacoes": null,
    "criado_em": "2026-05-10T08:00:00.000Z",
    "atualizado_em": "2026-05-10T08:00:00.000Z",
    "criador": { "id": "cld...", "nome": "Antônio" },
    "_total_os": 3
  }
}
```

**Erros:** 404 se `id` não encontrado.

---

### `POST /api/clientes`

Cria cliente.

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "(11) 99999-0000",
  "documento": "123.456.789-00",
  "endereco": "Rua A, 123",
  "observacoes": "Cliente preferencial"
}
```

**Validações:**
- `nome` obrigatório, 3–150 caracteres.
- `email` formato válido se informado.
- `documento` único se informado (não permite duplicata).

**Resposta 201:**
```json
{
  "data": {
    "id": "cld...",
    "nome": "João Silva",
    "...": "..."
  }
}
```

**Regras:**
- `criado_por` vem do token JWT (`req.usuarioId`).
- Sempre `ON DELETE RESTRICT` — não é possível excluir cliente com OS vinculada.

---

### `PUT /api/clientes/:id`

Atualiza cliente.

**Body:** (todos opcionais, envia só o que mudou)
```json
{
  "nome": "João S. Filho",
  "telefone": "(11) 98888-1111"
}
```

**Validações:**
- Mesmas do `POST`, mas todos os campos são opcionais.
- Se `documento` vier, valida unicidade excluindo o próprio `id`.

**Resposta 200:** objeto atualizado (mesmo formato do GET por id).

---

## 3. Ordens de Serviço

### `GET /api/ordens`

Lista OS com paginação e filtros.

**Query params:**
```
?pagina=1
&limite=20
&estagio=EM_ANALISE
&cliente_id=cld...
&busca=notebook
&ordem=criado_em
&direcao=desc
```

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "cld...",
      "numero": "OS-2026-00042",
      "titulo": "Reparo notebook Dell",
      "descricao": "Tela quebrada, modelo Latitude 5420",
      "estagio": "EM_ANALISE",
      "data_previsao": "2026-05-20T00:00:00.000Z",
      "criado_em": "2026-05-13T10:00:00.000Z",
      "atualizado_em": "2026-05-13T14:00:00.000Z",
      "cliente": { "id": "cld...", "nome": "João Silva" },
      "criador": { "id": "cld...", "nome": "Antônio" },
      "_tem_pendencia": true,
      "_tem_pdf": false
    }
  ],
  "meta": { "total": 128, "pagina": 1, "limite": 20 }
}
```

**Validações:**
- `estagio` deve ser valor válido do enum `EstagioOS`.
- `limite` máximo 100.

---

### `GET /api/ordens/:id`

Detalhe completo da OS: dados + pendências + histórico + anexos + relatórios.

**Resposta 200:**
```json
{
  "data": {
    "id": "cld...",
    "numero": "OS-2026-00042",
    "titulo": "Reparo notebook Dell",
    "descricao": "Tela quebrada, modelo Latitude 5420",
    "estagio": "EM_EXECUCAO",
    "data_previsao": "2026-05-20T00:00:00.000Z",
    "criado_em": "2026-05-13T10:00:00.000Z",
    "atualizado_em": "2026-05-13T14:00:00.000Z",
    "cliente": {
      "id": "cld...",
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "(11) 99999-0000",
      "documento": "123.456.789-00",
      "endereco": "Rua A, 123"
    },
    "criador": { "id": "cld...", "nome": "Antônio" },
    "pendencias": [
      {
        "id": "cld...",
        "descricao": "Confirmar garantia com fabricante",
        "resolvida": false,
        "data_resolucao": null,
        "criado_em": "2026-05-13T11:00:00.000Z",
        "criador": { "id": "cld...", "nome": "Antônio" }
      }
    ],
    "historico": [
      {
        "id": "cld...",
        "tipo": "CRIACAO_OS",
        "descricao": "Ordem de serviço criada.",
        "estagio_anterior": null,
        "estagio_novo": "ABERTA",
        "criado_em": "2026-05-13T10:00:00.000Z",
        "usuario": { "id": "cld...", "nome": "Antônio" }
      },
      {
        "id": "cld...",
        "tipo": "MUDANCA_ESTAGIO",
        "descricao": "Estágio alterado de ABERTA para EM_ANALISE.",
        "estagio_anterior": "ABERTA",
        "estagio_novo": "EM_ANALISE",
        "criado_em": "2026-05-13T10:15:00.000Z",
        "usuario": { "id": "cld...", "nome": "Antônio" }
      }
    ],
    "anexos": [
      {
        "id": "cld...",
        "nome_original": "foto_notebook.jpg",
        "nome_arquivo": "cld..._foto_notebook.jpg",
        "tipo_mime": "image/jpeg",
        "tamanho_bytes": 245760,
        "criado_em": "2026-05-13T10:30:00.000Z",
        "criador": { "id": "cld...", "nome": "Antônio" }
      }
    ],
    "relatorios": [
      {
        "id": "cld...",
        "nome_arquivo": "OS-2026-00042_relatorio.pdf",
        "tamanho_bytes": 124518,
        "criado_em": "2026-05-13T15:00:00.000Z",
        "criador": { "id": "cld...", "nome": "Antônio" }
      }
    ]
  }
}
```

**Erros:** 404 se `id` não encontrado.

**Regras:**
- `historico` ordenado por `criado_em DESC`.
- `pendencias` ordenadas por `criado_em DESC`.
- `anexos` e `relatorios` ordenados por `criado_em DESC`.

---

### `POST /api/ordens`

Cria OS. Sempre inicia no estágio `ABERTA`.

**Body:**
```json
{
  "cliente_id": "cld...",
  "titulo": "Reparo notebook Dell",
  "descricao": "Tela quebrada, modelo Latitude 5420",
  "data_previsao": "2026-05-20"
}
```

**Validações:**
- `cliente_id` obrigatório, deve existir no banco.
- `titulo` obrigatório, 5–200 caracteres.
- `data_previsao` opcional, formato `YYYY-MM-DD`, deve ser ≥ hoje.

**Resposta 201:**
```json
{
  "data": {
    "id": "cld...",
    "numero": "OS-2026-00042",
    "titulo": "Reparo notebook Dell",
    "estagio": "ABERTA",
    "...": "..."
  }
}
```

**Regras (transação):**
1. Gera `numero` no formato `OS-AAAA-NNNNN` (ano corrente + sequencial de 5 dígitos, ex: `OS-2026-00042`). O sequencial é calculado como `COUNT(os do ano) + 1`.
2. Insere `OrdemServico` com `estagio = ABERTA` e `criado_por = req.usuarioId`.
3. Insere `Historico` com `tipo = CRIACAO_OS`, `descricao = "Ordem de serviço criada."`, `estagio_novo = ABERTA`.
4. Os passos 1 a 3 devem rodar dentro de `prisma.$transaction([...])`.

**Erro 400:**
```json
{ "error": { "codigo": "CLIENTE_NAO_ENCONTRADO", "mensagem": "Cliente informado não existe." } }
```

---

### `PUT /api/ordens/:id`

Atualiza dados básicos da OS (não altera estágio).

**Body:** (todos opcionais)
```json
{
  "titulo": "Reparo notebook Dell Latitude 5420",
  "descricao": "Tela quebrada + teclado com falha.",
  "data_previsao": "2026-05-25"
}
```

**Validações:**
- Mesmas do `POST`, mas todos os campos são opcionais.
- `data_previsao` se informada, deve ser ≥ hoje.

**Resposta 200:** objeto atualizado.

**Regras:**
- Este endpoint NÃO altera estágio e NÃO gera histórico. Apenas atualiza metadados da OS.

---

### `PATCH /api/ordens/:id/estagio`

Avança ou retrocede o estágio da OS. Este é o endpoint de transição de fluxo.

**Body:**
```json
{
  "estagio": "EM_ANALISE"
}
```

**Validações:**
- `estagio` obrigatório, deve ser valor válido do enum `EstagioOS`.
- O estágio informado deve ser diferente do atual.

**Resposta 200:**
```json
{
  "data": {
    "id": "cld...",
    "numero": "OS-2026-00042",
    "estagio": "EM_ANALISE",
    "atualizado_em": "2026-05-13T10:15:00.000Z"
  }
}
```

**Regras de negócio (validadas ANTES da transação):**

| De | Para | Permitido? | Condição |
|----|------|-----------|----------|
| `ABERTA` | `EM_ANALISE` | ✅ | — |
| `ABERTA` | qualquer outro | ❌ 409 | "Transição inválida de ABERTA para {estagio}." |
| `EM_ANALISE` | `ENVIADA_AO_CLIENTE` | ✅ | — |
| `EM_ANALISE` | `ABERTA` | ✅ | Retrocesso permitido. |
| `ENVIADA_AO_CLIENTE` | `AGUARDANDO_RETORNO` | ✅ | — |
| `ENVIADA_AO_CLIENTE` | `EM_ANALISE` | ✅ | Retrocesso. |
| `AGUARDANDO_RETORNO` | `AGENDADA` | ✅ | — |
| `AGUARDANDO_RETORNO` | `EM_ANALISE` | ✅ | Retrocesso. |
| `AGENDADA` | `EM_EXECUCAO` | ✅ | — |
| `AGENDADA` | `AGUARDANDO_RETORNO` | ✅ | Retrocesso. |
| `EM_EXECUCAO` | `CONCLUIDA` | ✅ | — |
| `EM_EXECUCAO` | `AGENDADA` | ✅ | Retrocesso. |
| `CONCLUIDA` | `RELATORIO_ENTREGUE` | ✅ | Deve existir ao menos 1 `RelatorioPdf` vinculado à OS. |
| `CONCLUIDA` | `EM_EXECUCAO` | ✅ | Retrocesso. |
| `RELATORIO_ENTREGUE` | `ENCERRADA` | ✅ | — |
| `RELATORIO_ENTREGUE` | `CONCLUIDA` | ✅ | Retrocesso. |
| `ENCERRADA` | qualquer | ❌ 409 | "OS encerrada não pode ser reaberta." |

**Erro 409 (sem PDF):**
```json
{ "error": { "codigo": "PDF_NAO_GERADO", "mensagem": "É necessário gerar o relatório PDF antes de marcar como Relatório Entregue." } }
```

**Erro 409 (transição inválida):**
```json
{ "error": { "codigo": "TRANSICAO_INVALIDA", "mensagem": "Transição inválida de EM_ANALISE para ENCERRADA." } }
```

**Regras (transação):**
1. Valida a transição (tabela acima).
2. Se destino for `RELATORIO_ENTREGUE`, verifica existência de `RelatorioPdf` para a OS.
3. Atualiza `OrdemServico.estagio`.
4. Insere `Historico` com `tipo = MUDANCA_ESTAGIO`, `estagio_anterior` e `estagio_novo`, `descricao = "Estágio alterado de {anterior} para {novo}."`.
5. Passos 3 e 4 em `prisma.$transaction([...])`.

---

## 4. Pendências

### `GET /api/ordens/:ordemId/pendencias`

Lista pendências de uma OS.

**Query params:** `?resolvida=false` (filtro opcional)

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "cld...",
      "descricao": "Confirmar garantia com fabricante",
      "resolvida": false,
      "data_resolucao": null,
      "criado_em": "2026-05-13T11:00:00.000Z",
      "criador": { "id": "cld...", "nome": "Antônio" },
      "resolvedor": null
    }
  ]
}
```

**Erros:** 404 se `ordemId` não encontrado.

---

### `POST /api/ordens/:ordemId/pendencias`

Cria pendência vinculada à OS.

**Body:**
```json
{
  "descricao": "Confirmar garantia com fabricante"
}
```

**Validações:**
- `descricao` obrigatória, 3–500 caracteres.
- `ordemId` deve existir.
- Não permitir criar pendência em OS `ENCERRADA`.

**Resposta 201:** objeto criado.

**Erro 400 (OS encerrada):**
```json
{ "error": { "codigo": "OS_ENCERRADA", "mensagem": "Não é possível adicionar pendências a uma OS encerrada." } }
```

**Regras (transação):**
1. Insere `Pendencia` com `resolvida = false`, `criado_por = req.usuarioId`.
2. Insere `Historico` com `tipo = PENDENCIA_CRIADA`, `descricao = "Pendência criada: {descricao}"`.

---

### `PATCH /api/ordens/:ordemId/pendencias/:id/concluir`

Marca pendência como resolvida. Endpoint idempotente: chamar novamente em pendência já resolvida retorna 200 sem erro.

**Body:** vazio (sem body).

**Resposta 200:**
```json
{
  "data": {
    "id": "cld...",
    "descricao": "Confirmar garantia com fabricante",
    "resolvida": true,
    "data_resolucao": "2026-05-13T16:00:00.000Z",
    "resolvedor": { "id": "cld...", "nome": "Antônio" }
  }
}
```

**Erros:** 404 se pendência não encontrada ou não pertence à OS informada.

**Regras (transação):**
1. Atualiza `Pendencia.resolvida = true`, `data_resolucao = now()`, `resolvido_por = req.usuarioId`.
2. Insere `Historico` com `tipo = PENDENCIA_CONCLUIDA`, `descricao = "Pendência concluída: {descricao}"`.

---

## 5. Relatórios PDF

### `GET /api/ordens/:ordemId/relatorio`

Retorna metadados do último PDF gerado para a OS (se existir).

**Resposta 200 (com PDF):**
```json
{
  "data": {
    "id": "cld...",
    "nome_arquivo": "OS-2026-00042_relatorio.pdf",
    "tamanho_bytes": 124518,
    "criado_em": "2026-05-13T15:00:00.000Z",
    "criador": { "id": "cld...", "nome": "Antônio" }
  }
}
```

**Resposta 200 (sem PDF):**
```json
{ "data": null }
```

---

### `POST /api/ordens/:ordemId/relatorio`

Gera o relatório PDF da OS.

**Body:** vazio (sem body). O backend monta os dados da OS e gera o PDF via servidor.

**Resposta 201:**
```json
{
  "data": {
    "id": "cld...",
    "nome_arquivo": "OS-2026-00042_relatorio.pdf",
    "tamanho_bytes": 124518,
    "criado_em": "2026-05-13T15:00:00.000Z",
    "criador": { "id": "cld...", "nome": "Antônio" }
  }
}
```

**Erro 400 (OS sem dados mínimos):**
```json
{ "error": { "codigo": "DADOS_INSUFICIENTES", "mensagem": "OS não possui dados suficientes para gerar o relatório." } }
```

**Regras (transação):**
1. Gera HTML com dados da OS (cabeçalho, cliente, descrição, estágio atual, pendências resolvidas).
2. Converte HTML para PDF (Puppeteer ou Playwright).
3. Salva PDF em `storage/relatorios/OS-{numero}_relatorio.pdf`.
4. Insere `RelatorioPdf` com `nome_arquivo`, `caminho_arquivo` relativo, `tamanho_bytes`.
5. Insere `Historico` com `tipo = PDF_GERADO`, `descricao = "Relatório PDF gerado."`.

---

### `GET /api/ordens/:ordemId/relatorio/download`

Faz download do PDF mais recente da OS.

**Resposta 200:** stream binário com headers:
```
Content-Type: application/pdf
Content-Disposition: inline; filename="OS-2026-00042_relatorio.pdf"
```

**Resposta 404:** se a OS não tem PDF gerado.

---

## 6. Anexos

### `GET /api/ordens/:ordemId/anexos`

Lista anexos da OS.

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "cld...",
      "nome_original": "foto_notebook.jpg",
      "nome_arquivo": "cld..._foto_notebook.jpg",
      "tipo_mime": "image/jpeg",
      "tamanho_bytes": 245760,
      "criado_em": "2026-05-13T10:30:00.000Z",
      "criador": { "id": "cld...", "nome": "Antônio" }
    }
  ]
}
```

---

### `POST /api/ordens/:ordemId/anexos`

Upload de anexo. Content-Type: `multipart/form-data`.

**Body (multipart):**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `arquivo` | `file` | Arquivo binário (imagem, PDF, documento) |
| `descricao` | `text` | Opcional (MVP ignora, campo existe para extensão futura) |

**Validações:**
- Tamanho máximo: 10 MB por arquivo.
- Extensões permitidas: `.jpg`, `.jpeg`, `.png`, `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`.
- `ordemId` deve existir.
- Não permitir upload em OS `ENCERRADA`.

**Resposta 201:**
```json
{
  "data": {
    "id": "cld...",
    "nome_original": "foto_notebook.jpg",
    "nome_arquivo": "cld..._foto_notebook.jpg",
    "tipo_mime": "image/jpeg",
    "tamanho_bytes": 245760,
    "criado_em": "2026-05-13T10:30:00.000Z",
    "criador": { "id": "cld...", "nome": "Antônio" }
  }
}
```

**Regras (transação):**
1. Salva arquivo em `storage/anexos/{ano}/{mes}/{cuid}_{nome_original}`.
2. Insere `Anexo` com metadados.
3. Insere `Historico` com `tipo = ANEXO_ADICIONADO`, `descricao = "Anexo adicionado: {nome_original}"`.

**Erro 400 (OS encerrada):**
```json
{ "error": { "codigo": "OS_ENCERRADA", "mensagem": "Não é possível adicionar anexos a uma OS encerrada." } }
```

**Erro 413 (arquivo grande):**
```json
{ "error": { "codigo": "ARQUIVO_MUITO_GRANDE", "mensagem": "Arquivo excede o limite de 10 MB." } }
```

---

### `GET /api/ordens/:ordemId/anexos/:id/download`

Download de anexo específico.

**Resposta 200:** stream binário com `Content-Type` do `tipo_mime` registrado.

**Resposta 404:** anexo não encontrado ou não pertence à OS.

---

## 7. Dashboard

### `GET /api/dashboard`

Resumo para a tela inicial.

**Resposta 200:**
```json
{
  "data": {
    "total_os": 128,
    "os_por_estagio": {
      "ABERTA": 12,
      "EM_ANALISE": 8,
      "ENVIADA_AO_CLIENTE": 15,
      "AGUARDANDO_RETORNO": 20,
      "AGENDADA": 10,
      "EM_EXECUCAO": 18,
      "CONCLUIDA": 25,
      "RELATORIO_ENTREGUE": 15,
      "ENCERRADA": 5
    },
    "pendencias_abertas": 34,
    "os_sem_pdf": 40,
    "total_clientes": 89
  }
}
```

**Regras:**
- `os_sem_pdf` = OS nos estágios `CONCLUIDA` ou `RELATORIO_ENTREGUE` sem `RelatorioPdf` vinculado.
- `pendencias_abertas` = `COUNT(*) WHERE resolvida = false`.

---

## 8. Rotas que NÃO devem existir no MVP

| Rota | Motivo |
|------|--------|
| `GET/POST/PUT/DELETE /api/historico` | Histórico é imutável e retornado apenas embutido no detalhe da OS. |
| `DELETE /api/ordens/:id` | Exclusão de OS não está no escopo MVP. Implementar como soft-delete se necessário no futuro. |
| `DELETE /api/clientes/:id` | Exclusão só será habilitada quando houver regra de desvinculação. |
| `PUT /api/historico/:id` | Histórico não pode ser editado. |
| `DELETE /api/historico/:id` | Histórico não pode ser apagado. |
| `POST/PUT/DELETE /api/usuarios` | CRUD de usuários via seed inicial. Interface de gestão de usuários fica para versão futura. |
| `GET /api/backup/*` | Backup manual/local é feito via script externo, não pela API. |
| `GET/POST /api/configuracoes` | Fora do escopo MVP. |
| `GET/POST /api/alertas` | Fora do escopo MVP. Alertas básicos são derivados do dashboard. |
| `GET /api/relatorios` (rota solta) | Relatórios são acessados via `/api/ordens/:id/relatorio`. |

---

## 9. Resumo consolidado de endpoints

| # | Método | Rota | Descrição |
|---|--------|------|-----------|
| 1 | `POST` | `/api/auth/login` | Login |
| 2 | `GET` | `/api/auth/me` | Usuário logado |
| 3 | `GET` | `/api/clientes` | Listar clientes |
| 4 | `GET` | `/api/clientes/:id` | Detalhe cliente |
| 5 | `POST` | `/api/clientes` | Criar cliente |
| 6 | `PUT` | `/api/clientes/:id` | Atualizar cliente |
| 7 | `GET` | `/api/ordens` | Listar OS |
| 8 | `GET` | `/api/ordens/:id` | Detalhe OS |
| 9 | `POST` | `/api/ordens` | Criar OS |
| 10 | `PUT` | `/api/ordens/:id` | Atualizar OS |
| 11 | `PATCH` | `/api/ordens/:id/estagio` | Mudar estágio |
| 12 | `GET` | `/api/ordens/:ordemId/pendencias` | Listar pendências |
| 13 | `POST` | `/api/ordens/:ordemId/pendencias` | Criar pendência |
| 14 | `PATCH` | `/api/ordens/:ordemId/pendencias/:id/concluir` | Resolver pendência |
| 15 | `GET` | `/api/ordens/:ordemId/relatorio` | Ver metadados PDF |
| 16 | `POST` | `/api/ordens/:ordemId/relatorio` | Gerar PDF |
| 17 | `GET` | `/api/ordens/:ordemId/relatorio/download` | Baixar PDF |
| 18 | `GET` | `/api/ordens/:ordemId/anexos` | Listar anexos |
| 19 | `POST` | `/api/ordens/:ordemId/anexos` | Upload anexo |
| 20 | `GET` | `/api/ordens/:ordemId/anexos/:id/download` | Baixar anexo |
| 21 | `GET` | `/api/dashboard` | Dashboard |

**Total: 21 endpoints.**

---

## 10. Middlewares necessários

| Middleware | Aplica em | Descrição |
|-----------|-----------|-----------|
| `authMiddleware` | Todas exceto `/auth/login` | Extrai e valida JWT. Injeta `req.usuarioId`. |
| `errorHandler` | Global | Captura exceções, loga no console, retorna `{ error }` genérico sem stack trace. |
| `cors` | Global | Permite origem do frontend (ex: `http://localhost:5173` em dev, IP do servidor em prod). |
| `upload` (multer) | `POST /anexos` | Configurado com `dest: storage/anexos/`, limite 10 MB, filtro de extensão. |
