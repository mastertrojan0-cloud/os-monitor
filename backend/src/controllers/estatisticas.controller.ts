import { Request, Response } from 'express';
import * as estatisticasService from '../services/estatisticas.service';

export async function resumo(_req: Request, res: Response): Promise<void> {
  try {
    const data = await estatisticasService.resumo();
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao carregar estatísticas.' } });
  }
}
