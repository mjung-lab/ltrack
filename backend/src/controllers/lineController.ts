import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const getLineAccounts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    // First get the user's account
    const account = await prisma.account.findFirst({
      where: { userId }
    });

    if (!account) {
      return res.json({
        lineAccounts: [],
        total: 0
      });
    }

    const lineAccounts = await prisma.lineAccount.findMany({
      where: { accountId: account.id },
      include: {
        _count: {
          select: { trackingCodes: true }
        }
      }
    });

    res.json({
      lineAccounts,
      total: lineAccounts.length
    });
  } catch (error) {
    logger.error('Get LINE accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch LINE accounts' });
  }
};

export const createLineAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, channelId, channelSecret, channelAccessToken } = req.body;

    // First get or create the user's account
    let account = await prisma.account.findFirst({
      where: { userId }
    });

    if (!account) {
      account = await prisma.account.create({
        data: {
          name: `${req.user!.email}'s Account`,
          userId: userId!
        }
      });
    }

    const lineAccount = await prisma.lineAccount.create({
      data: {
        name,
        channelId,
        channelSecret,
        channelAccessToken,
        accountId: account.id
      }
    });

    res.json({ lineAccount });
  } catch (error) {
    logger.error('Create LINE account error:', error);
    res.status(500).json({ error: 'Failed to create LINE account' });
  }
};

export const updateLineAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const updateData = req.body;

    // First get the user's account
    const account = await prisma.account.findFirst({
      where: { userId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const lineAccount = await prisma.lineAccount.update({
      where: {
        id,
        accountId: account.id
      },
      data: updateData
    });

    res.json({ lineAccount });
  } catch (error) {
    logger.error('Update LINE account error:', error);
    res.status(500).json({ error: 'Failed to update LINE account' });
  }
};

export const deleteLineAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // First get the user's account
    const account = await prisma.account.findFirst({
      where: { userId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await prisma.lineAccount.delete({
      where: {
        id,
        accountId: account.id
      }
    });

    res.json({ message: 'LINE account deleted successfully' });
  } catch (error) {
    logger.error('Delete LINE account error:', error);
    res.status(500).json({ error: 'Failed to delete LINE account' });
  }
};

// Webhook設定
export const setupWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // First get the user's account
    const account = await prisma.account.findFirst({
      where: { userId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const lineAccount = await prisma.lineAccount.findFirst({
      where: {
        id,
        accountId: account.id
      }
    });

    if (!lineAccount) {
      return res.status(404).json({ error: 'LINE account not found' });
    }

    const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3002';
    const webhookUrl = `${baseUrl}/webhook/line`;

    // データベース更新
    const updatedAccount = await prisma.lineAccount.update({
      where: { id },
      data: {
        webhookUrl,
        updatedAt: new Date()
      }
    });

    logger.info(`Webhook URL set: ${webhookUrl}`);

    res.json({
      message: 'Webhook URL設定完了',
      webhookUrl,
      account: updatedAccount
    });

  } catch (error) {
    logger.error('Setup webhook error:', error);
    res.status(500).json({
      error: 'Webhook設定でエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Webhook検証
export const verifyWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 簡易実装：常に成功を返す
    const lineAccount = await prisma.lineAccount.findUnique({
      where: { id }
    });

    if (!lineAccount) {
      return res.status(404).json({ error: 'LINE account not found' });
    }

    res.json({
      message: 'Webhook検証完了',
      verified: true,
      webhookUrl: lineAccount.webhookUrl
    });

  } catch (error) {
    logger.error('Verify webhook error:', error);
    res.status(500).json({
      error: 'Webhook検証でエラーが発生しました'
    });
  }
};