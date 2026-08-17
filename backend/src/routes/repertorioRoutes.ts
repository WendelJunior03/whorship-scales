import { Router } from 'express';
import { createRepertorioController, meuProximoCultoController, getRepertorioDoCultoController, deleteRepertorioController } from '../controllers/repertorioController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authMiddleware, autoriza('repertorio.gerenciar'), createRepertorioController)
router.get('/meu-proximo-culto', authMiddleware, meuProximoCultoController)
router.get('/:cultoId', authMiddleware, getRepertorioDoCultoController)
router.delete('/:id', authMiddleware, autoriza('repertorio.gerenciar'), deleteRepertorioController)

export default router;