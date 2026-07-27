import { Router } from 'express';
import { cadastrarUser, myProfile } from '../controllers/membroController';
import { loginUser } from '../controllers/membroController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizator } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/cadastro', cadastrarUser);
router.post('/login', loginUser);
router.get('/me', authMiddleware, myProfile)
router.get('/admin-teste', authMiddleware, autorizator(['admin']), (req, res) => {
    res.status(200).json({ mensagem: 'Seja Bem-vindo(a) Administrador(a)!' })
})
export default router;
