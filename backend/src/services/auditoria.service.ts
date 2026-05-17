import prisma from '../lib/prisma';

interface FiltrosAuditoria {
  pagina: number;
  limite: number;
  tipo?: string;
  usuario?: string;
  dataInicio?: string;
  dataFim?: string;
  ordemId?: string;
}

export async function listar(filtros: FiltrosAuditoria) {
  const where: any = {};

  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.usuario) {
    where.usuario = { OR: [{ nome: { contains: filtros.usuario } }, { email: { contains: filtros.usuario } }] };
  }
  if (filtros.dataInicio || filtros.dataFim) {
    where.criado_em = {};
    if (filtros.dataInicio) where.criado_em.gte = new Date(filtros.dataInicio);
    if (filtros.dataFim) where.criado_em.lte = new Date(filtros.dataFim + 'T23:59:59.999Z');
  }
  if (filtros.ordemId) where.ordem_id = filtros.ordemId;

  const [registros, total] = await Promise.all([
    prisma.historico.findMany({
      where,
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
      orderBy: { criado_em: 'desc' },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        ordem: { select: { id: true, numero: true, titulo: true } },
      },
    }),
    prisma.historico.count({ where }),
  ]);

  return { registros, meta: { total, pagina: filtros.pagina, limite: filtros.limite } };
}

export async function tipos() {
  const result = await prisma.historico.groupBy({
    by: ['tipo'],
    _count: { tipo: true },
  });

  return result.map((r) => ({ tipo: r.tipo, total: r._count.tipo }));
}
