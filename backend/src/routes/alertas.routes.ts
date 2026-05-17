import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listar } from '../controllers/alertas.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', listar);

export default router;
