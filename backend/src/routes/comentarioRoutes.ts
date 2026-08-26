import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
    listarComentariosController,
    criarComentarioController,
} from '../controllers/comentarioController';

const router = Router();

// Comentários são colaborativos: qualquer membro autenticado da org vê e escreve
// (RLS garante o isolamento por organização).
router.get('/culto/:cultoId', authMiddleware, listarComentariosController);
router.post('/', authMiddleware, criarComentarioController);

export default router;
