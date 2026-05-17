import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'os-monitor-jwt-secret-change-me';

export async function login(email: string, senha: string) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    const err: any = new Error('Email ou senha incorretos.');
    err.status = 401;
    err.codigo = 'CREDENCIAIS_INVALIDAS';
    throw err;
  }

  if (!usuario.ativo) {
    const err: any = new Error('Usuário inativo. Contate o administrador.');
    err.status = 403;
    err.codigo = 'USUARIO_INATIVO';
    throw err;
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaValida) {
    const err: any = new Error('Email ou senha incorretos.');
    err.status = 401;
    err.codigo = 'CREDENCIAIS_INVALIDAS';
    throw err;
  }

  const token = jwt.sign({ sub: usuario.id }, JWT_SECRET, { expiresIn: '8h' });

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    },
  };
}

export async function me(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, email: true, ativo: true, criado_em: true },
  });

  if (!usuario) {
    const err: any = new Error('Usuário não encontrado.');
    err.status = 404;
    throw err;
  }

  return usuario;
}
