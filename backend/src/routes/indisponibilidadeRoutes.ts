import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
    listarMinhasController,
    listarPorMembroController,
    listarPorMinisterioController,
    criarController,
    atualizarController,
    deletarController,
} from '../controllers/indisponibilidadeController';

const router = Router();

// Autorização "própria vs gestor" é feita no controller (escopo do dono depende
// do recurso). RLS isola por org em todas as rotas.
router.get('/me', authMiddleware, listarMinhasController);
router.get('/membro/:membroId', authMiddleware, listarPorMembroController);
router.get('/ministerio/:ministerioId', authMiddleware, listarPorMinisterioController);
router.post('/', authMiddleware, criarController);
router.put('/:id', authMiddleware, atualizarController);
router.delete('/:id', authMiddleware, deletarController);

export default router;
