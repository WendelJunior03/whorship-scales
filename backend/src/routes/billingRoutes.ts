import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import {
    statusController,
    checkoutController,
    portalController,
} from '../controllers/billingController';

const router = Router();

// Billing é gestão do dono da org — mesma capacidade das antigas assinaturas/vagas.
// (O webhook NÃO passa por aqui: é montado com express.raw no app.ts, sem auth.)
router.get('/', authMiddleware, autoriza('assinatura.gerenciar'), statusController);
router.post('/checkout', authMiddleware, autoriza('assinatura.gerenciar'), checkoutController);
router.post('/portal', authMiddleware, autoriza('assinatura.gerenciar'), portalController);

export default router;
