export type EstagioOS =
  | 'ABERTA'
  | 'EM_ANALISE'
  | 'ENVIADA_AO_CLIENTE'
  | 'AGUARDANDO_RETORNO'
  | 'AGENDADA'
  | 'EM_EXECUCAO'
  | 'CONCLUIDA'
  | 'RELATORIO_ENTREGUE'
  | 'ENCERRADA';

export type TipoHistorico =
  | 'CRIACAO_OS'
  | 'MUDANCA_ESTAGIO'
  | 'PENDENCIA_CRIADA'
  | 'PENDENCIA_CONCLUIDA'
  | 'ANEXO_ADICIONADO'
  | 'PDF_GERADO';

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

export const ESTAGIO_CORES: Record<EstagioOS, string> = {
  ABERTA: 'bg-blue-100 text-blue-800',
  EM_ANALISE: 'bg-purple-100 text-purple-800',
  ENVIADA_AO_CLIENTE: 'bg-indigo-100 text-indigo-800',
  AGUARDANDO_RETORNO: 'bg-amber-100 text-amber-800',
  AGENDADA: 'bg-cyan-100 text-cyan-800',
  EM_EXECUCAO: 'bg-orange-100 text-orange-800',
  CONCLUIDA: 'bg-green-100 text-green-800',
  RELATORIO_ENTREGUE: 'bg-teal-100 text-teal-800',
  ENCERRADA: 'bg-gray-200 text-gray-600',
};

// Matriz de transição (espelho do backend constants.ts)
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

export interface ApiError {
  error: {
    codigo: string;
    mensagem: string;
  };
}
