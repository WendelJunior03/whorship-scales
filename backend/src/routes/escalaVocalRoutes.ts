import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { candidatosVocaisController, confirmarPresencaController, createEscalaVocalController, sugerirVocaisController, getEscalaVocalDoCultoController, getMinhaEscalaVocalController, deleteEscalaVocalController, registrarFaltaVocalController } from '../controllers/escalaVocalController';
import { autoriza } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authMiddleware, autoriza('escala.gerenciar'),createEscalaVocalController)
router.get('/sugestao', authMiddleware, autoriza('escala.gerenciar'), sugerirVocaisController)
router.get('/candidatos', authMiddleware, candidatosVocaisController)
router.get('/culto/:cultoId', authMiddleware, getEscalaVocalDoCultoController)
router.get('/me', authMiddleware, getMinhaEscalaVocalController)
router.put('/:id/status', authMiddleware, confirmarPresencaController)
router.post('/:id/falta', authMiddleware, autoriza('escala.gerenciar'), registrarFaltaVocalController)
router.delete('/:id', authMiddleware, autoriza('escala.gerenciar'), deleteEscalaVocalController)
export default router;