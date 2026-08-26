import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import {
    listarRoteiroController,
    criarRoteiroItemController,
    atualizarRoteiroItemController,
    deletarRoteiroItemController,
    reordenarRoteiroController,
} from '../controllers/roteiroController';

const router = Router();

// Ver o roteiro: qualquer membro da org (RLS isola). Editar: admin/ministro.
router.get('/culto/:cultoId', authMiddleware, listarRoteiroController);
router.post('/', authMiddleware, autoriza('repertorio.gerenciar'), criarRoteiroItemController);
router.put('/culto/:cultoId/ordem', authMiddleware, autoriza('repertorio.gerenciar'), reordenarRoteiroController);
router.put('/:id', authMiddleware, autoriza('repertorio.gerenciar'), atualizarRoteiroItemController);
router.delete('/:id', authMiddleware, autoriza('repertorio.gerenciar'), deletarRoteiroItemController);

export default router;
