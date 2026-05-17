import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loading from '../components/Loading';

export default function Clientes() {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clientes', pagina, busca],
    queryFn: () => api.get('/clientes', { params: { pagina, limite: 20, busca } }).then((r) => r.data),
  });

  const criarMutation = useMutation({
    mutationFn: (body: any) => api.post('/clientes', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); setModalAberto(false); setEditando(null); toast.success('Cliente criado.'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.mensagem || 'Erro.'),
  });

  const editarMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/clientes/${id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); setModalAberto(false); setEditando(null); toast.success('Cliente atualizado.'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.mensagem || 'Erro.'),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clientes/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); setConfirmDelete(null); toast.success('Cliente excluído.'); },
    onError: (err: any) => { toast.error(err.response?.data?.error?.mensagem || 'Erro ao excluir.'); setConfirmDelete(null); },
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Clientes</h2>
        <button onClick={() => { setEditando(null); setModalAberto(true); }} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          Novo cliente
        </button>
      </div>

      <input type="text" placeholder="Buscar por nome, email ou documento..." value={busca}
        onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

      {isError ? (
        <div className="text-center py-8"><p className="text-red-600 mb-2">Erro ao carregar clientes.</p><button onClick={() => refetch()} className="text-blue-600 hover:underline">Tentar novamente</button></div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">{busca ? `Nenhum cliente encontrado para "${busca}".` : 'Nenhum cliente cadastrado.'}</p>
          {!busca && <button onClick={() => { setEditando(null); setModalAberto(true); }} className="text-blue-600 hover:underline">Cadastrar primeiro cliente</button>}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Nome</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 hidden sm:table-cell">Email</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 hidden md:table-cell">Telefone</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 hidden lg:table-cell">Documento</th>
                  <th className="w-28 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data?.map((cliente: any) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-800">{cliente.nome}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 hidden sm:table-cell">{cliente.email || '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 hidden md:table-cell">{cliente.telefone || '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 hidden lg:table-cell">{cliente.documento || '—'}</td>
                    <td className="px-3 py-2 flex gap-1">
                      <button onClick={() => { setEditando(cliente); setModalAberto(true); }} className="text-blue-600 hover:underline text-xs">Editar</button>
                      <button onClick={() => setConfirmDelete(cliente.id)} className="text-red-500 hover:underline text-xs">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data?.meta && data.meta.total > 20 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>Total: {data.meta.total}</span>
              <div className="space-x-2">
                <button disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Anterior</button>
                <span>Página {pagina}</span>
                <button disabled={pagina * 20 >= data.meta.total} onClick={() => setPagina((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Próximo</button>
              </div>
            </div>
          )}
        </>
      )}

      {modalAberto && (
        <ClienteModal cliente={editando} onClose={() => { setModalAberto(false); setEditando(null); }}
          onSave={(body: any) => editando ? editarMutation.mutate({ id: editando.id, ...body }) : criarMutation.mutate(body)}
          erro={(criarMutation.error as any)?.response?.data?.error?.mensagem || (editarMutation.error as any)?.response?.data?.error?.mensagem}
          carregando={criarMutation.isPending || editarMutation.isPending} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <p className="text-gray-800 mb-4">Tem certeza que deseja excluir este cliente?</p>
            <p className="text-sm text-gray-500 mb-4">Esta ação não pode ser desfeita. Clientes com OS vinculadas não podem ser excluídos.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded-md text-gray-600">Cancelar</button>
              <button onClick={() => excluirMutation.mutate(confirmDelete)} disabled={excluirMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
                {excluirMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClienteModal({ cliente, onClose, onSave, erro, carregando }: { cliente: any; onClose: () => void; onSave: (body: any) => void; erro: string; carregando: boolean }) {
  const [nome, setNome] = useState(cliente?.nome || '');
  const [email, setEmail] = useState(cliente?.email || '');
  const [telefone, setTelefone] = useState(cliente?.telefone || '');
  const [documento, setDocumento] = useState(cliente?.documento || '');
  const [endereco, setEndereco] = useState(cliente?.endereco || '');
  const [observacoes, setObservacoes] = useState(cliente?.observacoes || '');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{cliente ? 'Editar cliente' : 'Novo cliente'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ nome, email, telefone, documento, endereco, observacoes }); }} className="space-y-3">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome *" required className="w-full px-3 py-2 border rounded-md text-sm" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2 border rounded-md text-sm" />
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone" className="w-full px-3 py-2 border rounded-md text-sm" />
          <input value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="CPF/CNPJ" className="w-full px-3 py-2 border rounded-md text-sm" />
          <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço" className="w-full px-3 py-2 border rounded-md text-sm" />
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações" rows={2} className="w-full px-3 py-2 border rounded-md text-sm" />
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-gray-600">Cancelar</button>
            <button type="submit" disabled={carregando || !nome} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{carregando ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
