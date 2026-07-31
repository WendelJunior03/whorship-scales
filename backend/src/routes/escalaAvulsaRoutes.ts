import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizator } from '../middlewares/roleMiddleware';
import { createEscalaAvulsaController, getEscalaAvulsaDoCultoController, confirmarPresencaAvulsaController, getMinhaEscalaAvulsaController } from '../controllers/escalaAvulsaController';

const router = Router();

router.post('/', authMiddleware, autorizator(['admin', 'ministro']), createEscalaAvulsaController)
router.get('/culto/:cultoId', authMiddleware, getEscalaAvulsaDoCultoController)
router.put('/:id/status', authMiddleware, confirmarPresencaAvulsaController)
router.get('/me', authMiddleware, getMinhaEscalaAvulsaController)
export default router;