import { Request, Response } from 'express';
import * as auditoriaService from '../services/auditoria.service';

export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const limite = Math.min(Number(req.query.limite) || 30, 100);
    const tipo = req.query.tipo as string | undefined;
    const usuario = req.query.usuario as string | undefined;
    const dataInicio = req.query.dataInicio as string | undefined;
    const dataFim = req.query.dataFim as string | undefined;

    const result = await auditoriaService.listar({ pagina, limite, tipo, usuario, dataInicio, dataFim });
    res.json({ data: result.registros, meta: result.meta });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao carregar auditoria.' } });
  }
}

export async function tipos(_req: Request, res: Response): Promise<void> {
  try {
    const result = await auditoriaService.tipos();
    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao carregar tipos.' } });
  }
}
