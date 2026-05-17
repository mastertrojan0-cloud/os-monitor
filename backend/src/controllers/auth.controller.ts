import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      res.status(400).json({ error: { codigo: 'CAMPOS_OBRIGATORIOS', mensagem: 'Email e senha são obrigatórios.' } });
      return;
    }

    const result = await authService.login(email, senha);
    res.json({ data: result });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await authService.me(req.usuarioId);
    res.json({ data: usuario });
  } catch (err: any) {
    res.status(404).json({ error: { codigo: 'USUARIO_NAO_ENCONTRADO', mensagem: err.message } });
  }
}
