import { Router } from 'express';
import { login, logout, currentUser, changePassword } from '../controllers/authController.js';
import { requireAuthApi } from '../middleware/requireAuth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', currentUser);
router.post('/change-password', requireAuthApi, changePassword);

export default router;
