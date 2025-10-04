import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, TrendingUp, Users, MousePointer, Target } from 'lucide-react';
import { api } from '../utils/api';

export default function Analytics() {
  const [period, setPeriod] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics(period);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
      // デモデータ
      setAnalyticsData({
        period: period,
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        summary: { totalClicks: 1234, totalFriends: 156, conversionRate: '12.6%' },
        trackingCodes: [
          { id: '1', name: 'キャンペーン A', code: 'CAMP_A', clicks: 450, friends: 67, conversionRate: '14.9%' },
          { id: '2', name: 'キャンペーン B', code: 'CAMP_B', clicks: 380, friends: 42, conversionRate: '11.1%' },
          { id: '3', name: 'キャンペーン C', code: 'CAMP_C', clicks: 404, friends: 47, conversionRate: '11.6%' }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Track your LINE Bot performance and conversion metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Calendar className="w-4 h-4 mr-2" />
              Custom Range
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          {error} - Showing demo data
        </div>
      )}

      {analyticsData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MousePointer className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.totalClicks.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">New Friends</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.totalFriends.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.conversionRate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Code Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Tracking Code Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Friends
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.trackingCodes.map((code: any, index: number) => (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{code.name}</div>
                          <div className="text-sm text-gray-500">{code.code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {code.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {code.friends.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          parseFloat(code.conversionRate) > 12
                            ? 'bg-green-100 text-green-800'
                            : parseFloat(code.conversionRate) > 10
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {code.conversionRate}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TrendingUp className={`w-4 h-4 mr-2 ${
                            index === 0 ? 'text-green-500' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm ${
                            index === 0 ? 'text-green-600 font-medium' : 'text-gray-500'
                          }`}>
                            {index === 0 ? 'Top Performer' : 'Normal'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}