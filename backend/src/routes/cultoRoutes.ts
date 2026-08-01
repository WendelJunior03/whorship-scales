import { Router } from 'express';
import { getCultoByIdController, createCultoController, getAllCultosController, deleteCultoController } from '../controllers/cultoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizator } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authMiddleware, autorizator(['admin']), createCultoController)
router.get('/', authMiddleware, getAllCultosController)
router.get('/:id', authMiddleware, getCultoByIdController)
router.delete('/:id', authMiddleware, autorizator(['admin']), deleteCultoController)

export default router;