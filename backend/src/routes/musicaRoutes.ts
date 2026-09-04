import { Router } from 'express';
import {
    criarMusicaController,
    listarMusicasController,
    listarArtistasController,
    buscarMetadadosController,
    buscarCandidatosController,
    getMusicaController,
    atualizarMusicaController,
    apagarMusicaController,
} from '../controllers/musicaController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';

const router = Router();

router.get('/', authMiddleware, listarMusicasController);
router.get('/artistas', authMiddleware, listarArtistasController);
router.get('/buscar-metadados', authMiddleware, autoriza('musica.gerenciar'), buscarMetadadosController);
router.get('/buscar-getsongbpm', authMiddleware, autoriza('musica.gerenciar'), buscarCandidatosController);
router.get('/:id', authMiddleware, getMusicaController);
router.post('/', authMiddleware, autoriza('musica.gerenciar'), criarMusicaController);
router.put('/:id', authMiddleware, autoriza('musica.gerenciar'), atualizarMusicaController);
router.delete('/:id', authMiddleware, autoriza('musica.gerenciar'), apagarMusicaController);

export default router;
