import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import {
    listarAssinaturasController,
    criarAssinaturaController,
    cancelarAssinaturaController,
} from '../controllers/assinaturaController';

const router = Router();

// Vagas/assinaturas são gestão do dono da org (capacidade assinatura.gerenciar).
router.get('/', authMiddleware, autoriza('assinatura.gerenciar'), listarAssinaturasController);
router.post('/', authMiddleware, autoriza('assinatura.gerenciar'), criarAssinaturaController);
router.delete('/:id', authMiddleware, autoriza('assinatura.gerenciar'), cancelarAssinaturaController);

export default router;
