import prisma from '../lib/prisma';
import * as historicoService from './historico.service';

export async function listar(ordemId: string, resolvidaFilter?: string) {
  const where: any = { ordem_id: ordemId };

  if (resolvidaFilter === 'true') where.resolvida = true;
  else if (resolvidaFilter === 'false') where.resolvida = false;

  return prisma.pendencia.findMany({
    where,
    orderBy: { criado_em: 'desc' },
    include: {
      criador: { select: { id: true, nome: true } },
      resolvedor: { select: { id: true, nome: true } },
    },
  });
}

export async function criar(ordemId: string, descricao: string, usuarioId: string) {
  if (!descricao || descricao.length < 3 || descricao.length > 500) {
    const err: any = new Error('Descrição é obrigatória e deve ter entre 3 e 500 caracteres.');
    err.status = 400;
    throw err;
  }

  const ordem = await prisma.ordemServico.findUnique({ where: { id: ordemId } });
  if (!ordem) {
    const err: any = new Error('Ordem de serviço não encontrada.');
    err.status = 404;
    throw err;
  }

  if (ordem.estagio === 'ENCERRADA') {
    const err: any = new Error('Não é possível adicionar pendências a uma OS encerrada.');
    err.status = 400;
    err.codigo = 'OS_ENCERRADA';
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const pendencia = await tx.pendencia.create({
      data: {
        ordem_id: ordemId,
        descricao,
        criado_por: usuarioId,
        resolvida: false,
      },
      include: {
        criador: { select: { id: true, nome: true } },
      },
    });

    await historicoService.registrar(tx, {
      ordem_id: ordemId,
      usuario_id: usuarioId,
      tipo: 'PENDENCIA_CRIADA',
      descricao: `Pendência criada: ${descricao}`,
    });

    return pendencia;
  });
}

export async function concluir(ordemId: string, pendenciaId: string, usuarioId: string) {
  const pendencia = await prisma.pendencia.findFirst({
    where: { id: pendenciaId, ordem_id: ordemId },
  });

  if (!pendencia) {
    const err: any = new Error('Pendência não encontrada.');
    err.status = 404;
    throw err;
  }

  if (pendencia.resolvida) {
    return prisma.pendencia.findUnique({
      where: { id: pendenciaId },
      include: {
        criador: { select: { id: true, nome: true } },
        resolvedor: { select: { id: true, nome: true } },
      },
    });
  }

  return prisma.$transaction(async (tx) => {
    const atualizada = await tx.pendencia.update({
      where: { id: pendenciaId },
      data: {
        resolvida: true,
        data_resolucao: new Date(),
        resolvido_por: usuarioId,
      },
      include: {
        criador: { select: { id: true, nome: true } },
        resolvedor: { select: { id: true, nome: true } },
      },
    });

    await historicoService.registrar(tx, {
      ordem_id: ordemId,
      usuario_id: usuarioId,
      tipo: 'PENDENCIA_CONCLUIDA',
      descricao: `Pendência concluída: ${pendencia.descricao}`,
    });

    return atualizada;
  });
}
