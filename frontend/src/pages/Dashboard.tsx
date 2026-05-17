import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import { ESTAGIO_LABELS } from '../types';

const CORES_CARD: Record<string, { bg: string; text: string; border: string }> = {
  ABERTA:             { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300' },
  EM_ANALISE:         { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  ENVIADA_AO_CLIENTE: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' },
  AGUARDANDO_RETORNO: { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-300' },
  AGENDADA:           { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-300' },
  EM_EXECUCAO:        { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  CONCLUIDA:          { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300' },
  RELATORIO_ENTREGUE: { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-300' },
  ENCERRADA:          { bg: 'bg-gray-100',  text: 'text-gray-600',   border: 'border-gray-300' },
};

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: alertas } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => api.get('/alertas').then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Erro ao carregar dashboard.</p>
        <button onClick={() => refetch()} className="text-blue-600 hover:underline">Tentar novamente</button>
      </div>
    );
  }

  const osPorEstagio = data?.os_por_estagio || {};
  const estagiosComValor = Object.entries(osPorEstagio).filter(([, v]) => (v as number) > 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral do sistema</p>
        </div>
        <span className="text-xs text-gray-400">
          Atualizado {new Date().toLocaleTimeString('pt-BR')}
        </span>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon="📋" label="Total de OS" value={data?.total_os ?? 0}
          color="border-blue-500" bg="bg-blue-50"
        />
        <MetricCard
          icon="⚠️" label="Pendências abertas" value={data?.pendencias_abertas ?? 0}
          color="border-amber-500" bg="bg-amber-50"
          alert={data?.pendencias_abertas > 0}
        />
        <MetricCard
          icon="📄" label="Sem relatório" value={data?.os_sem_pdf ?? 0}
          color="border-red-500" bg="bg-red-50"
          alert={data?.os_sem_pdf > 0}
        />
        <MetricCard
          icon="👥" label="Clientes" value={data?.total_clientes ?? 0}
          color="border-green-500" bg="bg-green-50"
        />
      </div>

      {/* Grid: estágios + alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OS por estágio */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Ordens de Serviço por estágio
          </h3>
          {estagiosComValor.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-400 text-sm">Nenhuma OS cadastrada.</p>
              <Link to="/ordens" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                Criar primeira OS
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(osPorEstagio).map(([estagio, count]) => {
                const c = CORES_CARD[estagio] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
                const n = count as number;
                return (
                  <div key={estagio} className={`${c.bg} border ${c.border} rounded-lg p-3`}>
                    <p className="text-xs text-gray-500 truncate">{ESTAGIO_LABELS[estagio as keyof typeof ESTAGIO_LABELS] || estagio}</p>
                    <p className={`text-xl font-bold ${c.text}`}>{n}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alertas */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            {alertas && alertas.total > 0 ? `Alertas (${alertas.total})` : 'Alertas'}
          </h3>
          {!alertas || alertas.total === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-green-600 text-sm font-medium">Nenhum alerta</p>
              <p className="text-gray-400 text-xs mt-1">Todas as OS estão em dia</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alertas.alertas.map((a: any) => (
                <Link key={a.id} to={`/ordens/${a.ordem_id}`}
                  className={`block p-3 rounded-lg text-sm border-l-4 transition-colors hover:shadow ${
                    a.nivel === 'CRITICO'
                      ? 'bg-red-50 border-red-500 hover:bg-red-100'
                      : 'bg-amber-50 border-amber-400 hover:bg-amber-100'
                  }`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-xs text-gray-500">{a.numero}</span>
                    <span className={`text-xs font-bold ${a.nivel === 'CRITICO' ? 'text-red-600' : 'text-amber-600'}`}>
                      {a.dias_parado}d
                    </span>
                  </div>
                  <p className="font-medium text-gray-800 text-xs truncate">{a.titulo}</p>
                  <p className="text-gray-500 text-xs">{a.cliente_nome}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color, bg, alert }: {
  icon: string; label: string; value: number; color: string; bg: string; alert?: boolean;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${color} p-4`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {alert && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
      </div>
      <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
