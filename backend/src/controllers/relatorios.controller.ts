import { Request, Response } from 'express';
import * as relatoriosService from '../services/pdf.service';
import { RELATORIOS_PATH } from '../utils/paths';
import path from 'path';
import fs from 'fs';

export async function metadados(req: Request, res: Response): Promise<void> {
  try {
    const { ordemId } = req.params;
    const relatorio = await relatoriosService.buscarUltimo(ordemId);
    res.json({ data: relatorio });
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao buscar relatório.' } });
  }
}

export async function gerar(req: Request, res: Response): Promise<void> {
  try {
    const { ordemId } = req.params;
    const relatorio = await relatoriosService.gerar(ordemId, req.usuarioId);
    res.status(201).json({ data: relatorio });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: { codigo: err.codigo || 'ERRO_INTERNO', mensagem: err.message } });
  }
}

export async function download(req: Request, res: Response): Promise<void> {
  try {
    const { ordemId } = req.params;
    const relatorio = await relatoriosService.buscarUltimo(ordemId);
    if (!relatorio) {
      res.status(404).json({ error: { codigo: 'PDF_NAO_ENCONTRADO', mensagem: 'Nenhum PDF gerado para esta OS.' } });
      return;
    }

    const filePath = path.resolve(RELATORIOS_PATH, relatorio.nome_arquivo);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: { codigo: 'ARQUIVO_NAO_ENCONTRADO', mensagem: 'Arquivo PDF não encontrado no servidor.' } });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${relatorio.nome_arquivo}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: { codigo: 'ERRO_INTERNO', mensagem: 'Erro ao baixar PDF.' } });
  }
}
