"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
// Logger設定
exports.logger = {
    info: (message, data) => {
        console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    error: (message, error) => {
        console.error(`[ERROR] ${message}`, error);
    },
    warn: (message, data) => {
        console.warn(`[WARN] ${message}`, data);
    }
};
// ミドルウェア
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15分
    max: 1000 // リクエスト制限
});
app.use(limiter);
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ルート設定
const auth_1 = require("./routes/auth");
const tracking_1 = require("./routes/tracking");
const line_1 = require("./routes/line");
const webhook_1 = require("./routes/webhook");
// API ルート
app.use('/api/auth', auth_1.authRouter);
app.use('/api/tracking', tracking_1.trackingRouter);
app.use('/api/line', line_1.lineRouter);
app.use('/webhook', webhook_1.webhookRouter);
// トラッキング用の短縮URL
const trackingController_1 = require("./controllers/trackingController");
app.get('/t/:code', trackingController_1.recordClick);
// ヘルスチェック
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// エラーハンドリング
app.use((error, req, res, next) => {
    exports.logger.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    exports.logger.info(`Server running on port ${PORT}`);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    exports.logger.info('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    exports.logger.info('SIGINT received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});
exports.default = app;
