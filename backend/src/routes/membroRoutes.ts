import { Router } from 'express';
import { cadastrarUser, myProfile, getMemberById, updateMemberController, deactivateMemberController, updatePasswordController } from '../controllers/membroController';
import { loginUser } from '../controllers/membroController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizator } from '../middlewares/roleMiddleware';
import { listAllMembers } from '../controllers/membroController';

const router = Router();

router.post('/cadastro', authMiddleware, autorizator(['admin']),cadastrarUser);
router.post('/login', loginUser);
router.get('/me', authMiddleware, myProfile);
router.get('/', authMiddleware, autorizator(['admin']), listAllMembers);
router.get('/:id', authMiddleware, getMemberById)
router.put('/:id', authMiddleware, updateMemberController)
router.delete('/:id', authMiddleware, autorizator(['admin']), deactivateMemberController)
router.put('/:id/senha', authMiddleware, updatePasswordController)

export default router;
