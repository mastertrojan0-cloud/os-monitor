import prisma from '../lib/prisma';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { RELATORIOS_PATH } from '../utils/paths';
import * as historicoService from './historico.service';

// ── Identidade visual ──
const EMPRESA = 'Security Dynamics';
const COR_PRIMARIA = '#1a3a5c';
const COR_CINZA = '#6b7280';

// Caminho do logo — coloque o arquivo "logo.jpeg" ou "logo.png" em backend/assets/
const LOGO_PATH = path.resolve(__dirname, '../../assets/logo.jpeg');
const LOGO_EXISTS = fs.existsSync(LOGO_PATH);

export async function buscarUltimo(ordemId: string) {
  return prisma.relatorioPdf.findFirst({
    where: { ordem_id: ordemId },
    orderBy: { criado_em: 'desc' },
    include: { criador: { select: { id: true, nome: true } } },
  });
}

export async function gerar(ordemId: string, usuarioId: string) {
  const ordem = await prisma.ordemServico.findUnique({
    where: { id: ordemId },
    include: {
      cliente: true,
      criador: { select: { nome: true } },
      pendencias: {
        where: { resolvida: true },
        include: { resolvedor: { select: { nome: true } } },
      },
      historicos: {
        orderBy: { criado_em: 'desc' },
        take: 10,
        include: { usuario: { select: { nome: true } } },
      },
    },
  });

  if (!ordem) {
    const err: any = new Error('Ordem de serviço não encontrada.');
    err.status = 404;
    throw err;
  }

  await fs.promises.mkdir(RELATORIOS_PATH, { recursive: true });
  const nomeArquivo = `${ordem.numero}_relatorio.pdf`;
  const caminhoArquivo = path.join(RELATORIOS_PATH, nomeArquivo);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(caminhoArquivo);
    doc.pipe(stream);

    // ── CABEÇALHO ──
    if (LOGO_EXISTS) {
      doc.image(LOGO_PATH, 50, 40, { width: 120 });
      doc.moveDown(3);
    }
    doc.fontSize(10).fillColor(COR_CINZA).text(EMPRESA, 50, LOGO_EXISTS ? 95 : 50);
    doc.moveDown(0.3);
    doc.fontSize(7).fillColor('#9ca3af').text('Sistema OS Monitor — Relatório de Ordem de Serviço');
    doc.moveDown(0.5);

    // Linha separadora
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COR_PRIMARIA).lineWidth(1.5).stroke();
    doc.moveDown(1);

    // ── TÍTULO ──
    doc.fontSize(14).fillColor(COR_PRIMARIA).text(`Relatório: ${ordem.numero}`, { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#374151').text(ordem.titulo);
    doc.moveDown(1);

    // ── DADOS DO CLIENTE ──
    doc.fontSize(10).fillColor(COR_PRIMARIA).text('Dados do Cliente', { underline: true });
    doc.moveDown(0.5);
    const clienteLinhas = [
      ['Nome:', ordem.cliente.nome],
      ['Documento:', ordem.cliente.documento || '—'],
      ['Email:', ordem.cliente.email || '—'],
      ['Telefone:', ordem.cliente.telefone || '—'],
      ['Endereço:', ordem.cliente.endereco || '—'],
    ];
    clienteLinhas.forEach(([label, valor]) => {
      doc.fontSize(9).fillColor(COR_CINZA).text(label, 60, doc.y, { width: 80, continued: true });
      doc.fillColor('#111827').text(valor);
      doc.moveDown(0.2);
    });
    doc.moveDown(0.5);

    // ── DETALHES DA OS ──
    doc.fontSize(10).fillColor(COR_PRIMARIA).text('Detalhes da Ordem de Serviço', { underline: true });
    doc.moveDown(0.5);
    const detalhesLinhas = [
      ['Descrição:', ordem.descricao || '—'],
      ['Estágio:', ordem.estagio],
      ['Responsável:', ordem.criador?.nome || '—'],
      ['Data de abertura:', new Date(ordem.criado_em).toLocaleDateString('pt-BR')],
      ['Previsão:', ordem.data_previsao ? new Date(ordem.data_previsao).toLocaleDateString('pt-BR') : '—'],
    ];
    detalhesLinhas.forEach(([label, valor]) => {
      doc.fontSize(9).fillColor(COR_CINZA).text(label, 60, doc.y, { width: 90, continued: true });
      doc.fillColor('#111827').text(valor);
      doc.moveDown(0.2);
    });
    doc.moveDown(0.5);

    // ── PENDÊNCIAS RESOLVIDAS ──
    doc.fontSize(10).fillColor(COR_PRIMARIA).text('Pendências Resolvidas', { underline: true });
    doc.moveDown(0.5);
    if (ordem.pendencias.length === 0) {
      doc.fontSize(9).fillColor(COR_CINZA).text('Nenhuma pendência resolvida.');
    } else {
      ordem.pendencias.forEach((p) => {
        doc.fontSize(9).fillColor('#111827').text(`• ${p.descricao}`);
        doc.fontSize(8).fillColor(COR_CINZA)
          .text(`  Resolvida por ${p.resolvedor?.nome || '—'} em ${p.data_resolucao ? new Date(p.data_resolucao).toLocaleDateString('pt-BR') : '—'}`);
        doc.moveDown(0.2);
      });
    }
    doc.moveDown(0.5);

    // ── HISTÓRICO RESUMIDO ──
    doc.fontSize(10).fillColor(COR_PRIMARIA).text('Histórico de Operações', { underline: true });
    doc.moveDown(0.5);
    if (ordem.historicos.length === 0) {
      doc.fontSize(9).fillColor(COR_CINZA).text('Nenhum registro.');
    } else {
      const tiposLabels: Record<string, string> = {
        CRIACAO_OS: 'Criação', MUDANCA_ESTAGIO: 'Mudança de estágio',
        PENDENCIA_CRIADA: 'Pendência criada', PENDENCIA_CONCLUIDA: 'Pendência concluída',
        ANEXO_ADICIONADO: 'Anexo adicionado', PDF_GERADO: 'PDF gerado',
      };
      ordem.historicos.forEach((h) => {
        const tipoLabel = tiposLabels[h.tipo] || h.tipo;
        doc.fontSize(9).fillColor('#111827').text(`${tipoLabel}: ${h.descricao}`);
        doc.fontSize(8).fillColor(COR_CINZA)
          .text(`  ${h.usuario?.nome || '—'} — ${new Date(h.criado_em).toLocaleString('pt-BR')}`);
        doc.moveDown(0.15);
      });
    }
    doc.moveDown(0.5);

    // ── RODAPÉ ──
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COR_CINZA).lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.fontSize(7).fillColor('#9ca3af')
      .text(`Relatório gerado em ${new Date().toLocaleString('pt-BR')} — ${EMPRESA} — OS Monitor v1.0`, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(6).fillColor('#cbd5e1')
      .text('VE / BR — © Antonio M.', { align: 'center' });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const stat = await fs.promises.stat(caminhoArquivo);

  return prisma.$transaction(async (tx) => {
    const relatorio = await tx.relatorioPdf.create({
      data: {
        ordem_id: ordemId,
        nome_arquivo: nomeArquivo,
        caminho_arquivo: nomeArquivo,
        tamanho_bytes: stat.size,
        criado_por: usuarioId,
      },
      include: { criador: { select: { id: true, nome: true } } },
    });

    await historicoService.registrar(tx, {
      ordem_id: ordemId,
      usuario_id: usuarioId,
      tipo: 'PDF_GERADO',
      descricao: 'Relatório PDF gerado.',
    });

    return relatorio;
  });
}
