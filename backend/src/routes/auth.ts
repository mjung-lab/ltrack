import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate, loginSchema, registerSchema } from '../utils/validation';

const router = Router();

// 公開ルート
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// 認証必須ルート
router.get('/profile', authenticateToken, getProfile);

// システム情報
router.get('/info', (req, res) => {
  res.json({
    service: 'L-TRACK® Authentication Service',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'GET /api/auth/profile'
    }
  });
});

export { router as authRouter };