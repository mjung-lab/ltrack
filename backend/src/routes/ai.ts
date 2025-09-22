import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getFriendAdditionPrediction,
  getROIPrediction,
  getSegmentAnalysis,
  getChurnPrediction
} from '../controllers/aiController';

const router = Router();

// すべてのAIエンドポイントは認証必須
router.use(authenticateToken);

// 友だち追加予測
router.get('/predictions/friends', getFriendAdditionPrediction);

// ROI予測
router.get('/predictions/roi', getROIPrediction);

// セグメント分析
router.get('/segments', getSegmentAnalysis);

// チャーン予測
router.get('/predictions/churn', getChurnPrediction);

// AI概要
router.get('/overview', async (req, res) => {
  res.json({
    message: 'L-TRACK® AI Analysis Engine',
    version: '1.0.0',
    features: [
      'Friend Addition Prediction',
      'ROI Forecasting',
      'Customer Segmentation (RFM)',
      'Churn Risk Analysis'
    ],
    endpoints: {
      'Friend Prediction': 'GET /api/ai/predictions/friends',
      'ROI Prediction': 'GET /api/ai/predictions/roi',
      'Segmentation': 'GET /api/ai/segments',
      'Churn Analysis': 'GET /api/ai/predictions/churn'
    }
  });
});

export { router as aiRouter };