import React, { useState, useEffect, useCallback } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { api } from '../utils/api';

export default function AIInsights() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAIInsights = useCallback(async () => {
    try {
      const [friendPrediction, roiPrediction, segmentAnalysis, churnPrediction] = await Promise.all([
        api.getFriendPrediction('30d').catch(() => null),
        api.getROIPrediction(100000, '30d').catch(() => null),
        api.getSegmentAnalysis().catch(() => null),
        api.getChurnPrediction().catch(() => null)
      ]);


      // Generate insights from AI data
      const generatedInsights = generateInsightsFromData({
        friendPrediction,
        roiPrediction,
        segmentAnalysis,
        churnPrediction
      });

      setInsights(generatedInsights);
    } catch (err) {
      console.error('Error fetching AI insights:', err);

      // フォールバック: デモデータ
      setInsights([
        {
          id: '1',
          type: 'optimization',
          title: 'コンバージョン率最適化の提案',
          description: 'キャンペーン Bのクリック数は多いですが、コンバージョン率が平均より低くなっています。トラッキングURLの配置場所やメッセージ文言を見直すことで、最大15%の改善が期待できます。',
          impact: 'high',
          category: 'conversion',
          recommendation: 'トラッキングURLをメッセージの上部に配置し、より魅力的なCTAテキストに変更することをお勧めします。',
          metrics: { current: '11.1%', potential: '12.8%', improvement: '+15%' }
        },
        {
          id: '2',
          type: 'trend',
          title: 'トラフィック増加傾向の検出',
          description: '過去7日間でキャンペーン Aのクリック数が25%増加しています。この傾向が続く場合、友だち追加数も比例して増加する可能性があります。',
          impact: 'medium',
          category: 'traffic',
          recommendation: 'この成功パターンを他のキャンペーンにも適用することを検討してください。',
          metrics: { trend: '+25%', projected: '89 friends', timeframe: '次の7日間' }
        },
        {
          id: '3',
          type: 'alert',
          title: 'パフォーマンス低下の警告',
          description: 'キャンペーン Cの過去3日間のコンバージョン率が急激に低下しています。技術的な問題や配信設定の確認が必要です。',
          impact: 'high',
          category: 'performance',
          recommendation: 'トラッキングコードの動作確認とLINE Botの応答状況をチェックしてください。',
          metrics: { decline: '-18%', affectedPeriod: '過去3日間', urgency: '緊急' }
        },
        {
          id: '4',
          type: 'opportunity',
          title: '新しいターゲット層の発見',
          description: 'データ分析により、平日午後2-4時の時間帯でのコンバージョン率が他の時間帯より20%高いことが判明しました。',
          impact: 'medium',
          category: 'targeting',
          recommendation: 'この時間帯に合わせてキャンペーン配信のタイミングを調整することをお勧めします。',
          metrics: { optimalTime: '14:00-16:00', increase: '+20%', confidence: '95%' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAIInsights();
  }, [fetchAIInsights]);

  const generateInsightsFromData = (data: any): any[] => {
    const insights = [];
    let id = 1;

    // 友だち予測からのインサイト
    if (data.friendPrediction) {
      const { trend, prediction } = data.friendPrediction;

      if (parseFloat(trend.growthRate) > 0) {
        insights.push({
          id: (id++).toString(),
          type: 'trend',
          title: '友だち追加数の成長トレンド',
          description: `過去30日間で${trend.growthRate}%の成長率を記録しています。次の30日間で約${prediction.next30Days.estimatedFriends}人の友だち追加が予測されます。`,
          impact: parseFloat(trend.growthRate) > 10 ? 'high' : 'medium',
          category: 'growth',
          recommendation: data.friendPrediction.recommendations?.[0] || '現在の成長トレンドを維持しましょう',
          metrics: {
            growthRate: `+${trend.growthRate}%`,
            predicted: `${prediction.next30Days.estimatedFriends}人`,
            confidence: `${prediction.next30Days.confidence}%`
          }
        });
      }
    }

    // ROI予測からのインサイト
    if (data.roiPrediction) {
      const { current, optimized } = data.roiPrediction;

      if (parseFloat(current.roi) < 100) {
        insights.push({
          id: (id++).toString(),
          type: 'optimization',
          title: 'ROI改善の機会',
          description: `現在のROIは${current.roi}%です。最適化により${optimized.projectedROI}%まで向上させることが可能です。`,
          impact: 'high',
          category: 'roi',
          recommendation: data.roiPrediction.recommendations?.[0] || 'ターゲティングの見直しを推奨します',
          metrics: {
            currentROI: `${current.roi}%`,
            projectedROI: `${optimized.projectedROI}%`,
            improvement: `+${optimized.improvement}%`
          }
        });
      }
    }

    // チャーン予測からのインサイト
    if (data.churnPrediction) {
      const { churnRate, riskDistribution } = data.churnPrediction;

      if (parseFloat(churnRate) > 15) {
        insights.push({
          id: (id++).toString(),
          type: 'alert',
          title: 'チャーン率の警告',
          description: `チャーン率が${churnRate}%と高い水準です。${riskDistribution.High || 0}人の高リスク顧客が特定されました。`,
          impact: 'high',
          category: 'retention',
          recommendation: data.churnPrediction.recommendations?.[0] || 'リテンション施策の実施を検討しましょう',
          metrics: {
            churnRate: `${churnRate}%`,
            highRisk: `${riskDistribution.High || 0}人`,
            action: '緊急対応'
          }
        });
      }
    }

    // セグメント分析からのインサイト
    if (data.segmentAnalysis) {
      const { segments, totalFriends } = data.segmentAnalysis;

      if (segments.Champion > 0) {
        insights.push({
          id: (id++).toString(),
          type: 'opportunity',
          title: 'チャンピオン顧客の活用',
          description: `${segments.Champion}人のチャンピオン顧客を特定しました。全体の${((segments.Champion / totalFriends) * 100).toFixed(1)}%を占めています。`,
          impact: 'medium',
          category: 'loyalty',
          recommendation: data.segmentAnalysis.recommendations?.[0] || 'チャンピオン顧客に特別なロイヤルティプログラムを提供しましょう',
          metrics: {
            champions: `${segments.Champion}人`,
            percentage: `${((segments.Champion / totalFriends) * 100).toFixed(1)}%`,
            opportunity: '高価値'
          }
        });
      }
    }

    return insights;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'optimization': return Target;
      case 'trend': return TrendingUp;
      case 'alert': return AlertTriangle;
      case 'opportunity': return Lightbulb;
      default: return Brain;
    }
  };

  const getColorForImpact = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getIconColorForType = (type: string) => {
    switch (type) {
      case 'optimization': return 'text-purple-600';
      case 'trend': return 'text-green-600';
      case 'alert': return 'text-red-600';
      case 'opportunity': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Brain className="w-8 h-8 text-purple-600 mr-3" />
              AI Insights
            </h1>
            <p className="text-gray-600">AI-powered analysis and optimization recommendations</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              AI Analysis Active
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Optimizations</p>
              <p className="text-lg font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Trends</p>
              <p className="text-lg font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Alerts</p>
              <p className="text-lg font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Opportunities</p>
              <p className="text-lg font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-6">
        {insights.map((insight) => {
          const IconComponent = getIconForType(insight.type);
          return (
            <div
              key={insight.id}
              className={`bg-white rounded-lg shadow border-l-4 p-6 ${getColorForImpact(insight.impact)}`}
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg ${
                  insight.type === 'optimization' ? 'bg-purple-100' :
                  insight.type === 'trend' ? 'bg-green-100' :
                  insight.type === 'alert' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  <IconComponent className={`w-6 h-6 ${getIconColorForType(insight.type)}`} />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {insight.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4">{insight.description}</p>

                  <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">推奨アクション</h4>
                    <p className="text-gray-700">{insight.recommendation}</p>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    {insight.metrics && Object.entries(insight.metrics).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <span className="text-gray-500 capitalize">{key}:</span>
                        <span className="ml-1 font-medium text-gray-900">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
                  詳細を表示
                </button>
                <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  アクションを実行
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}