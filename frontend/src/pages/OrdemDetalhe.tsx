import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loading from '../components/Loading';
import { type EstagioOS, ESTAGIO_LABELS, ESTAGIO_CORES, TRANSICOES_PERMITIDAS } from '../types';

const FLUXO_ORDEM: EstagioOS[] = [
  'ABERTA', 'EM_ANALISE', 'ENVIADA_AO_CLIENTE', 'AGUARDANDO_RETORNO',
  'AGENDADA', 'EM_EXECUCAO', 'CONCLUIDA', 'RELATORIO_ENTREGUE', 'ENCERRADA',
];

const ESTAGIO_BG: Record<EstagioOS, string> = {
  ABERTA: 'bg-blue-500', EM_ANALISE: 'bg-purple-500', ENVIADA_AO_CLIENTE: 'bg-indigo-500',
  AGUARDANDO_RETORNO: 'bg-amber-500', AGENDADA: 'bg-cyan-500', EM_EXECUCAO: 'bg-orange-500',
  CONCLUIDA: 'bg-green-500', RELATORIO_ENTREGUE: 'bg-teal-500', ENCERRADA: 'bg-gray-500',
};

function baixarArquivo(url: string, filename: string) {
  const token = localStorage.getItem('token');
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(() => toast.error('Erro ao baixar.'));
}

export default function OrdemDetalhe() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [novoEstagio, setNovoEstagio] = useState<EstagioOS | ''>('');
  const [notaEstagio, setNotaEstagio] = useState('');
  const [novaPendencia, setNovaPendencia] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ordem', id],
    queryFn: () => api.get(`/ordens/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const mudarEstagioMutation = useMutation({
    mutationFn: ({ estagio, nota }: { estagio: EstagioOS; nota?: string }) =>
      api.patch(`/ordens/${id}/estagio`, { estagio, nota: nota || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ordem', id] }); setNovoEstagio(''); setNotaEstagio(''); toast.success('Estágio alterado.'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.mensagem || 'Erro.'),
  });

  const criarPendenciaMutation = useMutation({
    mutationFn: (descricao: string) => api.post(`/ordens/${id}/pendencias`, { descricao }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ordem', id] }); setNovaPendencia(''); toast.success('Pendência adicionada.'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.mensagem || 'Erro.'),
  });

  const concluirPendenciaMutation = useMutation({
    mutationFn: (pendenciaId: string) => api.patch(`/ordens/${id}/pendencias/${pendenciaId}/concluir`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ordem', id] }); toast.success('Pendência concluída.'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.mensagem || 'Erro.'),
  });

  const gerarPdfMutation = useMutation({
    mutationFn: () => api.post(`/ordens/${id}/relatorio`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ordem', id] }); toast.success('PDF gerado.'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.mensagem || 'Erro.'),
  });

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Arquivo maior que 10 MB.'); return; }
    const form = new FormData();
    form.append('arquivo', file);
    api.post(`/ordens/${id}/anexos`, form)
      .then(() => { queryClient.invalidateQueries({ queryKey: ['ordem', id] }); toast.success('Anexo enviado.'); })
      .catch((err) => toast.error(err.response?.data?.error?.mensagem || 'Erro.'));
  }

  if (isLoading) return <Loading />;
  if (isError || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">OS não encontrada.</p>
        <Link to="/ordens" className="text-blue-600 hover:underline">Voltar</Link>
      </div>
    );
  }

  const encerrada = data.estagio === 'ENCERRADA';
  const temPdf = data.relatorios?.length > 0;
  const estagiosPermitidos: EstagioOS[] = encerrada ? [] : TRANSICOES_PERMITIDAS[data.estagio as EstagioOS];
  const idxAtual = FLUXO_ORDEM.indexOf(data.estagio as EstagioOS);
  const pendenciasAbertas = data.pendencias?.filter((p: any) => !p.resolvida) || [];
  const pendenciasConcluidas = data.pendencias?.filter((p: any) => p.resolvida) || [];

  // Tempo no estágio atual
  const diasNoEstagio = Math.floor((Date.now() - new Date(data.atualizado_em).getTime()) / 86400000);
  const horasNoEstagio = Math.floor((Date.now() - new Date(data.atualizado_em).getTime()) / 3600000);
  const tempoLabel = diasNoEstagio > 0 ? `${diasNoEstagio}d neste estágio` : `${horasNoEstagio}h neste estágio`;

  // Status do prazo do estágio — 48h
  let prazoStatus: 'ok' | 'atraso' = 'ok';
  if (horasNoEstagio >= 48) prazoStatus = 'atraso';

  const prazoCores = { ok: 'border-green-400', atraso: 'border-red-500' };
  const prazoBg = { ok: 'bg-green-50', atraso: 'bg-red-50' };
  const prazoText = { ok: 'text-green-700', atraso: 'text-red-700' };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Link to="/ordens" className="text-blue-600 hover:underline text-sm inline-block">← Ordens</Link>

      {/* ── CABEÇALHO ── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs text-gray-400 font-mono">{data.numero}</span>
            <h1 className="text-lg font-bold text-gray-800">{data.titulo}</h1>
            <p className="text-sm text-gray-500 mt-1">{data.cliente?.nome}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${ESTAGIO_CORES[data.estagio as EstagioOS]}`}>
              {ESTAGIO_LABELS[data.estagio as EstagioOS]}
            </span>
            <p className={`text-xs mt-1 font-medium ${prazoText[prazoStatus]}`}>
              {encerrada ? 'Finalizada' : tempoLabel}
            </p>
          </div>
        </div>
      </div>

      {/* ── FLUXO SIMPLES ── */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Fluxo da OS</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {FLUXO_ORDEM.map((est, idx) => {
            const passou = idx < idxAtual;
            const atual = idx === idxAtual;
            const futuro = idx > idxAtual;
            return (
              <div key={est} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                    ${passou ? `${ESTAGIO_BG[est]} text-white` : ''}
                    ${atual ? `${ESTAGIO_BG[est]} text-white ring-2 ring-offset-1 animate-pulse ${prazoCores[prazoStatus].replace('border', 'ring')}` : ''}
                    ${futuro ? 'bg-gray-200 text-gray-400' : ''}`}
                    title={data.historicos?.find((h: any) => h.estagio_novo === est && h.nota)?.nota || ''}>
                    {passou ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[9px] mt-0.5 whitespace-nowrap ${atual ? 'font-bold text-gray-800' : passou ? 'text-gray-500' : 'text-gray-400'}`}>
                    {ESTAGIO_LABELS[est]}
                  </span>
                </div>
                {idx < FLUXO_ORDEM.length - 1 && (
                  <div className={`w-4 lg:w-6 h-0.5 ${idx < idxAtual ? ESTAGIO_BG[FLUXO_ORDEM[idx + 1]].replace('500', '300') : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Seletor de próximo estágio */}
        {!encerrada && estagiosPermitidos.length > 0 && (
          <div className="mt-4 pt-3 border-t space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Avançar para:</span>
              <select value={novoEstagio} onChange={(e) => setNovoEstagio(e.target.value as EstagioOS)}
                className="px-2 py-1 border rounded text-sm">
                <option value="">Selecionar...</option>
                {estagiosPermitidos.map((e) => (<option key={e} value={e}>{ESTAGIO_LABELS[e]}</option>))}
              </select>
              {novoEstagio && (
                <button onClick={() => mudarEstagioMutation.mutate({ estagio: novoEstagio as EstagioOS, nota: notaEstagio })}
                  disabled={mudarEstagioMutation.isPending}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50">
                  Confirmar
                </button>
              )}
            </div>
            {novoEstagio && (
              <input type="text" value={notaEstagio} onChange={(e) => setNotaEstagio(e.target.value)}
                placeholder="Nota (opcional) — ex: Aguardando peça do fornecedor"
                className="w-full px-3 py-1.5 border rounded text-sm text-gray-600" />
            )}
          </div>
        )}
        {encerrada && (
          <p className="text-xs text-gray-400 mt-3 pt-3 border-t">OS encerrada — somente leitura</p>
        )}
      </div>

      {/* ── GRID: PENDÊNCIAS + INFO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pendências */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">
              Pendências {pendenciasAbertas.length > 0 && `(${pendenciasAbertas.length} abertas)`}
            </h3>
          </div>

          {!encerrada && (
            <div className="flex gap-2 mb-4">
              <input type="text" value={novaPendencia} onChange={(e) => setNovaPendencia(e.target.value)}
                placeholder="Descreva a pendência..." maxLength={500}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter' && novaPendencia.trim()) criarPendenciaMutation.mutate(novaPendencia.trim()); }} />
              <button onClick={() => novaPendencia.trim() && criarPendenciaMutation.mutate(novaPendencia.trim())}
                disabled={!novaPendencia.trim()}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
                Adicionar
              </button>
            </div>
          )}

          {data.pendencias?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma pendência.</p>
          ) : (
            <div className="space-y-1">
              {/* Abertas primeiro */}
              {pendenciasAbertas.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-amber-50 rounded text-sm border-l-2 border-amber-400">
                  <div>
                    <p className="text-gray-700">{p.descricao}</p>
                    <p className="text-xs text-gray-400">{p.criador?.nome} · {new Date(p.criado_em).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {!encerrada && (
                    <button onClick={() => concluirPendenciaMutation.mutate(p.id)}
                      className="text-green-600 hover:underline text-xs flex-shrink-0 ml-2">Concluir</button>
                  )}
                </div>
              ))}
              {/* Concluídas */}
              {pendenciasConcluidas.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm opacity-70">
                  <div>
                    <p className="text-gray-600 line-through">{p.descricao}</p>
                    <p className="text-xs text-gray-400">{p.resolvedor?.nome} · {new Date(p.data_resolucao).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="text-green-500 text-xs">✓</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info + Cliente */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Cliente</h3>
            <p className="text-sm font-medium">{data.cliente?.nome}</p>
            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
              {data.cliente?.documento && <p>{data.cliente.documento}</p>}
              {data.cliente?.email && <p>{data.cliente.email}</p>}
              {data.cliente?.telefone && <p>{data.cliente.telefone}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Datas</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Abertura: {new Date(data.criado_em).toLocaleDateString('pt-BR')}</p>
              {data.data_previsao && <p>Previsão: {new Date(data.data_previsao).toLocaleDateString('pt-BR')}</p>}
              <p>Responsável: {data.criador?.nome}</p>
            </div>
          </div>

          {/* Monitoramento de tempo */}
          {!encerrada && (
            <div className={`${prazoBg[prazoStatus]} border ${prazoCores[prazoStatus]} rounded-xl p-3`}>
              <p className={`text-xs font-semibold ${prazoText[prazoStatus]}`}>
                {prazoStatus === 'atraso' ? '🔴 Excedeu 48h' : '🟢 Dentro do prazo (48h)'}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {diasNoEstagio > 0 ? `${diasNoEstagio}d ${horasNoEstagio % 24}h neste estágio` : `${horasNoEstagio}h neste estágio`}
              </p>
            </div>
          )}

          {/* PDF */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Relatório</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => gerarPdfMutation.mutate()}
                disabled={gerarPdfMutation.isPending || encerrada}
                className={`px-3 py-1.5 text-xs rounded text-white ${temPdf ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'} disabled:opacity-50`}>
                {gerarPdfMutation.isPending ? 'Gerando...' : temPdf ? 'Regenerar' : 'Gerar PDF'}
              </button>
              {temPdf && (
                <button onClick={() => baixarArquivo(`${api.defaults.baseURL}/ordens/${id}/relatorio/download`, data.relatorios[0]?.nome_arquivo || 'relatorio.pdf')}
                  className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
                  Baixar PDF
                </button>
              )}
            </div>
            {!encerrada && data.estagio === 'CONCLUIDA' && !temPdf && (
              <p className="text-xs text-red-500 mt-2">PDF necessário para avançar ao próximo estágio</p>
            )}
          </div>

          {/* Anexos */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Anexos ({data.anexos?.length || 0})</h3>
            {!encerrada && (
              <label className="block mb-3 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center text-xs text-gray-400 hover:border-blue-400">
                  Clique para enviar (máx. 10 MB)
                </div>
                <input type="file" onChange={handleUpload} className="hidden" />
              </label>
            )}
            {data.anexos?.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum anexo.</p>
            ) : (
              <div className="space-y-1">
                {data.anexos?.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 truncate max-w-[140px]">{a.nome_original}</span>
                    <button onClick={() => baixarArquivo(`${api.defaults.baseURL}/ordens/${id}/anexos/${a.id}/download`, a.nome_original)}
                      className="text-blue-600 hover:underline flex-shrink-0">Baixar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── HISTÓRICO ── */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico</h3>
        {data.historicos?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum registro.</p>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-200" />
            <div className="space-y-3">
              {data.historicos?.map((h: any, i: number) => (
                <div key={h.id} className="relative">
                  <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 ${i === 0 ? 'animate-pulse' : ''} ${
                    h.tipo === 'MUDANCA_ESTAGIO' ? 'bg-blue-500 border-blue-500' :
                    h.tipo === 'PENDENCIA_CONCLUIDA' ? 'bg-green-500 border-green-500' : 'bg-gray-300 border-gray-300'
                  }`} />
                  <p className="text-sm text-gray-700">{h.descricao}</p>
                  {h.estagio_anterior && (
                    <p className="text-xs text-gray-400">{ESTAGIO_LABELS[h.estagio_anterior as EstagioOS]} → {ESTAGIO_LABELS[h.estagio_novo as EstagioOS]}</p>
                  )}
                  {h.nota && (
                    <p className="text-xs text-gray-500 italic mt-0.5">"{h.nota}"</p>
                  )}
                  <p className="text-xs text-gray-400">{h.usuario?.nome} · {new Date(h.criado_em).toLocaleString('pt-BR')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
