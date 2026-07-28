import { Router } from 'express';
import { createRepertorioController, meuProximoCultoController } from '../controllers/repertorioController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizator } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authMiddleware, autorizator(['admin', 'ministro']), createRepertorioController)
router.get('/meu-proximo-culto', authMiddleware, meuProximoCultoController)

export default router;