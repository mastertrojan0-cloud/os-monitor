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
  dias_parado: number;
  nivel: 'ATENCAO' | 'CRITICO';
  mensagem: string;
}

export async function listar(): Promise<{ total: number; alertas: Alerta[] }> {
  const agora = new Date();
  const limite24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

  const ordensParadas = await prisma.ordemServico.findMany({
    where: {
      estagio: { in: ESTAGIOS_ATIVOS },
      atualizado_em: { lt: limite24h },
    },
    include: {
      cliente: { select: { nome: true } },
    },
    orderBy: { atualizado_em: 'asc' },
  });

  const alertas: Alerta[] = ordensParadas.map((os) => {
    const horasParado = (agora.getTime() - os.atualizado_em.getTime()) / (1000 * 60 * 60);
    const diasParado = Math.floor(horasParado / 24);

    const nivel = horasParado >= 48 ? 'CRITICO' as const : 'ATENCAO' as const;

    return {
      id: `alert-${os.id}`,
      ordem_id: os.id,
      numero: os.numero,
      titulo: os.titulo,
      estagio: os.estagio,
      cliente_nome: os.cliente.nome,
      dias_parado: diasParado,
      nivel,
      mensagem: nivel === 'CRITICO'
        ? `OS parada há ${diasParado} dias no estágio ${os.estagio}`
        : `OS parada há mais de 24h no estágio ${os.estagio}`,
    };
  });

  return {
    total: alertas.length,
    alertas: alertas.sort((a, b) => b.dias_parado - a.dias_parado),
  };
}
