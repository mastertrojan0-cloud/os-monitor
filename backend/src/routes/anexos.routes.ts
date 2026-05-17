import { Router } from 'express';
import multer from 'multer';
import { ANEXOS_PATH } from '../utils/paths';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listar, upload, download } from '../controllers/anexos.controller';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Pasta final criada pelo controller (ano/mês)
    cb(null, ANEXOS_PATH);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    cb(null, `${unique}_${file.originalname}`);
  },
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = Router();

router.use(authMiddleware);

router.get('/:ordemId/anexos', listar);
router.post('/:ordemId/anexos', uploadMiddleware.single('arquivo'), upload);
router.get('/:ordemId/anexos/:id/download', download);

export default router;
