import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './Dashboard.css';

interface DashboardStats {
  totalClicks: number;
  friendsAdded: number;
  conversionRate: number;
  activeCodes: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClicks: 0,
    friendsAdded: 0,
    conversionRate: 0,
    activeCodes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await api.getDashboardStats();

      setStats({
        totalClicks: data.totalClicks || 0,
        friendsAdded: data.friendsAdded || 0,
        conversionRate: data.conversionRate || 0,
        activeCodes: data.activeCodes || 0
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);

      // デモ用のサンプルデータを設定
      setStats({
        totalClicks: 1234,
        friendsAdded: 156,
        conversionRate: 12.6,
        activeCodes: 8
      });

      setError('デモデータを表示しています（API接続に失敗）');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>データを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchDashboardStats} className="retry-button">
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>L-TRACK® ダッシュボード</h1>
        <p>LINE Bot マーケティング分析プラットフォーム</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon blue">📊</div>
            <div className="stat-info">
              <dt>総クリック数</dt>
              <dd>{stats.totalClicks.toLocaleString()}</dd>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon green">👥</div>
            <div className="stat-info">
              <dt>友だち追加数</dt>
              <dd>{stats.friendsAdded.toLocaleString()}</dd>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon purple">📈</div>
            <div className="stat-info">
              <dt>コンバージョン率</dt>
              <dd>{stats.conversionRate.toFixed(1)}%</dd>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon orange">🔗</div>
            <div className="stat-info">
              <dt>アクティブコード</dt>
              <dd>{stats.activeCodes}</dd>
            </div>
          </div>
        </div>
      </div>

      <div className="features">
        <div className="features-card">
          <h3>主な機能</h3>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon blue">🎯</div>
              <h4>高精度トラッキング</h4>
              <p>クリックから友だち追加まで完全追跡</p>
            </div>

            <div className="feature">
              <div className="feature-icon green">🤖</div>
              <h4>AI インサイト</h4>
              <p>データ分析による改善提案</p>
            </div>

            <div className="feature">
              <div className="feature-icon purple">⚡</div>
              <h4>リアルタイム</h4>
              <p>即座にデータを確認可能</p>
            </div>
          </div>
        </div>
      </div>

      <div className="actions">
        <button onClick={fetchDashboardStats} className="refresh-button">
          データを更新
        </button>
      </div>
    </div>
  );
};

export default Dashboard;