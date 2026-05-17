import { Request, Response } from 'express';
import * as clientesService from '../services/clientes.service';

export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const limite = Math.min(Number(req.query.limite) || 20, 100);
    const busca = String(req.query.busca || '');

    const result = await clientesService.listar({ pagina, limite, busca });
    res.json({ data: result.clientes, meta: result.meta });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao listar clientes.' } });
  }
}

export async function buscarPorId(req: Request, res: Response): Promise<void> {
  try {
    const cliente = await clientesService.buscarPorId(req.params.id);
    if (!cliente) {
      res.status(404).json({ error: { codigo: 'CLIENTE_NAO_ENCONTRADO', mensagem: 'Cliente não encontrado.' } });
      return;
    }
    res.json({ data: cliente });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao buscar cliente.' } });
  }
}

export async function criar(req: Request, res: Response): Promise<void> {
  try {
    const cliente = await clientesService.criar(req.body, req.usuarioId);
    res.status(201).json({ data: cliente });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  try {
    const cliente = await clientesService.atualizar(req.params.id, req.body);
    res.json({ data: cliente });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}

export async function excluir(req: Request, res: Response): Promise<void> {
  try {
    await clientesService.excluir(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}
