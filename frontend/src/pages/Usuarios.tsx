import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loading from '../components/Loading';

export default function Usuarios() {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<any>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['usuarios', pagina, busca],
    queryFn: () => api.get('/usuarios', { params: { pagina, limite: 20, busca } }).then((r) => r.data),
  });

  const criarMutation = useMutation({
    mutationFn: (body: any) => api.post('/usuarios', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); setModalAberto(false); setEditando(null); toast.success('Usuário criado.'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.mensagem || 'Erro.'),
  });

  const editarMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/usuarios/${id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); setModalAberto(false); setEditando(null); toast.success('Usuário atualizado.'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.mensagem || 'Erro.'),
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Usuários</h2>
          <p className="text-sm text-gray-500">Cadastro de usuários do sistema</p>
        </div>
        <button onClick={() => { setEditando(null); setModalAberto(true); }}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          Novo usuário
        </button>
      </div>

      <input type="text" placeholder="Buscar por nome ou email..." value={busca}
        onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

      {isError ? (
        <div className="text-center py-8"><p className="text-red-600 mb-2">Erro ao carregar.</p><button onClick={() => refetch()} className="text-blue-600 hover:underline">Tentar novamente</button></div>
      ) : data?.data?.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400">{busca ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-600">Nome</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-600">Email</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-gray-600">Ativo</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-gray-600">OS</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-600">Criado em</th>
                  <th className="w-36"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-800 font-medium">{u.nome}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${u.ativo ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className="ml-1 text-xs text-gray-500">{u.ativo ? 'Sim' : 'Não'}</span>
                    </td>
                    <td className="px-4 py-2 text-center text-sm text-gray-600">{u.total_os}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{new Date(u.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button onClick={() => { setEditando(u); setModalAberto(true); }}
                        className="text-blue-600 hover:underline text-xs">Editar</button>
                      <button onClick={() => {
                        editarMutation.mutate({ id: u.id, ativo: !u.ativo });
                        toast.success(u.ativo ? 'Usuário desativado.' : 'Usuário ativado.');
                      }}
                        className={`text-xs hover:underline ${u.ativo ? 'text-red-500' : 'text-green-600'}`}>
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
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
        <UsuarioModal usuario={editando} onClose={() => { setModalAberto(false); setEditando(null); }}
          onSave={(body: any) => editando ? editarMutation.mutate({ id: editando.id, ...body }) : criarMutation.mutate(body)}
          erro={(criarMutation.error as any)?.response?.data?.error?.mensagem || (editarMutation.error as any)?.response?.data?.error?.mensagem}
          carregando={criarMutation.isPending || editarMutation.isPending} />
      )}
    </div>
  );
}

function UsuarioModal({ usuario, onClose, onSave, erro, carregando }: {
  usuario: any; onClose: () => void; onSave: (body: any) => void; erro: string; carregando: boolean;
}) {
  const [nome, setNome] = useState(usuario?.nome || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [senha, setSenha] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">{usuario ? 'Editar usuário' : 'Novo usuário'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ nome, email, ...(senha && { senha }) }); }} className="space-y-3">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo *" required className="w-full px-3 py-2 border rounded-md text-sm" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" required type="email" className="w-full px-3 py-2 border rounded-md text-sm" />
          <input value={senha} onChange={(e) => setSenha(e.target.value)}
            placeholder={usuario ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}
            required={!usuario} minLength={6} type="password" className="w-full px-3 py-2 border rounded-md text-sm" />
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-gray-600">Cancelar</button>
            <button type="submit" disabled={carregando || !nome || !email}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {carregando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
