import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listar, tipos } from '../controllers/auditoria.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', listar);
router.get('/tipos', tipos);

export default router;
