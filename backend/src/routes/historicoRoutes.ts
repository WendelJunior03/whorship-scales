import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import { listarHistoricoController } from '../controllers/historicoController';

const router = Router();

// Histórico é uma visão de gestão da escala (admin/ministro).
router.get('/culto/:cultoId', authMiddleware, autoriza('escala.gerenciar'), listarHistoricoController);

export default router;
