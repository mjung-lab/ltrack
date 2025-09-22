import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../app';

const prisma = new PrismaClient();

// 友だち追加予測
export const getFriendAdditionPrediction = async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;

    // 過去データの取得
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [clicks, friends] = await Promise.all([
      prisma.click.count({
        where: {
          timestamp: { gte: startDate },
          trackingCode: {
            account: { userId: req.user!.userId }
          }
        }
      }),
      prisma.friend.count({
        where: {
          addedAt: { gte: startDate },
          trackingCode: {
            account: { userId: req.user!.userId }
          }
        }
      })
    ]);

    // 日別データ取得
    const dailyData = await prisma.$queryRaw`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as clicks
      FROM Click c
      INNER JOIN TrackingCode tc ON c.trackingCodeId = tc.id
      INNER JOIN Account a ON tc.accountId = a.id
      WHERE a.userId = ${req.user!.userId}
        AND c.timestamp >= ${startDate}
      GROUP BY DATE(timestamp)
      ORDER BY date
    ` as any[];

    const dailyFriends = await prisma.$queryRaw`
      SELECT
        DATE(addedAt) as date,
        COUNT(*) as friends
      FROM Friend f
      INNER JOIN TrackingCode tc ON f.trackingCodeId = tc.id
      INNER JOIN Account a ON tc.accountId = a.id
      WHERE a.userId = ${req.user!.userId}
        AND f.addedAt >= ${startDate}
      GROUP BY DATE(addedAt)
      ORDER BY date
    ` as any[];

    // 簡単な線形予測（実際のAIではより高度なアルゴリズムを使用）
    const avgDailyClicks = clicks / 30;
    const avgDailyFriends = friends / 30;
    const conversionRate = clicks > 0 ? (friends / clicks) * 100 : 0;

    // 成長トレンド計算
    const recentWeekData = dailyData.slice(-7);
    const previousWeekData = dailyData.slice(-14, -7);

    const recentAvg = recentWeekData.reduce((sum, day) => sum + Number(day.clicks), 0) / 7;
    const previousAvg = previousWeekData.reduce((sum, day) => sum + Number(day.clicks), 0) / 7;

    const growthRate = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    // 予測計算
    const predicted30Days = Math.round(avgDailyClicks * 30 * (1 + growthRate / 100));
    const predictedFriends30Days = Math.round(predicted30Days * (conversionRate / 100));

    res.json({
      period,
      current: {
        totalClicks: clicks,
        totalFriends: friends,
        conversionRate: conversionRate.toFixed(2),
        avgDailyClicks: avgDailyClicks.toFixed(1),
        avgDailyFriends: avgDailyFriends.toFixed(1)
      },
      trend: {
        growthRate: growthRate.toFixed(2),
        direction: growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable'
      },
      prediction: {
        next30Days: {
          estimatedClicks: predicted30Days,
          estimatedFriends: predictedFriends30Days,
          confidence: Math.min(85, Math.max(60, 100 - Math.abs(growthRate * 2)))
        }
      },
      recommendations: generateRecommendations(conversionRate, growthRate),
      chartData: {
        daily: dailyData,
        dailyFriends: dailyFriends
      }
    });
  } catch (error) {
    logger.error('Get friend addition prediction error:', error);
    res.status(500).json({
      error: 'Failed to generate prediction',
      code: 'PREDICTION_ERROR'
    });
  }
};

// ROI予測
export const getROIPrediction = async (req: Request, res: Response) => {
  try {
    const { investmentAmount = 100000, period = '30d' } = req.query;

    // 現在のパフォーマンスデータ取得
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [clicks, friends, conversions] = await Promise.all([
      prisma.click.count({
        where: {
          timestamp: { gte: startDate },
          trackingCode: {
            account: { userId: req.user!.userId }
          }
        }
      }),
      prisma.friend.count({
        where: {
          addedAt: { gte: startDate },
          trackingCode: {
            account: { userId: req.user!.userId }
          }
        }
      }),
      prisma.conversion.count({
        where: {
          timestamp: { gte: startDate },
          friend: {
            trackingCode: {
              account: { userId: req.user!.userId }
            }
          }
        }
      })
    ]);

    // ROI計算（仮定値）
    const avgCPA = clicks > 0 ? Number(investmentAmount) / friends : 0;
    const customerLifetimeValue = 5000; // 仮定値
    const currentROI = friends > 0 ? ((friends * customerLifetimeValue) / Number(investmentAmount) - 1) * 100 : 0;

    // 最適化後の予測
    const optimizedConversionRate = Math.min((friends / clicks) * 1.3, 0.15); // 30%改善を仮定
    const predictedFriends = Math.round(clicks * optimizedConversionRate);
    const predictedROI = ((predictedFriends * customerLifetimeValue) / Number(investmentAmount) - 1) * 100;

    res.json({
      investment: Number(investmentAmount),
      period,
      current: {
        clicks,
        friends,
        conversions,
        cpa: avgCPA.toFixed(0),
        roi: currentROI.toFixed(1)
      },
      optimized: {
        estimatedFriends: predictedFriends,
        projectedCPA: (Number(investmentAmount) / predictedFriends).toFixed(0),
        projectedROI: predictedROI.toFixed(1),
        improvement: (predictedROI - currentROI).toFixed(1)
      },
      breakdown: {
        costPerClick: clicks > 0 ? (Number(investmentAmount) / clicks).toFixed(0) : '0',
        costPerFriend: avgCPA.toFixed(0),
        lifetimeValue: customerLifetimeValue,
        paybackPeriod: avgCPA > 0 ? Math.ceil(avgCPA / (customerLifetimeValue / 12)) : 0
      },
      recommendations: generateROIRecommendations(currentROI, avgCPA)
    });
  } catch (error) {
    logger.error('Get ROI prediction error:', error);
    res.status(500).json({
      error: 'Failed to generate ROI prediction',
      code: 'ROI_PREDICTION_ERROR'
    });
  }
};

// セグメント分析（RFM分析）
export const getSegmentAnalysis = async (req: Request, res: Response) => {
  try {
    // 友だち追加データの分析
    const friends = await prisma.friend.findMany({
      where: {
        trackingCode: {
          account: { userId: req.user!.userId }
        }
      },
      include: {
        conversions: true,
        trackingCode: {
          select: { name: true, code: true }
        }
      }
    });

    // RFM分析の計算
    const now = new Date();
    const segments = friends.map(friend => {
      const daysSinceAdded = Math.floor((now.getTime() - new Date(friend.addedAt).getTime()) / (1000 * 60 * 60 * 24));
      const frequency = friend.conversions.length;
      const monetaryValue = friend.conversions.reduce((sum, conv) => sum + (conv.value || 0), 0);

      return {
        friendId: friend.id,
        recency: daysSinceAdded,
        frequency,
        monetary: monetaryValue,
        trackingCode: friend.trackingCode.name
      };
    });

    // セグメント分類
    const segmentResults = segments.map(segment => {
      let category = 'New Customer';

      if (segment.recency <= 7 && segment.frequency >= 2) {
        category = 'Champion';
      } else if (segment.recency <= 30 && segment.frequency >= 1) {
        category = 'Loyal Customer';
      } else if (segment.recency > 30 && segment.frequency === 0) {
        category = 'At Risk';
      } else if (segment.recency > 60) {
        category = 'Lost Customer';
      }

      return { ...segment, category };
    });

    // カテゴリ別集計
    const segmentSummary = segmentResults.reduce((acc, segment) => {
      acc[segment.category] = (acc[segment.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalFriends: friends.length,
      segments: segmentSummary,
      details: segmentResults.slice(0, 50), // 上位50件
      insights: generateSegmentInsights(segmentSummary),
      recommendations: generateSegmentRecommendations(segmentSummary)
    });
  } catch (error) {
    logger.error('Get segment analysis error:', error);
    res.status(500).json({
      error: 'Failed to generate segment analysis',
      code: 'SEGMENT_ANALYSIS_ERROR'
    });
  }
};

// チャーン予測
export const getChurnPrediction = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 最近の活動データ
    const recentFriends = await prisma.friend.count({
      where: {
        addedAt: { gte: thirtyDaysAgo },
        trackingCode: {
          account: { userId: req.user!.userId }
        }
      }
    });

    const previousFriends = await prisma.friend.count({
      where: {
        addedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        trackingCode: {
          account: { userId: req.user!.userId }
        }
      }
    });

    // チャーン率計算（簡易版）
    const churnRate = previousFriends > 0 ?
      Math.max(0, (previousFriends - recentFriends) / previousFriends) * 100 : 0;

    // リスクセグメント特定
    const friends = await prisma.friend.findMany({
      where: {
        trackingCode: {
          account: { userId: req.user!.userId }
        }
      },
      include: {
        conversions: true
      }
    });

    const riskAnalysis = friends.map(friend => {
      const daysSinceAdded = Math.floor((now.getTime() - new Date(friend.addedAt).getTime()) / (1000 * 60 * 60 * 24));
      const conversions = friend.conversions.length;

      let riskLevel = 'Low';
      if (daysSinceAdded > 60 && conversions === 0) {
        riskLevel = 'High';
      } else if (daysSinceAdded > 30 && conversions <= 1) {
        riskLevel = 'Medium';
      }

      return {
        friendId: friend.id,
        daysSinceAdded,
        conversions,
        riskLevel
      };
    });

    const riskSummary = riskAnalysis.reduce((acc, friend) => {
      acc[friend.riskLevel] = (acc[friend.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      churnRate: churnRate.toFixed(2),
      trend: churnRate > 20 ? 'increasing' : churnRate > 10 ? 'stable' : 'decreasing',
      riskDistribution: riskSummary,
      highRiskFriends: riskAnalysis.filter(f => f.riskLevel === 'High').length,
      recommendations: generateChurnRecommendations(churnRate, riskSummary)
    });
  } catch (error) {
    logger.error('Get churn prediction error:', error);
    res.status(500).json({
      error: 'Failed to generate churn prediction',
      code: 'CHURN_PREDICTION_ERROR'
    });
  }
};

// レコメンデーション生成関数
function generateRecommendations(conversionRate: number, growthRate: number): string[] {
  const recommendations: string[] = [];

  if (conversionRate < 5) {
    recommendations.push('コンバージョン率が低いです。トラッキングコードの配置を見直しましょう');
    recommendations.push('LINEアカウントのプロフィール情報を魅力的に更新しましょう');
  }

  if (growthRate < 0) {
    recommendations.push('成長率が下降傾向です。新しいキャンペーンを検討しましょう');
    recommendations.push('A/Bテストで異なるアプローチを試してみましょう');
  }

  if (conversionRate > 10) {
    recommendations.push('良好なパフォーマンスです。このトラッキングコードを他のキャンペーンでも活用しましょう');
  }

  return recommendations;
}

function generateROIRecommendations(roi: number, cpa: number): string[] {
  const recommendations: string[] = [];

  if (roi < 100) {
    recommendations.push('ROIが低いため、ターゲティングの見直しを推奨します');
    recommendations.push('コンテンツの質を向上させて友だち追加率を上げましょう');
  }

  if (cpa > 1000) {
    recommendations.push('獲得単価が高いです。広告配信設定を最適化しましょう');
  }

  return recommendations;
}

function generateSegmentInsights(segments: Record<string, number>): string[] {
  const insights: string[] = [];
  const total = Object.values(segments).reduce((sum, count) => sum + count, 0);

  Object.entries(segments).forEach(([category, count]) => {
    const percentage = ((count / total) * 100).toFixed(1);
    insights.push(`${category}: ${count}人 (${percentage}%)`);
  });

  return insights;
}

function generateSegmentRecommendations(segments: Record<string, number>): string[] {
  const recommendations: string[] = [];

  if (segments['At Risk'] > 0) {
    recommendations.push('リスクセグメントの顧客にリエンゲージメントキャンペーンを実施しましょう');
  }

  if (segments['Champion'] > 0) {
    recommendations.push('チャンピオン顧客に特別オファーやロイヤルティプログラムを提供しましょう');
  }

  return recommendations;
}

function generateChurnRecommendations(churnRate: number, riskSummary: Record<string, number>): string[] {
  const recommendations: string[] = [];

  if (churnRate > 20) {
    recommendations.push('チャーン率が高いです。顧客エンゲージメント戦略を見直しましょう');
    recommendations.push('定期的なコミュニケーションプランを作成しましょう');
  }

  if (riskSummary['High'] > 0) {
    recommendations.push('高リスク顧客に向けた特別なリテンション施策を実施しましょう');
  }

  return recommendations;
}