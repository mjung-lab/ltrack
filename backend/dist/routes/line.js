"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineRouter = void 0;
const express_1 = require("express");
const lineController_1 = require("../controllers/lineController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
exports.lineRouter = router;
// 全てのルートで認証必須
router.use(auth_1.authenticateToken);
// LINE アカウント管理
router.post('/', (0, validation_1.validate)(validation_1.lineAccountSchema), lineController_1.createLineAccount);
router.get('/', lineController_1.getLineAccounts);
router.put('/:id', lineController_1.updateLineAccount);
router.delete('/:id', lineController_1.deleteLineAccount);
// Webhook管理
router.post('/:id/setup-webhook', auth_1.authenticateToken, lineController_1.setupWebhook);
router.post('/:id/verify-webhook', auth_1.authenticateToken, lineController_1.verifyWebhook);
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
