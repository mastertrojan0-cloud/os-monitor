import prisma from '../lib/prisma';
import { EstagioOS } from '@prisma/client';

export async function resumo() {
  const [
    totalOS,
    totalClientes,
    pendenciasAbertas,
    osPorEstagioRaw,
    osConcluidasSemPdf,
  ] = await Promise.all([
    prisma.ordemServico.count(),
    prisma.cliente.count(),
    prisma.pendencia.count({ where: { resolvida: false } }),
    prisma.ordemServico.groupBy({
      by: ['estagio'],
      _count: { estagio: true },
    }),
    prisma.ordemServico.count({
      where: {
        estagio: { in: ['CONCLUIDA', 'RELATORIO_ENTREGUE'] },
        relatorios: { none: {} },
      },
    }),
  ]);

  const osPorEstagio: Record<string, number> = {};
  for (const e of Object.values(EstagioOS)) {
    osPorEstagio[e] = 0;
  }
  for (const item of osPorEstagioRaw) {
    osPorEstagio[item.estagio] = item._count.estagio;
  }

  return {
    total_os: totalOS,
    os_por_estagio: osPorEstagio,
    pendencias_abertas: pendenciasAbertas,
    os_sem_pdf: osConcluidasSemPdf,
    total_clientes: totalClientes,
  };
}
