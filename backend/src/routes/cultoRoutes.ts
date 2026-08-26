import { Router } from 'express';
import { getCultoByIdController, createCultoController, getAllCultosController, deleteCultoController, getResumoCultosController } from '../controllers/cultoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authMiddleware, autoriza('culto.gerenciar'), createCultoController)
router.get('/', authMiddleware, getAllCultosController)
// `/resumo` antes de `/:id` pra não ser capturado pela rota paramétrica.
router.get('/resumo', authMiddleware, getResumoCultosController)
router.get('/:id', authMiddleware, getCultoByIdController)
router.delete('/:id', authMiddleware, autoriza('culto.gerenciar'), deleteCultoController)

export default router;