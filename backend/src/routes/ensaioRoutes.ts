import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import {
    createEnsaioController,
    getEnsaioDoCultoController,
    updateEnsaioController,
    deleteEnsaioController,
    addParticipanteController,
    removeParticipanteController,
    confirmarPresencaEnsaioController,
    registrarFaltaEnsaioController,
} from '../controllers/ensaioController';

const router = Router();

router.post('/', authMiddleware, autoriza('ensaio.gerenciar'), createEnsaioController)
router.get('/culto/:cultoId', authMiddleware, getEnsaioDoCultoController)
router.put('/:id', authMiddleware, autoriza('ensaio.gerenciar'), updateEnsaioController)
router.delete('/:id', authMiddleware, autoriza('ensaio.gerenciar'), deleteEnsaioController)
router.post('/:id/participantes', authMiddleware, autoriza('ensaio.gerenciar'), addParticipanteController)
router.delete('/participantes/:id', authMiddleware, autoriza('ensaio.gerenciar'), removeParticipanteController)
router.put('/participantes/:id/status', authMiddleware, confirmarPresencaEnsaioController)
router.post('/participantes/:id/falta', authMiddleware, autoriza('ensaio.gerenciar'), registrarFaltaEnsaioController)

export default router;
