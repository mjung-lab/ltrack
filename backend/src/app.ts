import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { authRouter } from './routes/auth';
import { trackingRouter } from './routes/tracking';
import { lineRouter } from './routes/line';
import { webhookRouter } from './routes/webhook';
import { recordClick } from './controllers/trackingController';
import { logger } from './utils/logger';

const app = express();
const prisma = new PrismaClient();

// ミドルウェア
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'https://ltrack-frontend.onrender.com'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 1000 // リクエスト制限
});
app.use(limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// API ルート
app.use('/api/auth', authRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/line', lineRouter);
app.use('/webhook', webhookRouter);

// トラッキング用の短縮URL
app.get('/t/:code', recordClick);

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// エラーハンドリング
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;