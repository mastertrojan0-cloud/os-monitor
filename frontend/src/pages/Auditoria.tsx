import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Loading from '../components/Loading';

const TIPOS_LABELS: Record<string, string> = {
  CRIACAO_OS: 'Criação de OS',
  MUDANCA_ESTAGIO: 'Mudança de estágio',
  PENDENCIA_CRIADA: 'Pendência criada',
  PENDENCIA_CONCLUIDA: 'Pendência concluída',
  ANEXO_ADICIONADO: 'Anexo adicionado',
  PDF_GERADO: 'PDF gerado',
};

const TIPOS_CORES: Record<string, string> = {
  CRIACAO_OS: 'bg-blue-100 text-blue-700',
  MUDANCA_ESTAGIO: 'bg-purple-100 text-purple-700',
  PENDENCIA_CRIADA: 'bg-amber-100 text-amber-700',
  PENDENCIA_CONCLUIDA: 'bg-green-100 text-green-700',
  ANEXO_ADICIONADO: 'bg-indigo-100 text-indigo-700',
  PDF_GERADO: 'bg-teal-100 text-teal-700',
};

export default function Auditoria() {
  const [pagina, setPagina] = useState(1);
  const [tipo, setTipo] = useState('');
  const [usuario, setUsuario] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['auditoria', pagina, tipo, usuario, dataInicio, dataFim],
    queryFn: () => api.get('/auditoria', {
      params: {
        pagina, limite: 30,
        ...(tipo && { tipo }),
        ...(usuario && { usuario }),
        ...(dataInicio && { dataInicio }),
        ...(dataFim && { dataFim }),
      },
    }).then((r) => r.data),
  });

  const { data: tiposData } = useQuery({
    queryKey: ['auditoria-tipos'],
    queryFn: () => api.get('/auditoria/tipos').then((r) => r.data.data),
  });

  const limparFiltros = () => {
    setTipo(''); setUsuario(''); setDataInicio(''); setDataFim(''); setPagina(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Auditoria</h2>
          <p className="text-sm text-gray-500">Registro completo de todas as operações do sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1); }}
              className="w-full px-2 py-1.5 border rounded text-sm">
              <option value="">Todos</option>
              {Object.entries(TIPOS_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-gray-500 mb-1">Usuário</label>
            <input type="text" placeholder="Nome ou email" value={usuario}
              onChange={(e) => { setUsuario(e.target.value); setPagina(1); }}
              className="w-full px-2 py-1.5 border rounded text-sm" />
          </div>
          <div className="w-[130px]">
            <label className="block text-xs text-gray-500 mb-1">Início</label>
            <input type="date" value={dataInicio}
              onChange={(e) => { setDataInicio(e.target.value); setPagina(1); }}
              className="w-full px-2 py-1.5 border rounded text-sm" />
          </div>
          <div className="w-[130px]">
            <label className="block text-xs text-gray-500 mb-1">Fim</label>
            <input type="date" value={dataFim}
              onChange={(e) => { setDataFim(e.target.value); setPagina(1); }}
              className="w-full px-2 py-1.5 border rounded text-sm" />
          </div>
          <button onClick={limparFiltros} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border rounded">
            Limpar
          </button>
        </div>
      </div>

      {/* Contagem por tipo */}
      {tiposData && tiposData.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tiposData.map((t: any) => (
            <span key={t.tipo} className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPOS_CORES[t.tipo] || 'bg-gray-100 text-gray-600'}`}>
              {TIPOS_LABELS[t.tipo] || t.tipo}: {t.total}
            </span>
          ))}
        </div>
      )}

      {isLoading ? <Loading /> : isError ? (
        <div className="text-center py-8"><p className="text-red-600 mb-2">Erro ao carregar.</p><button onClick={() => refetch()} className="text-blue-600 hover:underline">Tentar novamente</button></div>
      ) : data?.data?.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400">Nenhum registro de auditoria encontrado.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-600">Data/Hora</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-600">Descrição</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-600">Usuário</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-600">OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(r.criado_em).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${TIPOS_CORES[r.tipo] || 'bg-gray-100 text-gray-600'}`}>
                        {TIPOS_LABELS[r.tipo] || r.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{r.descricao}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">{r.usuario?.nome}</td>
                    <td className="px-4 py-2 text-xs font-mono text-gray-500">{r.ordem?.numero || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data?.meta && data.meta.total > 30 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>Total: {data.meta.total} registros</span>
              <div className="space-x-2">
                <button disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Anterior</button>
                <span>Página {pagina}</span>
                <button disabled={pagina * 30 >= data.meta.total} onClick={() => setPagina((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Próximo</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
