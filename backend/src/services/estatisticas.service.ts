import prisma from '../lib/prisma';

export async function resumo() {
  const agora = new Date();
  const trintaDiasAtras = new Date(agora.getTime() - 30 * 86400000);

  // OS criadas por mês (últimos 12 meses)
  const dozeMesesAtras = new Date(agora.getFullYear() - 1, agora.getMonth(), 1);
  const osPorMesRaw = await prisma.ordemServico.groupBy({
    by: ['criado_em'],
    where: { criado_em: { gte: dozeMesesAtras } },
  });

  const osPorMes: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    osPorMes[key] = 0;
  }
  for (const r of osPorMesRaw) {
    const d = new Date(r.criado_em);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (osPorMes[key] !== undefined) osPorMes[key]++;
  }

  // OS por cliente (top 10)
  const osPorClienteRaw = await prisma.ordemServico.groupBy({
    by: ['cliente_id'],
    _count: { cliente_id: true },
    orderBy: { _count: { cliente_id: 'desc' } },
    take: 10,
  });
  const clienteIds = osPorClienteRaw.map((r) => r.cliente_id);
  const clientes = await prisma.cliente.findMany({
    where: { id: { in: clienteIds } },
    select: { id: true, nome: true },
  });
  const clienteMap = new Map(clientes.map((c) => [c.id, c.nome]));
  const osPorCliente = osPorClienteRaw.map((r) => ({
    cliente: clienteMap.get(r.cliente_id) || '—',
    total: r._count.cliente_id,
  }));

  // Tempo médio até conclusão (dias)
  const osConcluidas = await prisma.ordemServico.findMany({
    where: {
      estagio: { in: ['CONCLUIDA', 'RELATORIO_ENTREGUE', 'ENCERRADA'] },
      criado_em: { gte: trintaDiasAtras },
    },
    select: { criado_em: true, atualizado_em: true },
  });
  let tempoMedioConclusao = 0;
  if (osConcluidas.length > 0) {
    const totalDias = osConcluidas.reduce((sum, os) => {
      return sum + (os.atualizado_em.getTime() - os.criado_em.getTime()) / 86400000;
    }, 0);
    tempoMedioConclusao = Math.round(totalDias / osConcluidas.length);
  }

  // Total de operações no histórico
  const totalOperacoes = await prisma.historico.count();

  // Operações por tipo
  const operacoesPorTipo = await prisma.historico.groupBy({
    by: ['tipo'],
    _count: { tipo: true },
  });

  return {
    os_por_mes: osPorMes,
    os_por_cliente: osPorCliente,
    tempo_medio_conclusao_dias: tempoMedioConclusao,
    total_operacoes: totalOperacoes,
    operacoes_por_tipo: operacoesPorTipo.map((r) => ({ tipo: r.tipo, total: r._count.tipo })),
  };
}
