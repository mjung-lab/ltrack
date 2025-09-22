"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const trackingController_1 = require("../controllers/trackingController");
const router = (0, express_1.Router)();
exports.trackingRouter = router;
// すべてのルートで認証が必要
router.use(auth_1.authenticateToken);
// トラッキングコード管理
router.get('/codes', trackingController_1.getTrackingCodes);
router.post('/codes', trackingController_1.createTrackingCode);
router.get('/codes/:code', trackingController_1.getTrackingCodeDetails);
router.put('/codes/:id', trackingController_1.updateTrackingCode);
router.delete('/codes/:id', trackingController_1.deleteTrackingCode);
// ダッシュボード統計
router.get('/dashboard/stats', trackingController_1.getDashboardStats);
// テスト用エンドポイント（簡略版）
router.get('/test', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            userId: req.user?.userId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Test failed' });
    }
});
