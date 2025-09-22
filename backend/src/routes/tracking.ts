import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getTrackingCodes,
  createTrackingCode,
  updateTrackingCode,
  deleteTrackingCode,
  getTrackingCodeDetails,
  getDashboardStats
} from '../controllers/trackingController';

const router = Router();

// すべてのルートで認証が必要
router.use(authenticateToken);

// トラッキングコード管理
router.get('/codes', getTrackingCodes);
router.post('/codes', createTrackingCode);
router.get('/codes/:code', getTrackingCodeDetails);
router.put('/codes/:id', updateTrackingCode);
router.delete('/codes/:id', deleteTrackingCode);

// ダッシュボード統計
router.get('/dashboard/stats', getDashboardStats);


// テスト用エンドポイント（簡略版）
router.get('/test', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      userId: req.user?.userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Test failed' });
  }
});

export { router as trackingRouter };