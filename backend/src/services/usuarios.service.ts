import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

export async function listar(pagina: number, limite: number, busca: string) {
  const where = busca
    ? { OR: [{ nome: { contains: busca } }, { email: { contains: busca } }] }
    : {};

  const [usuarios, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      skip: (pagina - 1) * limite,
      take: limite,
      orderBy: { criado_em: 'desc' },
      select: {
        id: true, nome: true, email: true, ativo: true, criado_em: true,
        _count: { select: { ordens_criadas: true } },
      },
    }),
    prisma.usuario.count({ where }),
  ]);

  return {
    usuarios: usuarios.map(({ _count, ...u }) => ({ ...u, total_os: _count.ordens_criadas })),
    meta: { total, pagina, limite },
  };
}

export async function buscarPorId(id: string) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true, nome: true, email: true, ativo: true, criado_em: true,
      _count: { select: { ordens_criadas: true } },
    },
  });
}

export async function criar(nome: string, email: string, senha: string) {
  if (!nome || nome.length < 3) {
    const err: any = new Error('Nome deve ter no mínimo 3 caracteres.');
    err.status = 400;
    throw err;
  }
  if (!email || !email.includes('@')) {
    const err: any = new Error('Email inválido.');
    err.status = 400;
    throw err;
  }
  if (!senha || senha.length < 6) {
    const err: any = new Error('Senha deve ter no mínimo 6 caracteres.');
    err.status = 400;
    throw err;
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    const err: any = new Error('Já existe um usuário com este email.');
    err.status = 409;
    err.codigo = 'EMAIL_DUPLICADO';
    throw err;
  }

  const senha_hash = await bcrypt.hash(senha, 10);
  return prisma.usuario.create({
    data: { nome, email, senha_hash },
    select: { id: true, nome: true, email: true, ativo: true, criado_em: true },
  });
}

export async function atualizar(id: string, data: { nome?: string; email?: string; senha?: string; ativo?: boolean }) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    const err: any = new Error('Usuário não encontrado.');
    err.status = 404;
    throw err;
  }

  if (data.email && data.email !== usuario.email) {
    const existente = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existente) {
      const err: any = new Error('Já existe um usuário com este email.');
      err.status = 409;
      err.codigo = 'EMAIL_DUPLICADO';
      throw err;
    }
  }

  const updateData: any = {};
  if (data.nome) updateData.nome = data.nome;
  if (data.email) updateData.email = data.email;
  if (data.senha) updateData.senha_hash = await bcrypt.hash(data.senha, 10);
  if (data.ativo !== undefined) updateData.ativo = data.ativo;

  return prisma.usuario.update({
    where: { id },
    data: updateData,
    select: { id: true, nome: true, email: true, ativo: true, criado_em: true },
  });
}
