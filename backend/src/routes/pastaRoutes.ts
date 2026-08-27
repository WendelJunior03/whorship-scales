import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import {
    listarPastasController,
    criarPastaController,
    renomearPastaController,
    apagarPastaController,
    listarMusicasDaPastaController,
    adicionarMusicaController,
    removerMusicaController,
} from '../controllers/pastaController';

const router = Router();

// Ver: qualquer membro da org (RLS isola). Gerir pastas: mesma capacidade da música.
router.get('/', authMiddleware, listarPastasController);
router.get('/:id/musicas', authMiddleware, listarMusicasDaPastaController);
router.post('/', authMiddleware, autoriza('musica.gerenciar'), criarPastaController);
router.put('/:id', authMiddleware, autoriza('musica.gerenciar'), renomearPastaController);
router.delete('/:id', authMiddleware, autoriza('musica.gerenciar'), apagarPastaController);
router.post('/:id/musicas', authMiddleware, autoriza('musica.gerenciar'), adicionarMusicaController);
router.delete('/:id/musicas/:musicaId', authMiddleware, autoriza('musica.gerenciar'), removerMusicaController);

export default router;
