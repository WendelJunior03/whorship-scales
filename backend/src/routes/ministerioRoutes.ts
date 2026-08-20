import { Router } from 'express';
import {
    criarMinisterioController,
    listarMinisteriosController,
    getMinisterioController,
    atualizarMinisterioController,
    apagarMinisterioController,
    listarMembrosController,
    adicionarMembroController,
    removerMembroController,
    listarFuncoesController,
    criarFuncaoController,
    apagarFuncaoController,
    atribuirFuncaoController,
    removerFuncaoDoMembroController,
} from '../controllers/ministerioController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';

const router = Router();

// Ministério
router.get('/', authMiddleware, autoriza('ministerio.visualizar'), listarMinisteriosController);
router.get('/:id', authMiddleware, autoriza('ministerio.visualizar'), getMinisterioController);
router.post('/', authMiddleware, autoriza('ministerio.gerenciar'), criarMinisterioController);
router.put('/:id', authMiddleware, autoriza('ministerio.gerenciar'), atualizarMinisterioController);
router.delete('/:id', authMiddleware, autoriza('ministerio.gerenciar'), apagarMinisterioController);

// Membros do ministério
router.get('/:id/membros', authMiddleware, autoriza('ministerio.visualizar'), listarMembrosController);
router.post('/:id/membros', authMiddleware, autoriza('ministerio.membros.gerenciar'), adicionarMembroController);
router.delete('/:id/membros/:membroId', authMiddleware, autoriza('ministerio.membros.gerenciar'), removerMembroController);

// Funções do ministério
router.get('/:id/funcoes', authMiddleware, autoriza('ministerio.visualizar'), listarFuncoesController);
router.post('/:id/funcoes', authMiddleware, autoriza('ministerio.membros.gerenciar'), criarFuncaoController);
router.delete('/:id/funcoes/:funcaoId', authMiddleware, autoriza('ministerio.membros.gerenciar'), apagarFuncaoController);

// Funções exercidas por um membro
router.post('/:id/membro-funcoes', authMiddleware, autoriza('ministerio.membros.gerenciar'), atribuirFuncaoController);
router.delete('/:id/membros/:membroId/funcoes/:funcaoId', authMiddleware, autoriza('ministerio.membros.gerenciar'), removerFuncaoDoMembroController);

export default router;
