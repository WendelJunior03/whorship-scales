import { Router } from 'express';
import { getCultoByIdController, createCultoController, getAllCultosController, deleteCultoController } from '../controllers/cultoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizator } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authMiddleware, autorizator(['admin']), createCultoController)
router.get('/', authMiddleware, autorizator(['admin', 'ministro']), getAllCultosController)
router.get('/:id', authMiddleware, getCultoByIdController)
router.delete('/:id', authMiddleware, autorizator(['admin']), deleteCultoController)

export default router;