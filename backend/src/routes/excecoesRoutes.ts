import { Router } from 'express';
import { candidatosExcecaoController, createExcecoesController } from '../controllers/excecoesController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/candidatos', authMiddleware, candidatosExcecaoController)
router.post('/', authMiddleware, createExcecoesController)
export default router;