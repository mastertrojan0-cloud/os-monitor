import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Loading from '../components/Loading';

const TIPOS_LABELS: Record<string, string> = {
  CRIACAO_OS: 'Criação', MUDANCA_ESTAGIO: 'Mud. Estágio',
  PENDENCIA_CRIADA: 'Pend. Criada', PENDENCIA_CONCLUIDA: 'Pend. Concluída',
  ANEXO_ADICIONADO: 'Anexo', PDF_GERADO: 'PDF',
};

export default function Estatisticas() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['estatisticas'],
    queryFn: () => api.get('/estatisticas').then((r) => r.data.data),
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Erro ao carregar estatísticas.</p>
        <button onClick={() => refetch()} className="text-blue-600 hover:underline">Tentar novamente</button>
      </div>
    );
  }

  const osPorMes = data?.os_por_mes || {};
  const maxOsMes = Math.max(1, ...Object.values(osPorMes).map(Number));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Estatísticas</h2>
        <p className="text-sm text-gray-500">Métricas e indicadores do sistema</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tempo médio conclusão" value={`${data?.tempo_medio_conclusao_dias ?? 0} dias`} color="text-blue-600" />
        <StatCard label="Total de operações" value={data?.total_operacoes ?? 0} color="text-purple-600" />
        <StatCard label="OS no mês atual" value={Object.values(osPorMes).slice(-1)[0] as number ?? 0} color="text-green-600" />
        <StatCard label="Clientes atendidos" value={data?.os_por_cliente?.length ?? 0} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OS por mês — gráfico de barras simples */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">OS criadas por mês</h3>
          {Object.keys(osPorMes).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(osPorMes).map(([mes, total]) => {
                const t = Number(total);
                const pct = (t / maxOsMes) * 100;
                const [ano, m] = mes.split('-');
                const label = `${String(m).padStart(2, '0')}/${ano}`;
                return (
                  <div key={mes} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-14 text-right">{label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(pct, t > 0 ? 5 : 0)}%` }}>
                        {t > 0 && <span className="text-[10px] text-white font-medium">{t}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top clientes */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Top clientes</h3>
          {!data?.os_por_cliente || data.os_por_cliente.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {data.os_por_cliente.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-[200px]">{item.cliente}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{item.total} OS</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operações por tipo */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Operações por tipo</h3>
          {!data?.operacoes_por_tipo || data.operacoes_por_tipo.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {data.operacoes_por_tipo.map((item: any) => (
                <div key={item.tipo} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{TIPOS_LABELS[item.tipo] || item.tipo}</span>
                  <span className="text-sm font-bold text-gray-800">{item.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tempo médio */}
        <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full border-4 border-blue-500 flex items-center justify-center mb-3">
            <span className="text-2xl font-bold text-blue-600">{data?.tempo_medio_conclusao_dias ?? 0}</span>
          </div>
          <p className="text-sm text-gray-600">dias em média</p>
          <p className="text-xs text-gray-400 mt-1">da abertura até conclusão</p>
          <p className="text-xs text-gray-400 mt-1">(últimos 30 dias)</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
