import React, { useState, useEffect } from 'react';
import { Link2, Plus, Trash2, Copy, QrCode, ExternalLink } from 'lucide-react';
import { api } from '../utils/api';

interface TrackingCode {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  lineAccount: {
    id: string;
    name: string;
  };
  clicks: number;
  conversions: number;
  createdAt: string;
}

interface LineAccount {
  id: string;
  name: string;
}

export default function TrackingCodes() {
  const [trackingCodes, setTrackingCodes] = useState<TrackingCode[]>([]);
  const [lineAccounts, setLineAccounts] = useState<LineAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lineAccountId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [codesResponse, accountsResponse] = await Promise.all([
        api.getTrackingCodes(),
        api.getLineAccounts()
      ]);

      const codes = codesResponse?.trackingCodes || [];
      const accounts = accountsResponse?.lineAccounts || [];

      setTrackingCodes(codes);
      setLineAccounts(accounts);

    } catch (error: any) {
      console.error('データ読み込みエラー:', error);
      setError(`データの読み込みに失敗しました: ${error.message || '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('コード名を入力してください');
      return;
    }

    if (!formData.lineAccountId) {
      setError('LINEアカウントを選択してください');
      return;
    }

    if (formData.name.length < 2) {
      setError('コード名は2文字以上で入力してください');
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.createTrackingCode({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        lineAccountId: formData.lineAccountId
      });

      setSuccess('トラッキングコードを作成しました！');
      setShowModal(false);
      setFormData({ name: '', description: '', lineAccountId: '' });
      await loadData();

    } catch (error: any) {
      console.error('作成エラー:', error);
      let errorMessage = '作成に失敗しました';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`「${name}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      setError('');
      await api.deleteTrackingCode(id);
      setSuccess('トラッキングコードを削除しました');
      await loadData();

    } catch (error: any) {
      console.error('削除エラー:', error);
      setError(`削除に失敗しました: ${error.message || '不明なエラー'}`);
    }
  };

  const getTrackingUrl = (code: string) => {
    // ローカル環境では直接バックエンドを指定
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://localhost:3002/t/${code}`;
    }
    // 本番環境では同一ドメインを使用
    return `${window.location.protocol}//${window.location.host}/t/${code}`;
  };

  const copyTrackingUrl = (code: string) => {
    const url = getTrackingUrl(code);
    navigator.clipboard.writeText(url);
    setSuccess(`URLをコピーしました: ${url}`);
    setTimeout(() => setSuccess(''), 5000);
  };

  const openTrackingUrl = (code: string) => {
    const url = getTrackingUrl(code);
    window.open(url, '_blank');
  };

  const openModal = () => {
    setError('');
    setSuccess('');
    setFormData({ name: '', description: '', lineAccountId: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">追跡コード管理</h1>
            <p className="page-subtitle">読み込み中...</p>
          </div>
        </div>
        <div className="page-content">
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">追跡コード管理</h1>
          <p className="page-subtitle">LINEへの追加を追跡するためのコードを管理</p>
        </div>
        <button onClick={openModal} className="btn btn-primary">
          <Plus size={16} className="btn-icon" />
          新しいコード
        </button>
      </div>

      <div className="page-content">
        {/* エラーメッセージ */}
        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            <strong>エラー:</strong> {error}
          </div>
        )}

        {/* 成功メッセージ */}
        {success && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '12px 16px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #c3e6cb'
          }}>
            <strong>成功:</strong> {success}
          </div>
        )}

        {/* LINEアカウントが存在しない場合の警告 */}
        {lineAccounts.length === 0 && (
          <div style={{
            background: '#fff3cd',
            color: '#856404',
            padding: '12px 16px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}>
            <strong>注意:</strong> まずLINEアカウントを追加してください。
            <a href="/line-accounts" style={{ color: '#856404', marginLeft: '8px' }}>
              LINEアカウント管理へ →
            </a>
          </div>
        )}

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '200px' }}>コード名</th>
                <th style={{ width: '150px' }}>LINEアカウント</th>
                <th style={{ width: '350px' }}>トラッキングURL</th>
                <th style={{ width: '100px' }}>統計</th>
                <th style={{ width: '80px' }}>状態</th>
                <th style={{ width: '100px' }}>作成日</th>
                <th style={{ width: '120px' }}>アクション</th>
              </tr>
            </thead>
            <tbody>
              {trackingCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <Link2 size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', color: '#666' }}>追跡コードがありません</h3>
                      <p style={{ margin: '0 0 20px 0', color: '#888' }}>
                        最初のトラッキングコードを作成してください
                      </p>
                      <button
                        onClick={openModal}
                        className="btn btn-primary"
                        disabled={lineAccounts.length === 0}
                      >
                        <Plus size={16} className="btn-icon" />
                        最初のコードを作成
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                trackingCodes.map((code) => {
                  const trackingUrl = getTrackingUrl(code.code);
                  return (
                    <tr key={code.id}>
                      <td>
                        <div>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>
                            {code.name}
                          </strong>
                          {code.description && (
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              {code.description}
                            </div>
                          )}
                          <code style={{
                            fontSize: '11px',
                            background: '#f8f9fa',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            color: '#495057'
                          }}>
                            {code.code}
                          </code>
                        </div>
                      </td>
                      <td>{code.lineAccount?.name || 'N/A'}</td>
                      <td>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: '#e8f4fd',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          border: '1px solid #bee5eb'
                        }}>
                          <span style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginRight: '8px',
                            color: '#0c5460'
                          }}>
                            {trackingUrl}
                          </span>
                          <button
                            onClick={() => copyTrackingUrl(code.code)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              color: '#007bff'
                            }}
                            title="URLをコピー"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          <div>{code.clicks || 0} クリック</div>
                          <div>{code.conversions || 0} 友だち追加</div>
                          <div style={{ color: '#666' }}>
                            ({code.clicks > 0 ? ((code.conversions / code.clicks) * 100).toFixed(1) : 0}%)
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={code.isActive ? 'status-active' : 'status-inactive'}>
                          {code.isActive ? 'アクティブ' : '停止中'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          {new Date(code.createdAt).toLocaleDateString('ja-JP')}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => openTrackingUrl(code.code)}
                            className="btn btn-sm btn-secondary"
                            title="リンクを開く"
                          >
                            <ExternalLink size={12} />
                          </button>
                          <button
                            onClick={() => window.open(`http://localhost:3002/api/tracking/qr/${code.code}`, '_blank')}
                            className="btn btn-sm btn-secondary"
                            title="QRコード表示"
                          >
                            <QrCode size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(code.id, code.name)}
                            className="btn btn-sm"
                            style={{ background: '#dc3545', color: 'white' }}
                            title="削除"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 使用方法の説明 */}
        {trackingCodes.length > 0 && (
          <div className="card" style={{ marginTop: '30px', background: '#f8f9fa' }}>
            <h3 style={{ marginBottom: '15px' }}>使用方法</h3>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <p><strong>ローカル環境:</strong> http://localhost:3002/t/コード の形式でアクセス</p>
              <p><strong>本番環境:</strong> 同一ドメインでアクセス可能</p>
              <p><strong>動作:</strong> URLクリック時にLINE友だち追加ページにリダイレクト</p>
              <p><strong>統計:</strong> クリック数と友だち追加数を自動計測</p>
            </div>
          </div>
        )}
      </div>

      {/* 作成モーダル */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">新しいトラッキングコード作成</h2>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">コード名 *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: メインキャンペーン"
                  maxLength={50}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">説明</label>
                <textarea
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="コードの説明（オプション）"
                  rows={3}
                  maxLength={200}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">LINEアカウント *</label>
                <select
                  className="form-control"
                  value={formData.lineAccountId}
                  onChange={(e) => setFormData({ ...formData, lineAccountId: e.target.value })}
                  disabled={submitting}
                >
                  <option value="">LINEアカウントを選択してください</option>
                  {lineAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || lineAccounts.length === 0}
                >
                  {submitting ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}