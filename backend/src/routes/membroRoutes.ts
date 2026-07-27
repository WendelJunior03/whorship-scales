import { Router } from 'express';
import { cadastrarUser, myProfile } from '../controllers/membroController';
import { loginUser } from '../controllers/membroController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/cadastro', cadastrarUser);
router.post('/login', loginUser);
router.get('/me', authMiddleware, myProfile)
export default router;
