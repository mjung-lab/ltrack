import { Router } from 'express';
import {
  createLineAccount,
  getLineAccounts,
  updateLineAccount,
  deleteLineAccount,
  setupWebhook,
  verifyWebhook
} from '../controllers/lineController';
import { authenticateToken } from '../middleware/auth';
import { validate, lineAccountSchema } from '../utils/validation';

const router = Router();

// 全てのルートで認証必須
router.use(authenticateToken);

// LINE アカウント管理
router.post('/', validate(lineAccountSchema), createLineAccount);
router.get('/', getLineAccounts);
router.put('/:id', updateLineAccount);
router.delete('/:id', deleteLineAccount);

// Webhook管理
router.post('/:id/setup-webhook', authenticateToken, setupWebhook);
router.post('/:id/verify-webhook', authenticateToken, verifyWebhook);

// システム情報
router.get('/info', (req, res) => {
  res.json({
    service: 'L-TRACK® LINE Account Management',
    version: '1.0.0',
    endpoints: {
      create: 'POST /api/line',
      list: 'GET /api/line',
      details: 'GET /api/line/:id',
      update: 'PUT /api/line/:id',
      delete: 'DELETE /api/line/:id'
    },
    features: [
      'LINE Bot account management',
      'Channel configuration',
      'Webhook setup',
      'Tracking code integration'
    ]
  });
});

export { router as lineRouter };