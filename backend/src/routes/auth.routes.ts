import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { login, me } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.get('/me', authMiddleware, me);

export default router;
