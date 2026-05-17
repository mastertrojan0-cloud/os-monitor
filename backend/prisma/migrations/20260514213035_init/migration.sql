-- CreateEnum
CREATE TYPE "EstagioOS" AS ENUM ('ABERTA', 'EM_ANALISE', 'ENVIADA_AO_CLIENTE', 'AGUARDANDO_RETORNO', 'AGENDADA', 'EM_EXECUCAO', 'CONCLUIDA', 'RELATORIO_ENTREGUE', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "TipoHistorico" AS ENUM ('CRIACAO_OS', 'MUDANCA_ESTAGIO', 'PENDENCIA_CRIADA', 'PENDENCIA_CONCLUIDA', 'ANEXO_ADICIONADO', 'PDF_GERADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "documento" TEXT,
    "endereco" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" TEXT NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "cliente_id" TEXT NOT NULL,
    "estagio" "EstagioOS" NOT NULL DEFAULT 'ABERTA',
    "data_previsao" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" TEXT NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendencias" (
    "id" TEXT NOT NULL,
    "ordem_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "resolvida" BOOLEAN NOT NULL DEFAULT false,
    "data_resolucao" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" TEXT NOT NULL,
    "resolvido_por" TEXT,

    CONSTRAINT "pendencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico" (
    "id" TEXT NOT NULL,
    "ordem_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoHistorico" NOT NULL,
    "descricao" TEXT NOT NULL,
    "estagio_anterior" "EstagioOS",
    "estagio_novo" "EstagioOS",
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios_pdf" (
    "id" TEXT NOT NULL,
    "ordem_id" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "caminho_arquivo" TEXT NOT NULL,
    "tamanho_bytes" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" TEXT NOT NULL,

    CONSTRAINT "relatorios_pdf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexos" (
    "id" TEXT NOT NULL,
    "ordem_id" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "caminho_arquivo" TEXT NOT NULL,
    "tipo_mime" TEXT,
    "tamanho_bytes" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" TEXT NOT NULL,

    CONSTRAINT "anexos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "clientes_criado_por_idx" ON "clientes"("criado_por");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_numero_key" ON "ordens_servico"("numero");

-- CreateIndex
CREATE INDEX "ordens_servico_cliente_id_idx" ON "ordens_servico"("cliente_id");

-- CreateIndex
CREATE INDEX "ordens_servico_estagio_idx" ON "ordens_servico"("estagio");

-- CreateIndex
CREATE INDEX "ordens_servico_criado_por_idx" ON "ordens_servico"("criado_por");

-- CreateIndex
CREATE INDEX "pendencias_ordem_id_idx" ON "pendencias"("ordem_id");

-- CreateIndex
CREATE INDEX "pendencias_ordem_id_resolvida_idx" ON "pendencias"("ordem_id", "resolvida");

-- CreateIndex
CREATE INDEX "pendencias_criado_por_idx" ON "pendencias"("criado_por");

-- CreateIndex
CREATE INDEX "historico_ordem_id_criado_em_idx" ON "historico"("ordem_id", "criado_em");

-- CreateIndex
CREATE INDEX "historico_usuario_id_idx" ON "historico"("usuario_id");

-- CreateIndex
CREATE INDEX "historico_tipo_idx" ON "historico"("tipo");

-- CreateIndex
CREATE INDEX "relatorios_pdf_ordem_id_idx" ON "relatorios_pdf"("ordem_id");

-- CreateIndex
CREATE INDEX "anexos_ordem_id_idx" ON "anexos"("ordem_id");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_ordem_id_fkey" FOREIGN KEY ("ordem_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_resolvido_por_fkey" FOREIGN KEY ("resolvido_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico" ADD CONSTRAINT "historico_ordem_id_fkey" FOREIGN KEY ("ordem_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico" ADD CONSTRAINT "historico_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios_pdf" ADD CONSTRAINT "relatorios_pdf_ordem_id_fkey" FOREIGN KEY ("ordem_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios_pdf" ADD CONSTRAINT "relatorios_pdf_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_ordem_id_fkey" FOREIGN KEY ("ordem_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
