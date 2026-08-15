import { Router } from 'express';
import {
    criarOrganizacao,
    entrarComCodigo,
    minhaOrganizacao,
} from '../controllers/organizacaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Fluxos públicos de cadastro (spec 01).
router.post('/', criarOrganizacao);
router.post('/entrar', entrarComCodigo);

// Organização atual do usuário logado (exibir/compartilhar código de convite).
router.get('/atual', authMiddleware, minhaOrganizacao);

export default router;
