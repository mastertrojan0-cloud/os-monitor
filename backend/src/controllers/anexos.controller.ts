import { Request, Response } from 'express';
import * as anexosService from '../services/anexos.service';
import { ANEXOS_PATH } from '../utils/paths';
import { TAMANHO_MAXIMO_ANEXO, EXTENSOES_PERMITIDAS_ANEXO } from '../utils/constants';
import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';

export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const { ordemId } = req.params;
    const anexos = await anexosService.listar(ordemId);
    res.json({ data: anexos });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao listar anexos.' } });
  }
}

export async function upload(req: Request, res: Response): Promise<void> {
  try {
    const { ordemId } = req.params;
    const arquivo = req.file;

    if (!arquivo) {
      res.status(400).json({ error: { codigo: 'ARQUIVO_AUSENTE', mensagem: 'Nenhum arquivo enviado.' } });
      return;
    }

    const extensao = path.extname(arquivo.originalname).toLowerCase();
    if (!EXTENSOES_PERMITIDAS_ANEXO.includes(extensao)) {
      await fsp.unlink(arquivo.path).catch(() => {});
      res.status(400).json({ error: { codigo: 'EXTENSAO_INVALIDA', mensagem: 'Tipo de arquivo não permitido.' } });
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_ANEXO) {
      await fsp.unlink(arquivo.path).catch(() => {});
      res.status(413).json({ error: { codigo: 'ARQUIVO_MUITO_GRANDE', mensagem: 'Arquivo excede o limite de 10 MB.' } });
      return;
    }

    // Move para subpasta ano/mês
    const now = new Date();
    const subdir = path.join(ANEXOS_PATH, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
    await fsp.mkdir(subdir, { recursive: true });
    const novoNome = path.basename(arquivo.path);
    const novoCaminho = path.join(subdir, novoNome);
    await fsp.rename(arquivo.path, novoCaminho);

    const anexo = await anexosService.criar(ordemId, {
      nomeOriginal: arquivo.originalname,
      nomeArquivo: novoNome,
      tamanhoBytes: arquivo.size,
      tipoMime: arquivo.mimetype,
    }, path.relative(ANEXOS_PATH, novoCaminho), req.usuarioId);

    res.status(201).json({ data: anexo });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}

export async function download(req: Request, res: Response): Promise<void> {
  try {
    const { ordemId, id } = req.params;
    const anexo = await anexosService.buscarPorId(id, ordemId);

    if (!anexo) {
      res.status(404).json({ error: { codigo: 'ANEXO_NAO_ENCONTRADO', mensagem: 'Anexo não encontrado.' } });
      return;
    }

    const filePath = path.resolve(ANEXOS_PATH, anexo.caminho_arquivo);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: { codigo: 'ARQUIVO_NAO_ENCONTRADO', mensagem: 'Arquivo não encontrado no servidor.' } });
      return;
    }

    res.setHeader('Content-Type', anexo.tipo_mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${anexo.nome_original}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao baixar anexo.' } });
  }
}
