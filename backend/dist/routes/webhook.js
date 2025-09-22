"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRouter = void 0;
const express_1 = require("express");
const app_1 = require("../app");
const router = (0, express_1.Router)();
exports.webhookRouter = router;
// シンプルなWebhookハンドラー
router.post('/line', async (req, res) => {
    try {
        console.log('Webhook received:', JSON.stringify(req.body, null, 2));
        const events = req.body.events || [];
        for (const event of events) {
            if (event.type === 'follow') {
                console.log('Friend addition detected:', event.source?.userId);
                // 友だち追加処理（後で実装）
            }
        }
        res.status(200).send('OK');
    }
    catch (error) {
        app_1.logger.error('Webhook error:', error);
        res.status(500).send('Error');
    }
});
// 基本的なヘルスチェック
router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
