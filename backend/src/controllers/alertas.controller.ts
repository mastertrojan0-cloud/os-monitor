import { Request, Response } from 'express';
import * as alertasService from '../services/alertas.service';

export async function listar(_req: Request, res: Response): Promise<void> {
  try {
    const data = await alertasService.listar();
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao carregar alertas.' } });
  }
}
