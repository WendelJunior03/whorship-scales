import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import {
    listarAvisosController,
    contarNaoLidosController,
    detalheAvisoController,
    criarAvisoController,
    atualizarAvisoController,
    deletarAvisoController,
    marcarLidoController,
} from '../controllers/avisoController';

const router = Router();

// Ler: qualquer membro da org (RLS isola). Publicar/editar/excluir: aviso.publicar.
router.get('/', authMiddleware, listarAvisosController);
router.get('/nao-lidos', authMiddleware, contarNaoLidosController);
router.get('/:id', authMiddleware, detalheAvisoController);
router.post('/', authMiddleware, autoriza('aviso.publicar'), criarAvisoController);
router.post('/:id/lido', authMiddleware, marcarLidoController);
router.put('/:id', authMiddleware, autoriza('aviso.publicar'), atualizarAvisoController);
router.delete('/:id', authMiddleware, autoriza('aviso.publicar'), deletarAvisoController);

export default router;
