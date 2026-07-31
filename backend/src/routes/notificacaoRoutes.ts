import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getMinhasNotificacoesController, marcarComoLidaController } from '../controllers/notificacaoController';

const router = Router();

router.get('/me', authMiddleware, getMinhasNotificacoesController)
router.put('/:id/lida', authMiddleware, marcarComoLidaController)

export default router;
