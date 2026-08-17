import { Router } from 'express';
import { getCultoByIdController, createCultoController, getAllCultosController, deleteCultoController } from '../controllers/cultoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authMiddleware, autoriza('culto.gerenciar'), createCultoController)
router.get('/', authMiddleware, getAllCultosController)
router.get('/:id', authMiddleware, getCultoByIdController)
router.delete('/:id', authMiddleware, autoriza('culto.gerenciar'), deleteCultoController)

export default router;