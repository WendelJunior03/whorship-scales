import { Router } from 'express';
import { cadastrarUser } from '../controllers/membroController';
import { loginUser } from '../controllers/membroController';


const router = Router();

router.post('/cadastro', cadastrarUser);
router.post('/login', loginUser);

export default router;
