import prisma from '../lib/prisma';
import { EstagioOS } from '@prisma/client';

const ESTAGIOS_ATIVOS: EstagioOS[] = [
  'ABERTA', 'EM_ANALISE', 'ENVIADA_AO_CLIENTE', 'AGUARDANDO_RETORNO',
  'AGENDADA', 'EM_EXECUCAO', 'CONCLUIDA',
];

interface Alerta {
  id: string;
  ordem_id: string;
  numero: string;
  titulo: string;
  estagio: string;
  cliente_nome: string;
  horas_parado: number;
  mensagem: string;
}

export async function listar(): Promise<{ total: number; alertas: Alerta[] }> {
  const agora = new Date();
  const limite48h = new Date(agora.getTime() - 48 * 60 * 60 * 1000);

  const ordensParadas = await prisma.ordemServico.findMany({
    where: {
      estagio: { in: ESTAGIOS_ATIVOS },
      atualizado_em: { lt: limite48h },
    },
    include: {
      cliente: { select: { nome: true } },
    },
    orderBy: { atualizado_em: 'asc' },
  });

  const alertas: Alerta[] = ordensParadas.map((os) => {
    const horasParado = Math.floor((agora.getTime() - os.atualizado_em.getTime()) / (1000 * 60 * 60));

    return {
      id: `alert-${os.id}`,
      ordem_id: os.id,
      numero: os.numero,
      titulo: os.titulo,
      estagio: os.estagio,
      cliente_nome: os.cliente.nome,
      horas_parado: horasParado,
      mensagem: `OS parada há ${Math.floor(horasParado / 24)}d ${horasParado % 24}h no estágio ${os.estagio}`,
    };
  });

  return {
    total: alertas.length,
    alertas: alertas.sort((a, b) => b.horas_parado - a.horas_parado),
  };
}
