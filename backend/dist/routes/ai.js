"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const aiController_1 = require("../controllers/aiController");
const router = (0, express_1.Router)();
exports.aiRouter = router;
// すべてのAIエンドポイントは認証必須
router.use(auth_1.authenticateToken);
// 友だち追加予測
router.get('/predictions/friends', aiController_1.getFriendAdditionPrediction);
// ROI予測
router.get('/predictions/roi', aiController_1.getROIPrediction);
// セグメント分析
router.get('/segments', aiController_1.getSegmentAnalysis);
// チャーン予測
router.get('/predictions/churn', aiController_1.getChurnPrediction);
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
