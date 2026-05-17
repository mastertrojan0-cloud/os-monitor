import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listar, buscarPorId, criar, atualizar, mudarEstagio, excluir } from '../controllers/ordens.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', criar);
router.put('/:id', atualizar);
router.patch('/:id/estagio', mudarEstagio);
router.delete('/:id', excluir);

export default router;
