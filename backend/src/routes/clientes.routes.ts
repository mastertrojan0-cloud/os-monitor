import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listar, buscarPorId, criar, atualizar, excluir } from '../controllers/clientes.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', excluir);

export default router;
