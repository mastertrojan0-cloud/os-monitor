import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'os-monitor-jwt-secret-change-me';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header) {
    res.status(401).json({ error: { codigo: 'TOKEN_AUSENTE', mensagem: 'Token de autenticação não informado.' } });
    return;
  }

  const [, token] = header.split(' ');

  if (!token) {
    res.status(401).json({ error: { codigo: 'TOKEN_INVALIDO', mensagem: 'Token mal formatado.' } });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    req.usuarioId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: { codigo: 'TOKEN_EXPIRADO', mensagem: 'Token inválido ou expirado.' } });
  }
}
