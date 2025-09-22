import { Router, Request, Response } from 'express';
import { logger } from '../app';

const router = Router();

// シンプルなWebhookハンドラー
router.post('/line', async (req: Request, res: Response) => {
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
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// 基本的なヘルスチェック
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export { router as webhookRouter };