import prisma from '../lib/prisma';

export async function listar({ pagina, limite, busca }: { pagina: number; limite: number; busca: string }) {
  const where = busca
    ? {
        OR: [
          { nome: { contains: busca } },
          { email: { contains: busca } },
          { documento: { contains: busca } },
        ],
      }
    : {};

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      skip: (pagina - 1) * limite,
      take: limite,
      orderBy: { criado_em: 'desc' },
      include: {
        criador: { select: { id: true, nome: true } },
        _count: { select: { ordens: true } },
      },
    }),
    prisma.cliente.count({ where }),
  ]);

  return {
    clientes: clientes.map(({ _count, ...cliente }) => ({
      ...cliente,
      _total_os: _count.ordens,
    })),
    meta: { total, pagina, limite },
  };
}

export async function buscarPorId(id: string) {
  return prisma.cliente.findUnique({
    where: { id },
    include: {
      criador: { select: { id: true, nome: true } },
      _count: { select: { ordens: true } },
    },
  });
}

export async function criar(data: any, usuarioId: string) {
  const { nome, email, telefone, documento, endereco, observacoes } = data;

  if (!nome || nome.length < 3 || nome.length > 150) {
    const err: any = new Error('Nome é obrigatório e deve ter entre 3 e 150 caracteres.');
    err.status = 400;
    err.codigo = 'VALIDACAO';
    throw err;
  }

  if (documento) {
    const existente = await prisma.cliente.findFirst({ where: { documento } });
    if (existente) {
      const err: any = new Error('Já existe um cliente com este documento.');
      err.status = 409;
      err.codigo = 'DOCUMENTO_DUPLICADO';
      throw err;
    }
  }

  return prisma.cliente.create({
    data: {
      nome,
      email: email || null,
      telefone: telefone || null,
      documento: documento || null,
      endereco: endereco || null,
      observacoes: observacoes || null,
      criado_por: usuarioId,
    },
    include: {
      criador: { select: { id: true, nome: true } },
    },
  });
}

export async function atualizar(id: string, data: any) {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    const err: any = new Error('Cliente não encontrado.');
    err.status = 404;
    err.codigo = 'CLIENTE_NAO_ENCONTRADO';
    throw err;
  }

  if (data.documento) {
    const existente = await prisma.cliente.findFirst({
      where: { documento: data.documento, id: { not: id } },
    });
    if (existente) {
      const err: any = new Error('Já existe outro cliente com este documento.');
      err.status = 409;
      err.codigo = 'DOCUMENTO_DUPLICADO';
      throw err;
    }
  }

  return prisma.cliente.update({
    where: { id },
    data: {
      ...(data.nome !== undefined && { nome: data.nome }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.telefone !== undefined && { telefone: data.telefone }),
      ...(data.documento !== undefined && { documento: data.documento }),
      ...(data.endereco !== undefined && { endereco: data.endereco }),
      ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
    },
    include: {
      criador: { select: { id: true, nome: true } },
    },
  });
}

export async function excluir(id: string) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { _count: { select: { ordens: true } } },
  });

  if (!cliente) {
    const err: any = new Error('Cliente não encontrado.');
    err.status = 404;
    throw err;
  }

  if (cliente._count.ordens > 0) {
    const err: any = new Error('Não é possível excluir cliente com ordens de serviço vinculadas. Exclua as OS primeiro.');
    err.status = 409;
    err.codigo = 'CLIENTE_COM_OS';
    throw err;
  }

  await prisma.cliente.delete({ where: { id } });
}
