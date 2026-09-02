import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import { requerRecurso } from '../middlewares/recursoMiddleware';
import {
    listarTokensController,
    criarTokenController,
    revogarTokenController,
} from '../controllers/apiTokenController';

const router = Router();

// Gestão dos tokens de API: admin/líder da org (integracao.gerenciar) + recurso PRO.
const guarda = [authMiddleware, autoriza('integracao.gerenciar'), requerRecurso('integracoes.api_tokens')];

router.get('/', ...guarda, listarTokensController);
router.post('/', ...guarda, criarTokenController);
router.delete('/:id', ...guarda, revogarTokenController);

export default router;
