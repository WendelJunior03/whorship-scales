import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import { getPanoramaController } from '../controllers/panoramaController';

const router = Router();

// Visão de leitura do mês; qualquer membro da org pode ver (RLS isola por org).
router.get('/', authMiddleware, autoriza('escala.visualizar'), getPanoramaController);

export default router;
