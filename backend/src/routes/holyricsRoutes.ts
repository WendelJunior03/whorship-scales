import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import { requerRecurso } from '../middlewares/recursoMiddleware';
import {
    getHolyricsController,
    salvarHolyricsController,
    removerHolyricsController,
    testarHolyricsController,
} from '../controllers/holyricsController';

// Montado em /ministerios — integração Holyrics é por ministério.
const router = Router();

const guarda = [authMiddleware, autoriza('integracao.gerenciar'), requerRecurso('integracoes.holyrics')];

router.get('/:id/holyrics', ...guarda, getHolyricsController);
router.put('/:id/holyrics', ...guarda, salvarHolyricsController);
router.delete('/:id/holyrics', ...guarda, removerHolyricsController);
router.post('/:id/holyrics/testar', ...guarda, testarHolyricsController);

export default router;
