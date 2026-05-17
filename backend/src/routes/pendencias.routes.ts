import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listar, criar, concluir } from '../controllers/pendencias.controller';

const router = Router();

router.use(authMiddleware);

router.get('/:ordemId/pendencias', listar);
router.post('/:ordemId/pendencias', criar);
router.patch('/:ordemId/pendencias/:id/concluir', concluir);

export default router;
