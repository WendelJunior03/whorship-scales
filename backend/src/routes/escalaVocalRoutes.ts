import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { confirmarPresencaController, createEscalaVocalController, sugerirVocaisController, getEscalaVocalDoCultoController, getMinhaEscalaVocalController } from '../controllers/escalaVocalController';
import { autorizator } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authMiddleware, autorizator(['admin', 'ministro']),createEscalaVocalController)
router.get('/sugestao', authMiddleware, autorizator(['admin', 'ministro']), sugerirVocaisController)
router.get('/culto/:cultoId', authMiddleware, getEscalaVocalDoCultoController)
router.get('/me', authMiddleware, getMinhaEscalaVocalController)
router.put('/:id/status', authMiddleware, confirmarPresencaController)
export default router;