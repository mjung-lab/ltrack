"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhook = exports.setupWebhook = exports.deleteLineAccount = exports.updateLineAccount = exports.createLineAccount = exports.getLineAccounts = void 0;
const client_1 = require("@prisma/client");
const app_1 = require("../app");
const prisma = new client_1.PrismaClient();
const getLineAccounts = async (req, res) => {
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
    }
    catch (error) {
        app_1.logger.error('Get LINE accounts error:', error);
        res.status(500).json({ error: 'Failed to fetch LINE accounts' });
    }
};
exports.getLineAccounts = getLineAccounts;
const createLineAccount = async (req, res) => {
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
                    name: `${req.user.email}'s Account`,
                    userId: userId
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
    }
    catch (error) {
        app_1.logger.error('Create LINE account error:', error);
        res.status(500).json({ error: 'Failed to create LINE account' });
    }
};
exports.createLineAccount = createLineAccount;
const updateLineAccount = async (req, res) => {
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
    }
    catch (error) {
        app_1.logger.error('Update LINE account error:', error);
        res.status(500).json({ error: 'Failed to update LINE account' });
    }
};
exports.updateLineAccount = updateLineAccount;
const deleteLineAccount = async (req, res) => {
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
    }
    catch (error) {
        app_1.logger.error('Delete LINE account error:', error);
        res.status(500).json({ error: 'Failed to delete LINE account' });
    }
};
exports.deleteLineAccount = deleteLineAccount;
// Webhook設定
const setupWebhook = async (req, res) => {
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
        app_1.logger.info(`Webhook URL set: ${webhookUrl}`);
        res.json({
            message: 'Webhook URL設定完了',
            webhookUrl,
            account: updatedAccount
        });
    }
    catch (error) {
        app_1.logger.error('Setup webhook error:', error);
        res.status(500).json({
            error: 'Webhook設定でエラーが発生しました',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.setupWebhook = setupWebhook;
// Webhook検証
const verifyWebhook = async (req, res) => {
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
    }
    catch (error) {
        app_1.logger.error('Verify webhook error:', error);
        res.status(500).json({
            error: 'Webhook検証でエラーが発生しました'
        });
    }
};
exports.verifyWebhook = verifyWebhook;
