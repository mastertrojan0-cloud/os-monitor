import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loading from '../components/Loading';
import { ESTAGIO_LABELS, ESTAGIO_CORES, type EstagioOS } from '../types';

const ESTAGIOS: EstagioOS[] = ['ABERTA', 'EM_ANALISE', 'ENVIADA_AO_CLIENTE', 'AGUARDANDO_RETORNO', 'AGENDADA', 'EM_EXECUCAO', 'CONCLUIDA', 'RELATORIO_ENTREGUE', 'ENCERRADA'];

export default function Ordens() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pagina = Number(searchParams.get('pagina')) || 1;
  const estagio = searchParams.get('estagio') || '';
  const busca = searchParams.get('busca') || '';

  const [buscaInput, setBuscaInput] = useState(busca);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['ordens', pagina, estagio, busca],
    queryFn: () => api.get('/ordens', { params: { pagina, limite: 20, ...(estagio && { estagio }), ...(busca && { busca }) } }).then((r) => r.data),
  });

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: () => api.get('/clientes', { params: { limite: 100 } }).then((r) => r.data.data),
    enabled: modalAberto,
  });

  const criarMutation = useMutation({
    mutationFn: (body: any) => api.post('/ordens', body),
    onSuccess: (res) => { queryClient.invalidateQueries({ queryKey: ['ordens'] }); setModalAberto(false); navigate(`/ordens/${res.data.data.id}`); },
    onError: (err: any) => toast.error(err.response?.data?.error?.mensagem || 'Erro.'),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ordens/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ordens'] }); setConfirmDelete(null); toast.success('OS excluída.'); },
    onError: (err: any) => { toast.error(err.response?.data?.error?.mensagem || 'Erro ao excluir.'); setConfirmDelete(null); },
  });

  function atualizarFiltros(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    if (updates.estagio !== undefined || updates.busca !== undefined) params.set('pagina', '1');
    setSearchParams(params);
  }

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Ordens de Serviço</h2>
        <button onClick={() => setModalAberto(true)} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Nova OS</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input type="text" placeholder="Buscar..." value={buscaInput}
          onChange={(e) => setBuscaInput(e.target.value)} onBlur={() => atualizarFiltros({ busca: buscaInput })}
          onKeyDown={(e) => { if (e.key === 'Enter') atualizarFiltros({ busca: buscaInput }); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[140px]" />
        <select value={estagio} onChange={(e) => atualizarFiltros({ estagio: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">Todos</option>
          {ESTAGIOS.map((e) => (<option key={e} value={e}>{ESTAGIO_LABELS[e]}</option>))}
        </select>
      </div>

      {isError ? (
        <div className="text-center py-8"><p className="text-red-600 mb-2">Erro ao carregar ordens.</p><button onClick={() => refetch()} className="text-blue-600 hover:underline">Tentar novamente</button></div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow"><p className="text-gray-500">{busca || estagio ? 'Nenhuma OS encontrada.' : 'Nenhuma ordem de serviço.'}</p></div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Nº OS</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Título</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 hidden sm:table-cell">Cliente</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Estágio</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-gray-600 w-10">!</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-gray-600 hidden sm:table-cell w-10">PDF</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 hidden md:table-cell">Data</th>
                  <th className="w-16 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data?.map((os: any) => (
                  <tr key={os.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2"><Link to={`/ordens/${os.id}`} className="text-blue-600 hover:underline font-mono text-xs">{os.numero}</Link></td>
                    <td className="px-3 py-2 text-sm text-gray-800 max-w-[180px] truncate">{os.titulo}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 hidden sm:table-cell">{os.cliente?.nome}</td>
                    <td className="px-3 py-2"><span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium ${ESTAGIO_CORES[os.estagio as EstagioOS]}`}>{ESTAGIO_LABELS[os.estagio as EstagioOS]}</span></td>
                    <td className="px-3 py-2 text-center">{os._tem_pendencia && <span className="text-amber-500">⚠</span>}</td>
                    <td className="px-3 py-2 text-center hidden sm:table-cell">{os._tem_pdf ? <span className="text-green-500">✓</span> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-sm text-gray-500 hidden md:table-cell">{new Date(os.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td className="px-3 py-2"><button onClick={() => setConfirmDelete(os.id)} className="text-red-500 hover:underline text-xs">Excl</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data?.meta && data.meta.total > 20 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>Total: {data.meta.total}</span>
              <div className="space-x-2">
                <button disabled={pagina <= 1} onClick={() => atualizarFiltros({ pagina: String(pagina - 1) })} className="px-3 py-1 border rounded disabled:opacity-40">Anterior</button>
                <span>Página {pagina}</span>
                <button disabled={pagina * 20 >= data.meta.total} onClick={() => atualizarFiltros({ pagina: String(pagina + 1) })} className="px-3 py-1 border rounded disabled:opacity-40">Próximo</button>
              </div>
            </div>
          )}
        </>
      )}

      {modalAberto && (
        <OrdemModal clientes={clientesData || []} onClose={() => setModalAberto(false)}
          onSave={(body: any) => criarMutation.mutate(body)}
          erro={(criarMutation.error as any)?.response?.data?.error?.mensagem} carregando={criarMutation.isPending} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <p className="text-gray-800 mb-2">Excluir ordem de serviço?</p>
            <p className="text-sm text-gray-500 mb-4">Pendências, histórico, anexos e PDFs serão removidos permanentemente.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded-md text-gray-600">Cancelar</button>
              <button onClick={() => excluirMutation.mutate(confirmDelete)} disabled={excluirMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
                {excluirMutation.isPending ? '...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdemModal({ clientes, onClose, onSave, erro, carregando }: { clientes: any[]; onClose: () => void; onSave: (body: any) => void; erro: string; carregando: boolean }) {
  const [clienteId, setClienteId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataPrevisao, setDataPrevisao] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');

  const clientesFiltrados = buscaCliente ? clientes.filter((c: any) => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())) : clientes;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Nova Ordem de Serviço</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ cliente_id: clienteId, titulo, descricao: descricao || undefined, data_previsao: dataPrevisao || undefined }); }} className="space-y-3">
          <div>
            <input type="text" placeholder="Buscar cliente..." value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm mb-1" />
            <select value={clienteId} onChange={(e) => { setClienteId(e.target.value); setBuscaCliente(''); }} required className="w-full px-3 py-2 border rounded-md text-sm" size={Math.min(clientesFiltrados.length + 1, 6)}>
              <option value="">Selecione um cliente</option>
              {clientesFiltrados.map((c: any) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
            </select>
          </div>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título *" required minLength={5} maxLength={200} className="w-full px-3 py-2 border rounded-md text-sm" />
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição" rows={3} className="w-full px-3 py-2 border rounded-md text-sm" />
          <input type="date" value={dataPrevisao} onChange={(e) => setDataPrevisao(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border rounded-md text-sm" />
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-gray-600">Cancelar</button>
            <button type="submit" disabled={carregando || !clienteId || titulo.length < 5} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{carregando ? 'Criando...' : 'Criar OS'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
