import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import { createEscalaAvulsaController, getEscalaAvulsaDoCultoController, confirmarPresencaAvulsaController, getMinhaEscalaAvulsaController, deleteEscalaAvulsaController } from '../controllers/escalaAvulsaController';

const router = Router();

router.post('/', authMiddleware, autoriza('escala.gerenciar'), createEscalaAvulsaController)
router.get('/culto/:cultoId', authMiddleware, getEscalaAvulsaDoCultoController)
router.put('/:id/status', authMiddleware, confirmarPresencaAvulsaController)
router.get('/me', authMiddleware, getMinhaEscalaAvulsaController)
router.delete('/:id', authMiddleware, autoriza('escala.gerenciar'), deleteEscalaAvulsaController)
export default router;