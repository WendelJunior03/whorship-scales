import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { createEscalaVocalController, sugerirVocaisController } from '../controllers/escalaVocalController';
import { autorizator } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authMiddleware, autorizator(['admin', 'ministro']),createEscalaVocalController)
router.get('/sugestao', authMiddleware, autorizator(['admin', 'ministro']), sugerirVocaisController)
export default router;