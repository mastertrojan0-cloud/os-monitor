import prisma from '../lib/prisma';
import { EstagioOS } from '@prisma/client';
import { TRANSICOES_PERMITIDAS } from '../utils/constants';
import { RELATORIOS_PATH, ANEXOS_PATH } from '../utils/paths';
import * as historicoService from './historico.service';
import fs from 'fs';
import path from 'path';

interface ListarParams {
  pagina: number;
  limite: number;
  busca: string;
  estagio?: string;
  clienteId?: string;
}

export async function listar({ pagina, limite, busca, estagio, clienteId }: ListarParams) {
  const where: any = {};

  if (busca) {
    where.OR = [
      { numero: { contains: busca } },
      { titulo: { contains: busca } },
      { cliente: { nome: { contains: busca } } },
    ];
  }

  if (estagio) {
    where.estagio = estagio;
  }

  if (clienteId) {
    where.cliente_id = clienteId;
  }

  const [ordens, total] = await Promise.all([
    prisma.ordemServico.findMany({
      where,
      skip: (pagina - 1) * limite,
      take: limite,
      orderBy: { criado_em: 'desc' },
      include: {
        cliente: { select: { id: true, nome: true } },
        criador: { select: { id: true, nome: true } },
        pendencias: { where: { resolvida: false }, select: { id: true } },
        relatorios: { select: { id: true }, take: 1, orderBy: { criado_em: 'desc' } },
      },
    }),
    prisma.ordemServico.count({ where }),
  ]);

  return {
    ordens: ordens.map(({ pendencias, relatorios, ...os }) => ({
      ...os,
      _tem_pendencia: pendencias.length > 0,
      _tem_pdf: relatorios.length > 0,
    })),
    meta: { total, pagina, limite },
  };
}

export async function buscarPorId(id: string) {
  return prisma.ordemServico.findUnique({
    where: { id },
    include: {
      cliente: {
        select: { id: true, nome: true, email: true, telefone: true, documento: true, endereco: true },
      },
      criador: { select: { id: true, nome: true } },
      pendencias: {
        orderBy: [{ resolvida: 'asc' }, { criado_em: 'desc' }],
        include: {
          criador: { select: { id: true, nome: true } },
          resolvedor: { select: { id: true, nome: true } },
        },
      },
      historicos: {
        orderBy: { criado_em: 'desc' },
        include: {
          usuario: { select: { id: true, nome: true } },
        },
      },
      anexos: {
        orderBy: { criado_em: 'desc' },
        include: {
          criador: { select: { id: true, nome: true } },
        },
      },
      relatorios: {
        orderBy: { criado_em: 'desc' },
        include: {
          criador: { select: { id: true, nome: true } },
        },
      },
    },
  });
}

export async function criar(data: any, usuarioId: string) {
  const { cliente_id, titulo, descricao, data_previsao } = data;

  if (!cliente_id) {
    const err: any = new Error('Cliente é obrigatório.');
    err.status = 400;
    throw err;
  }

  if (!titulo || titulo.length < 5 || titulo.length > 200) {
    const err: any = new Error('Título é obrigatório e deve ter entre 5 e 200 caracteres.');
    err.status = 400;
    throw err;
  }

  if (data_previsao) {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const prev = new Date(data_previsao); prev.setHours(0, 0, 0, 0);
    if (prev.getTime() < hoje.getTime()) {
      const err: any = new Error('A data de previsão não pode ser anterior a hoje.');
      err.status = 400;
      throw err;
    }
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: cliente_id } });
  if (!cliente) {
    const err: any = new Error('Cliente informado não existe.');
    err.status = 400;
    err.codigo = 'CLIENTE_NAO_ENCONTRADO';
    throw err;
  }

  // Gera número sequencial: OS-AAAA-NNNNN
  const ano = new Date().getFullYear();
  const count = await prisma.ordemServico.count({
    where: { criado_em: { gte: new Date(`${ano}-01-01`) } },
  });
  const numero = `OS-${ano}-${String(count + 1).padStart(5, '0')}`;

  return prisma.$transaction(async (tx) => {
    const ordem = await tx.ordemServico.create({
      data: {
        numero,
        cliente_id,
        titulo,
        descricao: descricao || null,
        data_previsao: data_previsao ? new Date(data_previsao) : null,
        criado_por: usuarioId,
        estagio: 'ABERTA',
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        criador: { select: { id: true, nome: true } },
      },
    });

    await historicoService.registrar(tx, {
      ordem_id: ordem.id,
      usuario_id: usuarioId,
      tipo: 'CRIACAO_OS',
      descricao: 'Ordem de serviço criada.',
      estagio_novo: 'ABERTA',
    });

    return ordem;
  });
}

export async function atualizar(id: string, data: any) {
  const ordem = await prisma.ordemServico.findUnique({ where: { id } });
  if (!ordem) {
    const err: any = new Error('Ordem de serviço não encontrada.');
    err.status = 404;
    throw err;
  }

  return prisma.ordemServico.update({
    where: { id },
    data: {
      ...(data.titulo !== undefined && { titulo: data.titulo }),
      ...(data.descricao !== undefined && { descricao: data.descricao }),
      ...(data.data_previsao !== undefined && { data_previsao: new Date(data.data_previsao) }),
    },
    include: {
      cliente: { select: { id: true, nome: true } },
      criador: { select: { id: true, nome: true } },
    },
  });
}

export async function mudarEstagio(id: string, novoEstagio: EstagioOS, usuarioId: string, nota?: string) {
  const ordem = await prisma.ordemServico.findUnique({ where: { id } });
  if (!ordem) {
    const err: any = new Error('Ordem de serviço não encontrada.');
    err.status = 404;
    throw err;
  }

  if (ordem.estagio === novoEstagio) {
    return ordem;
  }

  // Valida transição permitida
  const permitidos = TRANSICOES_PERMITIDAS[ordem.estagio];
  if (!permitidos.includes(novoEstagio)) {
    const err: any = new Error(`Transição inválida de ${ordem.estagio} para ${novoEstagio}.`);
    err.status = 409;
    err.codigo = 'TRANSICAO_INVALIDA';
    throw err;
  }

  // Bloqueio: RELATORIO_ENTREGUE requer PDF
  if (novoEstagio === 'RELATORIO_ENTREGUE') {
    const pdf = await prisma.relatorioPdf.findFirst({
      where: { ordem_id: id },
    });
    if (!pdf) {
      const err: any = new Error('É necessário gerar o relatório PDF antes de marcar como Relatório Entregue.');
      err.status = 409;
      err.codigo = 'PDF_NAO_GERADO';
      throw err;
    }
  }

  return prisma.$transaction(async (tx) => {
    const atualizada = await tx.ordemServico.update({
      where: { id },
      data: { estagio: novoEstagio },
      include: {
        cliente: { select: { id: true, nome: true } },
        criador: { select: { id: true, nome: true } },
      },
    });

    await historicoService.registrar(tx, {
      ordem_id: id,
      usuario_id: usuarioId,
      tipo: 'MUDANCA_ESTAGIO',
      descricao: `Estágio alterado de ${ordem.estagio} para ${novoEstagio}.`,
      estagio_anterior: ordem.estagio,
      estagio_novo: novoEstagio,
      nota: nota || null,
    });

    return atualizada;
  });
}

export async function excluir(id: string) {
  const ordem = await prisma.ordemServico.findUnique({ where: { id } });
  if (!ordem) {
    const err: any = new Error('Ordem de serviço não encontrada.');
    err.status = 404;
    throw err;
  }

  // Apaga arquivos físicos antes de remover registros
  const pdfs = await prisma.relatorioPdf.findMany({ where: { ordem_id: id } });
  for (const pdf of pdfs) {
    const filePath = path.join(RELATORIOS_PATH, pdf.caminho_arquivo);
    fs.unlink(filePath, () => {});
  }

  const anexos = await prisma.anexo.findMany({ where: { ordem_id: id } });
  for (const anexo of anexos) {
    const filePath = path.join(ANEXOS_PATH, anexo.caminho_arquivo);
    fs.unlink(filePath, () => {});
  }

  await prisma.$transaction(async (tx) => {
    await tx.historico.deleteMany({ where: { ordem_id: id } });
    await tx.pendencia.deleteMany({ where: { ordem_id: id } });
    await tx.relatorioPdf.deleteMany({ where: { ordem_id: id } });
    await tx.anexo.deleteMany({ where: { ordem_id: id } });
    await tx.ordemServico.delete({ where: { id } });
  });
}
