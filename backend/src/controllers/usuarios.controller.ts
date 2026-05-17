import { Request, Response } from 'express';
import * as usuariosService from '../services/usuarios.service';

export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const limite = Math.min(Number(req.query.limite) || 20, 100);
    const busca = String(req.query.busca || '');
    const result = await usuariosService.listar(pagina, limite, busca);
    res.json({ data: result.usuarios, meta: result.meta });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao listar usuários.' } });
  }
}

export async function buscarPorId(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await usuariosService.buscarPorId(req.params.id);
    if (!usuario) {
      res.status(404).json({ error: { codigo: 'USUARIO_NAO_ENCONTRADO', mensagem: 'Usuário não encontrado.' } });
      return;
    }
    res.json({ data: usuario });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao buscar usuário.' } });
  }
}

export async function criar(req: Request, res: Response): Promise<void> {
  try {
    const { nome, email, senha } = req.body;
    const usuario = await usuariosService.criar(nome, email, senha);
    res.status(201).json({ data: usuario });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await usuariosService.atualizar(req.params.id, req.body);
    res.json({ data: usuario });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}
