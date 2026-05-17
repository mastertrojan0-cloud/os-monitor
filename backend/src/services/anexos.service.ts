import prisma from '../lib/prisma';
import * as historicoService from './historico.service';

interface CriarAnexoParams {
  nomeOriginal: string;
  nomeArquivo: string;
  tamanhoBytes: number;
  tipoMime: string;
}

export async function listar(ordemId: string) {
  return prisma.anexo.findMany({
    where: { ordem_id: ordemId },
    orderBy: { criado_em: 'desc' },
    include: {
      criador: { select: { id: true, nome: true } },
    },
  });
}

export async function criar(
  ordemId: string,
  dados: CriarAnexoParams,
  caminhoRelativo: string,
  usuarioId: string,
) {
  const ordem = await prisma.ordemServico.findUnique({ where: { id: ordemId } });
  if (!ordem) {
    const err: any = new Error('Ordem de serviço não encontrada.');
    err.status = 404;
    throw err;
  }

  if (ordem.estagio === 'ENCERRADA') {
    const err: any = new Error('Não é possível adicionar anexos a uma OS encerrada.');
    err.status = 400;
    err.codigo = 'OS_ENCERRADA';
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const anexo = await tx.anexo.create({
      data: {
        ordem_id: ordemId,
        nome_original: dados.nomeOriginal,
        nome_arquivo: dados.nomeArquivo,
        caminho_arquivo: caminhoRelativo,
        tipo_mime: dados.tipoMime,
        tamanho_bytes: dados.tamanhoBytes,
        criado_por: usuarioId,
      },
      include: {
        criador: { select: { id: true, nome: true } },
      },
    });

    await historicoService.registrar(tx, {
      ordem_id: ordemId,
      usuario_id: usuarioId,
      tipo: 'ANEXO_ADICIONADO',
      descricao: `Anexo adicionado: ${dados.nomeOriginal}`,
    });

    return anexo;
  });
}

export async function buscarPorId(id: string, ordemId: string) {
  return prisma.anexo.findFirst({
    where: { id, ordem_id: ordemId },
  });
}
