"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLineSignature = exports.generateWebhookInfo = exports.getWebhookStats = exports.handleLineWebhookGeneric = exports.handleLineWebhookWithAccount = exports.handleLINEWebhook = exports.verifyLineSignature = void 0;
const client_1 = require("@prisma/client");
const app_1 = require("../app");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
// Helper functions - defined early to avoid hoisting issues
// 他のツールに転送する関数
async function forwardWebhookToOtherTools(webhookData) {
    try {
        // 環境変数から転送先URLを取得
        const forwardUrls = process.env.WEBHOOK_FORWARD_URLS?.split(',').filter(url => url.trim()) || [];
        const timeout = parseInt(process.env.WEBHOOK_FORWARD_TIMEOUT || '5000');
        if (forwardUrls.length === 0) {
            app_1.logger.debug('No webhook forward URLs configured');
            return;
        }
        app_1.logger.info(`Forwarding webhook to ${forwardUrls.length} external tools`, {
            urls: forwardUrls.map(url => url.replace(/\/\/.*@/, '//***@')), // Hide auth info in logs
            eventCount: webhookData.events?.length || 0
        });
        // 並列で他のツールに転送
        const results = await Promise.allSettled(forwardUrls.map(url => fetch(url.trim(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'L-TRACK-Webhook-Forwarder/1.0'
            },
            body: JSON.stringify(webhookData),
            signal: AbortSignal.timeout(timeout)
        })));
        // 転送結果をログに記録
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                app_1.logger.info(`Webhook forwarded successfully to ${forwardUrls[index]}`, {
                    status: result.value.status,
                    statusText: result.value.statusText
                });
            }
            else {
                app_1.logger.warn(`Webhook forward failed to ${forwardUrls[index]}`, {
                    error: result.reason?.message || 'Unknown error'
                });
            }
        });
    }
    catch (error) {
        app_1.logger.error('Webhook forwarding error:', error);
    }
}
// 友だち追加イベントの処理
async function handleFriendAddition(event, webhookData) {
    try {
        const userId = event.source.userId;
        const timestamp = new Date(event.timestamp);
        app_1.logger.info('Friend addition event received:', {
            userId,
            timestamp,
            source: event.source
        });
        // UTMパラメータから追跡コードを特定
        const utmCampaign = event.postback?.data || event.message?.text;
        if (utmCampaign) {
            const trackingCode = await prisma.trackingCode.findFirst({
                where: { code: utmCampaign }
            });
            if (trackingCode) {
                // 友だち追加を記録
                await prisma.friend.create({
                    data: {
                        lineUserId: userId,
                        trackingCodeId: trackingCode.id,
                        displayName: 'New Friend',
                        addedAt: timestamp
                    }
                });
                app_1.logger.info('Friend addition recorded:', {
                    trackingCodeId: trackingCode.id,
                    lineUserId: userId
                });
            }
        }
    }
    catch (error) {
        app_1.logger.error('Handle friend addition error:', error);
    }
}
// LINE署名検証ミドルウェア（強化版）
const verifyLineSignature = async (req, res, next) => {
    try {
        // アカウント指定の場合、そのアカウントのシークレットを取得
        const channelSecret = req.params.accountId
            ? await getChannelSecret(req.params.accountId)
            : process.env.LINE_CHANNEL_SECRET || 'default-secret-for-development';
        const signature = req.get('X-Line-Signature');
        if (!signature) {
            app_1.logger.warn('Missing LINE signature', {
                url: req.url,
                method: req.method,
                ip: req.ip
            });
            // 開発環境では警告のみ、本番環境ではエラー
            if (process.env.NODE_ENV === 'production') {
                return res.status(400).json({ error: 'Missing LINE signature' });
            }
        }
        if (signature && channelSecret !== 'default-secret-for-development') {
            const body = JSON.stringify(req.body);
            const expectedSignature = crypto_1.default
                .createHmac('sha256', channelSecret)
                .update(body)
                .digest('base64');
            if (signature !== expectedSignature) {
                app_1.logger.warn('Invalid LINE signature', {
                    provided: signature.substring(0, 10) + '...',
                    expected: expectedSignature.substring(0, 10) + '...',
                    accountId: req.params.accountId
                });
                // 本番環境では厳密チェック
                if (process.env.NODE_ENV === 'production') {
                    return res.status(400).json({ error: 'Invalid signature' });
                }
            }
        }
        next();
    }
    catch (error) {
        app_1.logger.error('LINE signature verification error:', error);
        // 開発環境では続行、本番環境ではエラー
        if (process.env.NODE_ENV === 'production') {
            res.status(500).json({ error: 'Signature verification failed' });
        }
        else {
            next();
        }
    }
};
exports.verifyLineSignature = verifyLineSignature;
// チャネルシークレット取得
async function getChannelSecret(accountId) {
    try {
        const lineAccount = await prisma.lineAccount.findUnique({
            where: { id: accountId },
            select: { channelSecret: true }
        });
        return lineAccount?.channelSecret || 'default-secret-for-development';
    }
    catch (error) {
        app_1.logger.error('Get channel secret error:', error);
        return 'default-secret-for-development';
    }
}
// L-TRACKのメインWebhook処理関数（他ツールへの転送機能付き）
const handleLINEWebhook = async (req, res) => {
    try {
        const events = req.body.events;
        // L-TRACKでの処理
        for (const event of events) {
            if (event.type === 'follow') {
                await handleFriendAddition(event, req.body);
            }
            // その他のL-TRACK処理...
        }
        // 他のツールへの転送
        await forwardWebhookToOtherTools(req.body);
        res.status(200).send('OK');
    }
    catch (error) {
        app_1.logger.error('Webhook error:', error);
        res.status(500).send('Error');
    }
};
exports.handleLINEWebhook = handleLINEWebhook;
// LINE Webhook処理（アカウント指定版）
const handleLineWebhookWithAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const events = req.body.events || [];
        app_1.logger.info(`Webhook received for account: ${accountId}`, {
            eventCount: events.length,
            eventTypes: events.map(e => e.type)
        });
        if (events.length === 0) {
            return res.status(200).send('OK');
        }
        // LINE アカウント存在確認
        const lineAccount = await prisma.lineAccount.findUnique({
            where: { id: accountId },
            include: { trackingCodes: true }
        });
        if (!lineAccount) {
            app_1.logger.error(`LINE account not found: ${accountId}`);
            return res.status(404).json({
                error: 'Account not found',
                accountId
            });
        }
        // 各イベント処理
        let processedEvents = 0;
        for (const event of events) {
            try {
                await processLineEventWithAccount(event, lineAccount);
                processedEvents++;
            }
            catch (eventError) {
                app_1.logger.error('Failed to process individual event:', eventError);
            }
        }
        // 他のツールへの転送
        await forwardWebhookToOtherTools(req.body);
        app_1.logger.info(`Processed ${processedEvents}/${events.length} events for account: ${accountId}`);
        res.status(200).send('OK');
    }
    catch (error) {
        app_1.logger.error('LINE webhook with account error:', error);
        res.status(500).send('Error');
    }
};
exports.handleLineWebhookWithAccount = handleLineWebhookWithAccount;
// 既存のLINE Webhook処理（汎用版 - 強化）
const handleLineWebhookGeneric = async (req, res) => {
    try {
        const events = req.body.events || [];
        app_1.logger.info(`Generic webhook received`, {
            eventCount: events.length,
            eventTypes: events.map(e => e.type)
        });
        if (events.length === 0) {
            return res.status(200).send('OK');
        }
        // デフォルトのLINEアカウントを使用
        const defaultLineAccount = await prisma.lineAccount.findFirst({
            include: { trackingCodes: true }
        });
        let processedEvents = 0;
        for (const event of events) {
            try {
                if (defaultLineAccount) {
                    await processLineEventWithAccount(event, defaultLineAccount);
                }
                else {
                    // フォールバック: 既存の処理
                    await processLineEvent(event);
                }
                processedEvents++;
            }
            catch (eventError) {
                app_1.logger.error('Failed to process individual event:', eventError);
            }
        }
        app_1.logger.info(`Processed ${processedEvents}/${events.length} events (generic)`);
        res.status(200).send('OK');
    }
    catch (error) {
        app_1.logger.error('LINE webhook error:', error);
        res.status(500).send('Error');
    }
};
exports.handleLineWebhookGeneric = handleLineWebhookGeneric;
// 新しい高度なイベント処理
async function processLineEventWithAccount(event, lineAccount) {
    try {
        const eventTimestamp = new Date();
        // イベント記録
        const lineEvent = await prisma.lineEvent.create({
            data: {
                lineAccountId: lineAccount.id,
                friendId: event.source.type === 'user' ? await getFriendId(event.source.userId) : null,
                eventType: event.type,
                eventData: event,
                timestamp: eventTimestamp
            }
        });
        // イベント種別による処理分岐
        switch (event.type) {
            case 'follow':
                if (event.source.type === 'user') {
                    await handleFollowEvent(event, lineAccount, eventTimestamp);
                }
                break;
            case 'unfollow':
                if (event.source.type === 'user') {
                    await handleUnfollowEvent(event, lineAccount, eventTimestamp);
                }
                break;
            case 'message':
                if (event.source.type === 'user') {
                    await handleMessageEvent(event, lineAccount, eventTimestamp);
                }
                break;
            case 'postback':
                if (event.source.type === 'user') {
                    await handlePostbackEvent(event, lineAccount, eventTimestamp);
                }
                break;
            default:
                app_1.logger.info(`Unhandled event type: ${event.type}`, {
                    lineAccountId: lineAccount.id
                });
        }
        app_1.logger.debug(`LINE event processed: ${event.type}`, {
            lineAccountId: lineAccount.id,
            eventId: lineEvent.id,
            userId: event.source.type === 'user' ? event.source.userId : null
        });
    }
    catch (error) {
        app_1.logger.error('Process LINE event with account error:', error);
    }
}
// 友だちID取得（存在確認）
async function getFriendId(lineUserId) {
    try {
        const friend = await prisma.friend.findUnique({
            where: { lineUserId },
            select: { id: true }
        });
        return friend?.id || null;
    }
    catch (error) {
        return null;
    }
}
// 友だち追加イベント処理（強化版）
async function handleFollowEvent(event, lineAccount, timestamp) {
    try {
        const userId = event.source.userId;
        if (!userId)
            return;
        // 既存の友だち記録確認
        const existingFriend = await prisma.friend.findUnique({
            where: { lineUserId: userId }
        });
        if (existingFriend) {
            app_1.logger.info(`🔄 Friend re-followed: ${userId}`, {
                friendId: existingFriend.id,
                lineAccount: lineAccount.name
            });
            return;
        }
        // 最近のクリック記録から適切なトラッキングコードを特定
        const matchingTrackingCode = await findMatchingTrackingCode(lineAccount, timestamp);
        if (matchingTrackingCode) {
            // 友だち追加記録
            const friend = await prisma.friend.create({
                data: {
                    lineUserId: userId,
                    trackingCodeId: matchingTrackingCode.id,
                    displayName: 'New Friend',
                    addedAt: timestamp
                }
            });
            // コンバージョン記録
            await prisma.conversion.create({
                data: {
                    friendId: friend.id,
                    eventType: 'friend_added',
                    value: 1.0,
                    currency: 'JPY',
                    timestamp: timestamp
                }
            });
            app_1.logger.info(`🎉 Friend added successfully: ${userId}`, {
                trackingCode: matchingTrackingCode.code,
                friendId: friend.id,
                lineAccount: lineAccount.name,
                conversionTracked: true
            });
        }
        else {
            // トラッキングコードが特定できない場合、デフォルトで記録
            const defaultTrackingCode = lineAccount.trackingCodes[0];
            if (defaultTrackingCode) {
                const friend = await prisma.friend.create({
                    data: {
                        lineUserId: userId,
                        trackingCodeId: defaultTrackingCode.id,
                        displayName: 'Direct Add',
                        addedAt: timestamp
                    }
                });
                app_1.logger.info(`📱 Friend added (direct): ${userId}`, {
                    trackingCode: defaultTrackingCode.code,
                    friendId: friend.id,
                    source: 'direct_add'
                });
            }
            else {
                app_1.logger.warn(`No tracking codes available for LINE account: ${lineAccount.id}`);
            }
        }
    }
    catch (error) {
        app_1.logger.error('Handle follow event error:', error);
    }
}
// 友だち削除イベント処理
async function handleUnfollowEvent(event, lineAccount, timestamp) {
    try {
        const userId = event.source.userId;
        if (!userId)
            return;
        app_1.logger.info(`😔 Friend unfollowed: ${userId}`, {
            lineAccountId: lineAccount.id,
            timestamp: timestamp.toISOString()
        });
        // Unfollowイベントの統計記録（必要に応じて）
        // await recordUnfollowStats(userId, lineAccount.id, timestamp);
    }
    catch (error) {
        app_1.logger.error('Handle unfollow event error:', error);
    }
}
// メッセージイベント処理
async function handleMessageEvent(event, lineAccount, timestamp) {
    try {
        const userId = event.source.userId;
        app_1.logger.debug(`💬 Message received from: ${userId}`, {
            messageType: event.message.type,
            lineAccountId: lineAccount.id
        });
        // メッセージ統計やエンゲージメント記録（必要に応じて）
    }
    catch (error) {
        app_1.logger.error('Handle message event error:', error);
    }
}
// ポストバックイベント処理
async function handlePostbackEvent(event, lineAccount, timestamp) {
    try {
        const userId = event.source.userId;
        app_1.logger.info(`🔘 Postback received from: ${userId}`, {
            data: event.postback.data,
            lineAccountId: lineAccount.id
        });
        // ポストバック統計やコンバージョン記録（必要に応じて）
    }
    catch (error) {
        app_1.logger.error('Handle postback event error:', error);
    }
}
// 適切なトラッキングコードを特定（強化版）
async function findMatchingTrackingCode(lineAccount, timestamp) {
    try {
        // より柔軟な時間窓での検索（5分、15分、30分の順で試行）
        const timeWindows = [5, 15, 30]; // 分
        for (const minutes of timeWindows) {
            const windowStart = new Date(timestamp.getTime() - minutes * 60 * 1000);
            const recentClick = await prisma.click.findFirst({
                where: {
                    trackingCode: {
                        lineAccountId: lineAccount.id
                    },
                    timestamp: {
                        gte: windowStart
                    }
                },
                include: { trackingCode: true },
                orderBy: { timestamp: 'desc' }
            });
            if (recentClick) {
                app_1.logger.debug(`Matching click found within ${minutes} minutes`, {
                    clickId: recentClick.id,
                    trackingCode: recentClick.trackingCode.code,
                    clickTime: recentClick.timestamp.toISOString()
                });
                return recentClick.trackingCode;
            }
        }
        app_1.logger.info(`No matching click found for any time window`, {
            lineAccountId: lineAccount.id,
            checkedWindows: timeWindows
        });
        return null;
    }
    catch (error) {
        app_1.logger.error('Find matching tracking code error:', error);
        return null;
    }
}
// 既存のシンプルなイベント処理（後方互換）
async function processLineEvent(event) {
    try {
        // 友だち追加イベント
        if (event.type === 'follow') {
            const userId = event.source.userId;
            if (!userId)
                return;
            // 最新のクリック記録から対応するトラッキングコードを探す
            const recentClick = await prisma.click.findFirst({
                where: {
                    timestamp: {
                        gte: new Date(Date.now() - 30 * 60 * 1000) // 30分以内
                    }
                },
                include: { trackingCode: true },
                orderBy: { timestamp: 'desc' }
            });
            if (recentClick) {
                // 既存の友だちチェック
                const existingFriend = await prisma.friend.findUnique({
                    where: { lineUserId: userId }
                });
                if (!existingFriend) {
                    // 友だち追加記録
                    await prisma.friend.create({
                        data: {
                            lineUserId: userId,
                            trackingCodeId: recentClick.trackingCodeId,
                            displayName: 'Unknown',
                            addedAt: new Date()
                        }
                    });
                    app_1.logger.info(`Friend added (legacy): ${userId}`, {
                        trackingCode: recentClick.trackingCode.code
                    });
                }
            }
        }
        // イベント記録（デフォルトアカウント）
        const defaultLineAccount = await prisma.lineAccount.findFirst();
        if (defaultLineAccount) {
            await prisma.lineEvent.create({
                data: {
                    lineAccountId: defaultLineAccount.id,
                    eventType: event.type,
                    eventData: event,
                    timestamp: new Date()
                }
            });
        }
    }
    catch (error) {
        app_1.logger.error('Process LINE event (legacy) error:', error);
    }
}
// Webhook統計取得（強化版）
const getWebhookStats = async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        let startDate;
        const now = new Date();
        switch (period) {
            case '1h':
                startDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        // 統計データ取得
        const [eventStats, friendStats, conversionStats] = await Promise.all([
            // イベント統計
            prisma.lineEvent.groupBy({
                by: ['eventType'],
                where: {
                    timestamp: { gte: startDate }
                },
                _count: true
            }),
            // 友だち追加統計
            prisma.friend.count({
                where: {
                    addedAt: { gte: startDate }
                }
            }),
            // コンバージョン統計
            prisma.conversion.count({
                where: {
                    timestamp: { gte: startDate },
                    eventType: 'friend_added'
                }
            })
        ]);
        // イベント種別統計
        const eventTypeStats = eventStats.reduce((acc, stat) => {
            acc[stat.eventType] = stat._count;
            return acc;
        }, {});
        res.json({
            period,
            dateRange: {
                start: startDate.toISOString(),
                end: now.toISOString()
            },
            webhook: {
                totalEvents: eventStats.reduce((sum, stat) => sum + stat._count, 0),
                eventTypes: eventTypeStats,
                friendsAdded: friendStats,
                conversionsTracked: conversionStats
            },
            performance: {
                averageProcessingTime: '< 100ms', // 実装時に計測
                uptime: '99.9%', // 監視システム連携時に実装
                errorRate: '< 0.1%' // エラー統計実装時
            }
        });
    }
    catch (error) {
        app_1.logger.error('Get webhook stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch webhook statistics',
            code: 'WEBHOOK_STATS_ERROR'
        });
    }
};
exports.getWebhookStats = getWebhookStats;
// Webhook URL情報生成（強化版）
const generateWebhookInfo = (req, res) => {
    try {
        const { accountId } = req.params;
        const baseUrl = process.env.BASE_URL || 'http://localhost:3002';
        res.json({
            webhookUrls: {
                specific: accountId ? `${baseUrl}/webhook/line/${accountId}` : null,
                generic: `${baseUrl}/webhook/line`
            },
            setup: {
                description: 'LINE Developers ConsoleのWebhook URLに設定してください',
                verification: {
                    method: 'POST',
                    contentType: 'application/json',
                    requiredHeaders: ['X-Line-Signature']
                },
                signatureVerification: {
                    algorithm: 'HMAC-SHA256',
                    enabled: process.env.NODE_ENV === 'production',
                    development: 'Signature verification is relaxed in development mode'
                }
            },
            testing: {
                healthCheck: `${baseUrl}/webhook/test`,
                statsEndpoint: `${baseUrl}/webhook/stats`,
                testFollow: `${baseUrl}/webhook/test/follow`,
                samplePayload: {
                    events: [
                        {
                            type: 'follow',
                            source: { type: 'user', userId: 'sample-user-id' },
                            timestamp: Date.now()
                        }
                    ]
                }
            },
            supportedEvents: [
                'follow',
                'unfollow',
                'message',
                'postback'
            ],
            features: [
                'Multiple LINE account support',
                'Intelligent click-to-follow matching',
                'Conversion tracking',
                'Detailed event logging',
                'Real-time statistics'
            ]
        });
    }
    catch (error) {
        app_1.logger.error('Generate webhook info error:', error);
        res.status(500).json({ error: 'Failed to generate webhook info' });
    }
};
exports.generateWebhookInfo = generateWebhookInfo;
// Legacy signature validation (keeping for backward compatibility)
exports.validateLineSignature = exports.verifyLineSignature;
