import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
    statusIntegracoesController,
    conectarGoogleController,
    desconectarGoogleController,
    listarVinculosController,
    sincronizarAgendaController,
} from '../controllers/integracaoController';

const router = Router();

// Status é público (a UI decide se mostra os botões). O resto é do próprio membro.
router.get('/status', statusIntegracoesController);
router.get('/', authMiddleware, listarVinculosController);
router.post('/google/conectar', authMiddleware, conectarGoogleController);
router.delete('/google', authMiddleware, desconectarGoogleController);
router.post('/google/agenda/sincronizar', authMiddleware, sincronizarAgendaController);

export default router;
