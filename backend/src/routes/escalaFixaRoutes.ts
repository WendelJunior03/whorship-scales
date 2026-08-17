import { Router } from 'express';
import { createEscalaFixaController, deleteEscalaFixaController, getEscalaEfetivaController, getEscalaFixaMontadaController, getMyEscalaFixaController } from '../controllers/escalaFixaController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
const router = Router();

router.post('/', authMiddleware, autoriza('escala.gerenciar'), createEscalaFixaController)
router.get('/', authMiddleware, autoriza('escala.gerenciar'), getEscalaFixaMontadaController)
router.delete('/:id', authMiddleware, autoriza('escala.gerenciar'), deleteEscalaFixaController)
router.get('/me', authMiddleware, getMyEscalaFixaController)
router.get('/efetiva', authMiddleware, getEscalaEfetivaController)
export default router;