import { Router } from 'express';
import { getCultoByIdController, createCultoController } from '../controllers/cultoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizator } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authMiddleware, autorizator(['admin']), createCultoController)
router.get('/:id', authMiddleware, getCultoByIdController)

export default router;