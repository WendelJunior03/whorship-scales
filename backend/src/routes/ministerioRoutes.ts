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
    listarEquipesController,
    criarEquipeController,
    apagarEquipeController,
    listarMembrosEquipeController,
    adicionarMembroEquipeController,
    removerMembroEquipeController,
    listarClassificacoesController,
    criarClassificacaoController,
    apagarClassificacaoController,
    atribuirClassificacaoController,
    removerClassificacaoDoMembroController,
} from '../controllers/ministerioController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import { distribuirVagasController } from '../controllers/assinaturaController';

const router = Router();

// Ministério
router.get('/', authMiddleware, autoriza('ministerio.visualizar'), listarMinisteriosController);
router.get('/:id', authMiddleware, autoriza('ministerio.visualizar'), getMinisterioController);
router.post('/', authMiddleware, autoriza('ministerio.gerenciar'), criarMinisterioController);
router.put('/:id', authMiddleware, autoriza('ministerio.gerenciar'), atualizarMinisterioController);
router.delete('/:id', authMiddleware, autoriza('ministerio.gerenciar'), apagarMinisterioController);
// Vagas extras alocadas ao ministério (módulo 12) — só admin (assinatura.gerenciar).
router.put('/:id/vagas', authMiddleware, autoriza('assinatura.gerenciar'), distribuirVagasController);

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

// Equipes
router.get('/:id/equipes', authMiddleware, autoriza('ministerio.visualizar'), listarEquipesController);
router.post('/:id/equipes', authMiddleware, autoriza('ministerio.membros.gerenciar'), criarEquipeController);
router.delete('/:id/equipes/:equipeId', authMiddleware, autoriza('ministerio.membros.gerenciar'), apagarEquipeController);
router.get('/:id/equipes/:equipeId/membros', authMiddleware, autoriza('ministerio.visualizar'), listarMembrosEquipeController);
router.post('/:id/equipes/:equipeId/membros', authMiddleware, autoriza('ministerio.membros.gerenciar'), adicionarMembroEquipeController);
router.delete('/:id/equipes/:equipeId/membros/:membroId', authMiddleware, autoriza('ministerio.membros.gerenciar'), removerMembroEquipeController);

// Classificações
router.get('/:id/classificacoes', authMiddleware, autoriza('ministerio.visualizar'), listarClassificacoesController);
router.post('/:id/classificacoes', authMiddleware, autoriza('ministerio.membros.gerenciar'), criarClassificacaoController);
router.delete('/:id/classificacoes/:classificacaoId', authMiddleware, autoriza('ministerio.membros.gerenciar'), apagarClassificacaoController);
router.post('/:id/membro-classificacoes', authMiddleware, autoriza('ministerio.membros.gerenciar'), atribuirClassificacaoController);
router.delete('/:id/membros/:membroId/classificacoes/:classificacaoId', authMiddleware, autoriza('ministerio.membros.gerenciar'), removerClassificacaoDoMembroController);

export default router;
