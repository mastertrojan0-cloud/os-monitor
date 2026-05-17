import { Request, Response } from 'express';
import * as ordensService from '../services/ordens.service';

export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const limite = Math.min(Number(req.query.limite) || 20, 100);
    const busca = String(req.query.busca || '');
    const estagio = req.query.estagio as string | undefined;
    const clienteId = req.query.cliente_id as string | undefined;

    const result = await ordensService.listar({ pagina, limite, busca, estagio, clienteId });
    res.json({ data: result.ordens, meta: result.meta });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao listar ordens.' } });
  }
}

export async function buscarPorId(req: Request, res: Response): Promise<void> {
  try {
    const ordem = await ordensService.buscarPorId(req.params.id);
    if (!ordem) {
      res.status(404).json({ error: { codigo: 'OS_NAO_ENCONTRADA', mensagem: 'Ordem de serviço não encontrada.' } });
      return;
    }
    res.json({ data: ordem });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao buscar OS.' } });
  }
}

export async function criar(req: Request, res: Response): Promise<void> {
  try {
    const ordem = await ordensService.criar(req.body, req.usuarioId);
    res.status(201).json({ data: ordem });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  try {
    const ordem = await ordensService.atualizar(req.params.id, req.body);
    res.json({ data: ordem });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}

export async function mudarEstagio(req: Request, res: Response): Promise<void> {
  try {
    const { estagio, nota } = req.body;
    const ordem = await ordensService.mudarEstagio(req.params.id, estagio, req.usuarioId, nota);
    res.json({ data: ordem });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}

export async function excluir(req: Request, res: Response): Promise<void> {
  try {
    await ordensService.excluir(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}
