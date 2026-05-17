import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[OS Monitor] Erro interno:', err.message);

  const status = err.status || 500;
  const codigo = err.codigo || 'ERRO_INTERNO';
  res.status(status).json({ error: { codigo, mensagem: err.message } });
}
