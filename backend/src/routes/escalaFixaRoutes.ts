import { Router } from 'express';
import { createEscalaFixaController, deleteEscalaFixaController, getEscalaEfetivaController, getEscalaFixaMontadaController, getMyEscalaFixaController } from '../controllers/escalaFixaController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizator } from '../middlewares/roleMiddleware';
const router = Router();

router.post('/', authMiddleware, autorizator(['admin', 'ministro']), createEscalaFixaController)
router.get('/', authMiddleware, autorizator(['admin', 'ministro']), getEscalaFixaMontadaController)
router.delete('/:id', authMiddleware, autorizator(['admin', 'ministro']), deleteEscalaFixaController)
router.get('/me', authMiddleware, getMyEscalaFixaController)
router.get('/efetiva', authMiddleware, getEscalaEfetivaController)
export default router;