import { Router } from 'express';
import { createExcecoesController } from '../controllers/excecoesController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authMiddleware, createExcecoesController)
export default router;