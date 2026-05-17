import { EstagioOS } from '@prisma/client';

export const ESTAGIOS_ORDEM: EstagioOS[] = [
  'ABERTA',
  'EM_ANALISE',
  'ENVIADA_AO_CLIENTE',
  'AGUARDANDO_RETORNO',
  'AGENDADA',
  'EM_EXECUCAO',
  'CONCLUIDA',
  'RELATORIO_ENTREGUE',
  'ENCERRADA',
];

export const ESTAGIO_LABELS: Record<EstagioOS, string> = {
  ABERTA: 'Aberta',
  EM_ANALISE: 'Em análise',
  ENVIADA_AO_CLIENTE: 'Enviada ao cliente',
  AGUARDANDO_RETORNO: 'Aguardando retorno',
  AGENDADA: 'Agendada',
  EM_EXECUCAO: 'Em execução',
  CONCLUIDA: 'Concluída',
  RELATORIO_ENTREGUE: 'Relatório entregue',
  ENCERRADA: 'Encerrada',
};

/**
 * Matriz de transição de estágios.
 * Chave: estágio atual. Valor: estágios permitidos como destino.
 */
export const TRANSICOES_PERMITIDAS: Record<EstagioOS, EstagioOS[]> = {
  ABERTA: ['EM_ANALISE'],
  EM_ANALISE: ['ABERTA', 'ENVIADA_AO_CLIENTE'],
  ENVIADA_AO_CLIENTE: ['EM_ANALISE', 'AGUARDANDO_RETORNO'],
  AGUARDANDO_RETORNO: ['EM_ANALISE', 'AGENDADA'],
  AGENDADA: ['AGUARDANDO_RETORNO', 'EM_EXECUCAO'],
  EM_EXECUCAO: ['AGENDADA', 'CONCLUIDA'],
  CONCLUIDA: ['EM_EXECUCAO', 'RELATORIO_ENTREGUE'],
  RELATORIO_ENTREGUE: ['CONCLUIDA', 'ENCERRADA'],
  ENCERRADA: [],
};

export const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024; // 10 MB

export const EXTENSOES_PERMITIDAS_ANEXO = [
  '.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx',
];
