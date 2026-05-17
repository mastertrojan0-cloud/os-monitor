import { Prisma, TipoHistorico, EstagioOS } from '@prisma/client';

interface RegistrarHistoricoParams {
  ordem_id: string;
  usuario_id: string;
  tipo: TipoHistorico;
  descricao: string;
  estagio_anterior?: EstagioOS | null;
  estagio_novo?: EstagioOS | null;
  nota?: string | null;
}

/**
 * Serviço interno — não exposto via API.
 * Chamado exclusivamente por outros services dentro de transações Prisma.
 */
export async function registrar(
  tx: Prisma.TransactionClient,
  params: RegistrarHistoricoParams,
) {
  return tx.historico.create({
    data: {
      ordem_id: params.ordem_id,
      usuario_id: params.usuario_id,
      tipo: params.tipo,
      descricao: params.descricao,
      estagio_anterior: params.estagio_anterior ?? null,
      estagio_novo: params.estagio_novo ?? null,
      nota: params.nota ?? null,
    },
  });
}
