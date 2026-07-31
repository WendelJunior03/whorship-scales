import { Router } from 'express';
import { createRepertorioController, meuProximoCultoController, getRepertorioDoCultoController } from '../controllers/repertorioController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizator } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authMiddleware, autorizator(['admin', 'ministro']), createRepertorioController)
router.get('/meu-proximo-culto', authMiddleware, meuProximoCultoController)
router.get('/:cultoId', authMiddleware, getRepertorioDoCultoController)

export default router;