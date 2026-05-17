import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';

export async function resumo(req: Request, res: Response): Promise<void> {
  try {
    const data = await dashboardService.resumo();
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao carregar dashboard.' } });
  }
}
