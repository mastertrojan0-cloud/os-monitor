import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { metadados, gerar, download } from '../controllers/relatorios.controller';

const router = Router();

router.use(authMiddleware);

router.get('/:ordemId/relatorio', metadados);
router.post('/:ordemId/relatorio', gerar);
router.get('/:ordemId/relatorio/download', download);

export default router;
