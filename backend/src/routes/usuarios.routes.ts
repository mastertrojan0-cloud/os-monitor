import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listar, buscarPorId, criar, atualizar } from '../controllers/usuarios.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', criar);
router.put('/:id', atualizar);

export default router;
