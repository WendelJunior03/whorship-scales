import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getMinhasNotificacoesController, limparNotificacoesController, marcarComoLidaController } from '../controllers/notificacaoController';

const router = Router();

router.get('/me', authMiddleware, getMinhasNotificacoesController)
router.put('/:id/lida', authMiddleware, marcarComoLidaController)
router.delete('/me', authMiddleware, limparNotificacoesController)

export default router;
