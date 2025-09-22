"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackingSession = exports.getDashboardStats = exports.deleteTrackingCode = exports.updateTrackingCode = exports.getAnalytics = exports.recordClick = exports.getTrackingCodeDetails = exports.getTrackingCodes = exports.createTrackingCode = void 0;
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const app_1 = require("../app");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
// セッション管理用の一時的なマップ（Redis使用推奨）
const clickSessions = new Map();
// トラッキングコード生成
const createTrackingCode = async (req, res) => {
    try {
        const { name, description, lineAccountId } = req.body;
        // バリデーション
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                error: 'Name is required and must be a non-empty string',
                code: 'VALIDATION_ERROR'
            });
        }
        if (!lineAccountId || typeof lineAccountId !== 'string') {
            return res.status(400).json({
                error: 'LINE Account ID is required',
                code: 'VALIDATION_ERROR'
            });
        }
        // まず、ユーザーのアカウントを取得または作成
        let account = await prisma.account.findFirst({
            where: { userId: req.user.userId }
        });
        if (!account) {
            // アカウントが存在しない場合は作成
            account = await prisma.account.create({
                data: {
                    name: `${req.user.email}'s Account`,
                    userId: req.user.userId
                }
            });
        }
        // LINE アカウント存在確認
        const lineAccount = await prisma.lineAccount.findFirst({
            where: {
                id: lineAccountId,
                accountId: account.id
            }
        });
        if (!lineAccount) {
            return res.status(404).json({
                error: 'LINE account not found',
                code: 'LINE_ACCOUNT_NOT_FOUND'
            });
        }
        // ユニークなトラッキングコード生成
        const code = `ltk_${(0, uuid_1.v4)().replace(/-/g, '').substring(0, 12)}`;
        const trackingCode = await prisma.trackingCode.create({
            data: {
                name,
                description,
                code,
                accountId: account.id,
                lineAccountId,
                isActive: true
            },
            include: {
                lineAccount: {
                    select: { name: true, channelId: true }
                }
            }
        });
        app_1.logger.info(`Tracking code created: ${code}`, {
            userId: req.user.userId,
            trackingCodeId: trackingCode.id
        });
        res.status(201).json({
            message: 'Tracking code created successfully',
            trackingCode: {
                ...trackingCode,
                trackingUrl: `${process.env.BASE_URL}/t/${code}`,
                qrCodeUrl: `${process.env.BASE_URL}/api/tracking/qr/${code}`
            }
        });
    }
    catch (error) {
        app_1.logger.error('Create tracking code error:', error);
        res.status(500).json({
            error: 'Failed to create tracking code',
            code: 'CREATE_TRACKING_CODE_ERROR'
        });
    }
};
exports.createTrackingCode = createTrackingCode;
// トラッキングコード一覧取得
const getTrackingCodes = async (req, res) => {
    try {
        const account = await prisma.account.findFirst({
            where: { userId: req.user.userId }
        });
        if (!account) {
            return res.json({
                trackingCodes: [],
                total: 0
            });
        }
        const trackingCodes = await prisma.trackingCode.findMany({
            where: {
                accountId: account.id
            },
            include: {
                lineAccount: {
                    select: { name: true, channelId: true }
                },
                _count: {
                    select: {
                        clicks: true,
                        friends: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const enrichedTrackingCodes = trackingCodes.map(tc => ({
            ...tc,
            clicks: tc._count.clicks,
            conversions: tc._count.friends,
            trackingUrl: `${process.env.BASE_URL}/t/${tc.code}`,
            qrCodeUrl: `${process.env.BASE_URL}/api/tracking/qr/${tc.code}`,
            stats: {
                totalClicks: tc._count.clicks,
                totalFriends: tc._count.friends,
                conversionRate: tc._count.clicks > 0
                    ? ((tc._count.friends / tc._count.clicks) * 100).toFixed(2)
                    : '0.00'
            }
        }));
        res.json({
            trackingCodes: enrichedTrackingCodes,
            total: trackingCodes.length
        });
    }
    catch (error) {
        app_1.logger.error('Get tracking codes error:', error);
        res.status(500).json({
            error: 'Failed to fetch tracking codes',
            code: 'FETCH_TRACKING_CODES_ERROR'
        });
    }
};
exports.getTrackingCodes = getTrackingCodes;
// トラッキングコード詳細取得
const getTrackingCodeDetails = async (req, res) => {
    try {
        const { code } = req.params;
        const account = await prisma.account.findFirst({
            where: { userId: req.user.userId }
        });
        if (!account) {
            return res.status(404).json({
                error: 'Account not found',
                code: 'ACCOUNT_NOT_FOUND'
            });
        }
        const trackingCode = await prisma.trackingCode.findFirst({
            where: {
                code,
                accountId: account.id
            },
            include: {
                lineAccount: true,
                clicks: {
                    orderBy: { timestamp: 'desc' },
                    take: 100
                },
                friends: {
                    orderBy: { addedAt: 'desc' },
                    take: 50
                }
            }
        });
        if (!trackingCode) {
            return res.status(404).json({
                error: 'Tracking code not found',
                code: 'TRACKING_CODE_NOT_FOUND'
            });
        }
        // 統計計算
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const stats = {
            total: {
                clicks: trackingCode.clicks.length,
                friends: trackingCode.friends.length
            },
            last24h: {
                clicks: trackingCode.clicks.filter(c => c.timestamp >= last24h).length,
                friends: trackingCode.friends.filter(f => f.addedAt >= last24h).length
            },
            last7days: {
                clicks: trackingCode.clicks.filter(c => c.timestamp >= last7days).length,
                friends: trackingCode.friends.filter(f => f.addedAt >= last7days).length
            }
        };
        res.json({
            trackingCode: {
                ...trackingCode,
                trackingUrl: `${process.env.BASE_URL}/t/${code}`,
                qrCodeUrl: `${process.env.BASE_URL}/api/tracking/qr/${code}`
            },
            stats
        });
    }
    catch (error) {
        app_1.logger.error('Get tracking code details error:', error);
        res.status(500).json({
            error: 'Failed to fetch tracking code details',
            code: 'FETCH_TRACKING_CODE_DETAILS_ERROR'
        });
    }
};
exports.getTrackingCodeDetails = getTrackingCodeDetails;
// クリック記録 (公開エンドポイント)
const recordClick = async (req, res) => {
    try {
        const { code } = req.params;
        const trackingCode = await prisma.trackingCode.findFirst({
            where: { code, isActive: true },
            include: { lineAccount: true }
        });
        if (!trackingCode) {
            return res.redirect('https://line.me/');
        }
        // クリックを記録
        await prisma.click.create({
            data: {
                trackingCodeId: trackingCode.id,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                referer: req.get('Referer'),
                utmSource: req.query.utm_source,
                utmMedium: req.query.utm_medium,
                utmCampaign: req.query.utm_campaign,
                deviceType: 'unknown',
                browser: 'unknown',
                os: 'unknown',
                country: req.get('CF-IPCountry') || 'Unknown',
                city: 'Unknown'
            }
        });
        // セッション追跡用のパラメータを生成
        const sessionId = crypto_1.default.randomUUID();
        clickSessions.set(sessionId, {
            trackingCodeId: trackingCode.id,
            timestamp: Date.now()
        });
        // セッション情報をURLパラメータに追加
        const lineUrl = `https://line.me/R/ti/p/${trackingCode.lineAccount.channelId}?utm_source=ltrack&utm_medium=tracking&utm_campaign=${code}&session=${sessionId}`;
        app_1.logger.info(`Click recorded and redirecting: ${code} -> ${lineUrl}`);
        res.redirect(lineUrl);
    }
    catch (error) {
        app_1.logger.error('Record click error:', error);
        res.redirect('https://line.me/');
    }
};
exports.recordClick = recordClick;
// 分析データ取得
const getAnalytics = async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        let startDate;
        const now = new Date();
        switch (period) {
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
        const account = await prisma.account.findFirst({
            where: { userId: req.user.userId }
        });
        if (!account) {
            return res.json({
                period,
                dateRange: {
                    start: startDate.toISOString(),
                    end: now.toISOString()
                },
                summary: {
                    totalClicks: 0,
                    totalFriends: 0,
                    conversionRate: '0.00'
                },
                trackingCodes: []
            });
        }
        // 全体統計
        const totalStats = await prisma.$transaction([
            prisma.click.count({
                where: {
                    timestamp: { gte: startDate },
                    trackingCode: {
                        accountId: account.id
                    }
                }
            }),
            prisma.friend.count({
                where: {
                    addedAt: { gte: startDate },
                    trackingCode: {
                        accountId: account.id
                    }
                }
            })
        ]);
        const [totalClicks, totalFriends] = totalStats;
        // トラッキングコード別統計
        const trackingCodeStats = await prisma.trackingCode.findMany({
            where: {
                accountId: account.id
            },
            include: {
                _count: {
                    select: {
                        clicks: {
                            where: { timestamp: { gte: startDate } }
                        },
                        friends: {
                            where: { addedAt: { gte: startDate } }
                        }
                    }
                }
            }
        });
        res.json({
            period,
            dateRange: {
                start: startDate.toISOString(),
                end: now.toISOString()
            },
            summary: {
                totalClicks,
                totalFriends,
                conversionRate: totalClicks > 0 ? ((totalFriends / totalClicks) * 100).toFixed(2) : '0.00'
            },
            trackingCodes: trackingCodeStats.map(tc => ({
                id: tc.id,
                name: tc.name,
                code: tc.code,
                clicks: tc._count.clicks,
                friends: tc._count.friends,
                conversionRate: tc._count.clicks > 0
                    ? ((tc._count.friends / tc._count.clicks) * 100).toFixed(2)
                    : '0.00'
            }))
        });
    }
    catch (error) {
        app_1.logger.error('Get analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch analytics',
            code: 'FETCH_ANALYTICS_ERROR'
        });
    }
};
exports.getAnalytics = getAnalytics;
// トラッキングコード更新
const updateTrackingCode = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, lineAccountId } = req.body;
        const account = await prisma.account.findFirst({
            where: { userId: req.user.userId }
        });
        if (!account) {
            return res.status(404).json({
                error: 'Account not found',
                code: 'ACCOUNT_NOT_FOUND'
            });
        }
        const trackingCode = await prisma.trackingCode.findFirst({
            where: {
                id,
                accountId: account.id
            }
        });
        if (!trackingCode) {
            return res.status(404).json({
                error: 'Tracking code not found',
                code: 'TRACKING_CODE_NOT_FOUND'
            });
        }
        // LINE アカウント存在確認（提供された場合）
        if (lineAccountId) {
            const lineAccount = await prisma.lineAccount.findFirst({
                where: {
                    id: lineAccountId,
                    accountId: account.id
                }
            });
            if (!lineAccount) {
                return res.status(404).json({
                    error: 'LINE account not found',
                    code: 'LINE_ACCOUNT_NOT_FOUND'
                });
            }
        }
        const updatedTrackingCode = await prisma.trackingCode.update({
            where: { id },
            data: {
                name: name || trackingCode.name,
                description: description !== undefined ? description : trackingCode.description,
                lineAccountId: lineAccountId || trackingCode.lineAccountId
            },
            include: {
                lineAccount: {
                    select: { name: true, channelId: true }
                }
            }
        });
        app_1.logger.info(`Tracking code updated: ${id}`, {
            userId: req.user.userId
        });
        res.json({
            message: 'Tracking code updated successfully',
            trackingCode: {
                ...updatedTrackingCode,
                trackingUrl: `${process.env.BASE_URL}/t/${updatedTrackingCode.code}`,
                qrCodeUrl: `${process.env.BASE_URL}/api/tracking/qr/${updatedTrackingCode.code}`
            }
        });
    }
    catch (error) {
        app_1.logger.error('Update tracking code error:', error);
        res.status(500).json({
            error: 'Failed to update tracking code',
            code: 'UPDATE_TRACKING_CODE_ERROR'
        });
    }
};
exports.updateTrackingCode = updateTrackingCode;
// トラッキングコード削除
const deleteTrackingCode = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await prisma.account.findFirst({
            where: { userId: req.user.userId }
        });
        if (!account) {
            return res.status(404).json({
                error: 'Account not found',
                code: 'ACCOUNT_NOT_FOUND'
            });
        }
        const trackingCode = await prisma.trackingCode.findFirst({
            where: {
                id,
                accountId: account.id
            }
        });
        if (!trackingCode) {
            return res.status(404).json({
                error: 'Tracking code not found',
                code: 'TRACKING_CODE_NOT_FOUND'
            });
        }
        // 関連データも削除
        await prisma.$transaction([
            prisma.click.deleteMany({ where: { trackingCodeId: id } }),
            prisma.friend.deleteMany({ where: { trackingCodeId: id } }),
            prisma.trackingCode.delete({ where: { id } })
        ]);
        app_1.logger.info(`Tracking code deleted: ${id}`, {
            userId: req.user.userId
        });
        res.json({
            message: 'Tracking code deleted successfully'
        });
    }
    catch (error) {
        app_1.logger.error('Delete tracking code error:', error);
        res.status(500).json({
            error: 'Failed to delete tracking code',
            code: 'DELETE_TRACKING_CODE_ERROR'
        });
    }
};
exports.deleteTrackingCode = deleteTrackingCode;
const getDashboardStats = async (req, res) => {
    try {
        const account = await prisma.account.findFirst({
            where: { userId: req.user.userId }
        });
        if (!account) {
            return res.json({
                totalClicks: 0,
                friendsAdded: 0,
                conversionRate: 0,
                activeCodes: 0
            });
        }
        const [totalClicks, friendsAdded, activeCodes] = await Promise.all([
            prisma.click.count({
                where: {
                    trackingCode: { accountId: account.id }
                }
            }),
            prisma.friend.count({
                where: {
                    trackingCode: { accountId: account.id }
                }
            }),
            prisma.trackingCode.count({
                where: {
                    accountId: account.id,
                    isActive: true
                }
            })
        ]);
        const conversionRate = totalClicks > 0
            ? parseFloat(((friendsAdded / totalClicks) * 100).toFixed(2))
            : 0;
        res.json({
            totalClicks,
            friendsAdded,
            conversionRate,
            activeCodes
        });
    }
    catch (error) {
        app_1.logger.error('Get dashboard stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch dashboard statistics'
        });
    }
};
exports.getDashboardStats = getDashboardStats;
// セッション情報を取得する関数
const getTrackingSession = (sessionId) => {
    const session = clickSessions.get(sessionId);
    if (session && Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
        return session;
    }
    clickSessions.delete(sessionId);
    return null;
};
exports.getTrackingSession = getTrackingSession;
