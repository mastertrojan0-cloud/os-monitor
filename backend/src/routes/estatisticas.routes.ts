import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { resumo } from '../controllers/estatisticas.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', resumo);

export default router;
