import { Request, Response } from 'express';
import * as pendenciasService from '../services/pendencias.service';

export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const { ordemId } = req.params;
    const resolvida = req.query.resolvida as string | undefined;
    const pendencias = await pendenciasService.listar(ordemId, resolvida);
    res.json({ data: pendencias });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao listar pendências.' } });
  }
}

export async function criar(req: Request, res: Response): Promise<void> {
  try {
    const { ordemId } = req.params;
    const { descricao } = req.body;
    const pendencia = await pendenciasService.criar(ordemId, descricao, req.usuarioId);
    res.status(201).json({ data: pendencia });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}

export async function concluir(req: Request, res: Response): Promise<void> {
  try {
    const { ordemId, id } = req.params;
    const pendencia = await pendenciasService.concluir(ordemId, id, req.usuarioId);
    res.json({ data: pendencia });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}
