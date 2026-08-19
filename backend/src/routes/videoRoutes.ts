import { Router } from 'express';
import {
    criarVideoController,
    listarVideosController,
    apagarVideoController,
} from '../controllers/videoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';

const router = Router();

router.get('/', authMiddleware, listarVideosController);
router.post('/', authMiddleware, autoriza('video.gerenciar'), criarVideoController);
router.delete('/:id', authMiddleware, autoriza('video.gerenciar'), apagarVideoController);

export default router;
