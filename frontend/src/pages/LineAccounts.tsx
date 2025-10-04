import React, { useState, useEffect } from 'react';
import { Smartphone, Plus, Settings, Trash2, CheckCircle, AlertCircle, Link, RefreshCw } from 'lucide-react';
import { api, ApiError } from '../utils/api';

interface LineAccount {
  id: string;
  name: string;
  channelId: string;
  channelSecret: string;
  channelAccessToken: string;
  webhookUrl?: string;
  webhookVerified?: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: {
    trackingCodes: number;
  };
}

export default function LineAccounts() {
  const [lineAccounts, setLineAccounts] = useState<LineAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<LineAccount | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<LineAccount | null>(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    channelId: '',
    channelSecret: '',
    channelAccessToken: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadLineAccounts();
  }, []);

  const loadLineAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.getLineAccounts();
      setLineAccounts(response.lineAccounts || []);
    } catch (error) {
      console.error('LINEアカウント読み込みエラー:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('データの読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'アカウント名は必須です';
    } else if (formData.name.length < 2) {
      errors.name = 'アカウント名は2文字以上である必要があります';
    }

    if (!formData.channelId.trim()) {
      errors.channelId = 'チャンネルIDは必須です';
    } else if (!/^\d+$/.test(formData.channelId.trim())) {
      errors.channelId = 'チャンネルIDは数字のみである必要があります';
    }

    if (!formData.channelSecret.trim()) {
      errors.channelSecret = 'チャンネルシークレットは必須です';
    } else if (formData.channelSecret.length < 10) {
      errors.channelSecret = 'チャンネルシークレットが短すぎます';
    }

    if (!formData.channelAccessToken.trim()) {
      errors.channelAccessToken = 'チャンネルアクセストークンは必須です';
    } else if (formData.channelAccessToken.length < 100) {
      errors.channelAccessToken = 'チャンネルアクセストークンが短すぎます';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      if (editingAccount) {
        await api.updateLineAccount(editingAccount.id, formData);
        setSuccess('LINEアカウントを更新しました');
      } else {
        await api.createLineAccount(formData);
        setSuccess('LINEアカウントを作成しました');
      }

      setShowModal(false);
      setFormData({ name: '', channelId: '', channelSecret: '', channelAccessToken: '' });
      setEditingAccount(null);
      await loadLineAccounts();
    } catch (error) {
      console.error('保存エラー:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('保存に失敗しました');
      }
    }
  };

  const handleEdit = (account: LineAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      channelId: account.channelId,
      channelSecret: account.channelSecret,
      channelAccessToken: account.channelAccessToken
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('このLINEアカウントを削除してもよろしいですか？関連するトラッキングコードも削除されます。')) {
      return;
    }

    try {
      await api.deleteLineAccount(id);
      setSuccess('LINEアカウントを削除しました');
      await loadLineAccounts();
    } catch (error) {
      console.error('削除エラー:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('削除に失敗しました');
      }
    }
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Webhook URL設定
  const handleWebhookSetup = (account: LineAccount) => {
    setSelectedAccount(account);
    setShowWebhookModal(true);
  };

  const setupWebhookUrl = async () => {
    if (!selectedAccount) return;

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      // バックエンドでWebhook URLを自動設定
      await api.request(`/line/${selectedAccount.id}/setup-webhook`, {
        method: 'POST'
      });

      setSuccess('Webhook URLを設定しました');
      setShowWebhookModal(false);
      await loadLineAccounts();

    } catch (error: any) {
      setError(error.message || 'Webhook設定に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const verifyWebhook = async (accountId: string) => {
    try {
      setError('');
      await api.request(`/line/${accountId}/verify-webhook`, {
        method: 'POST'
      });
      setSuccess('Webhook接続を確認しました');
      await loadLineAccounts();
    } catch (error: any) {
      setError(error.message || 'Webhook検証に失敗しました');
    }
  };

  const openModal = () => {
    setEditingAccount(null);
    setFormData({ name: '', channelId: '', channelSecret: '', channelAccessToken: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const maskSecret = (secret: string, show: boolean) => {
    if (show) return secret;
    if (secret.length <= 8) return '*'.repeat(secret.length);
    return secret.substring(0, 4) + '*'.repeat(secret.length - 8) + secret.substring(secret.length - 4);
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">LINEアカウント管理</h1>
          <p className="page-subtitle">LINE Bot のアカウント情報とWebhookを管理</p>
        </div>
        <button onClick={openModal} className="btn btn-success">
          <Plus className="btn-icon" />
          アカウントを追加
        </button>
      </div>

      <div className="page-content">
        {error && (
          <div className="error-container">
            {error}
          </div>
        )}

        {success && (
          <div className="success-container">
            {success}
          </div>
        )}

        {lineAccounts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Smartphone size={64} style={{ color: '#ccc', marginBottom: '20px' }} />
            <h3 style={{ marginBottom: '12px' }}>LINEアカウントがありません</h3>
            <p style={{ color: '#6c757d', marginBottom: '24px' }}>
              新しいLINEボットを接続する
              <br />
              新しいLINEボットを接続してください
            </p>
            <button onClick={openModal} className="btn btn-success">
              <Plus className="btn-icon" />
              最初のアカウントを追加
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
            {lineAccounts.map((account) => (
              <div key={account.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: '#06C755',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      <Smartphone size={24} style={{ color: 'white' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{account.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={account.isActive ? 'status-active' : 'status-inactive'}>
                          {account.isActive ? 'アクティブ' : '停止中'}
                        </span>
                        {account.webhookUrl && (
                          account.webhookVerified ? (
                            <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#28a745' }}>
                              <CheckCircle size={14} style={{ marginRight: '4px' }} />
                              Webhook有効
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#ffc107' }}>
                              <AlertCircle size={14} style={{ marginRight: '4px' }} />
                              Webhook未確認
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(account)}
                      className="btn btn-sm btn-secondary"
                      title="編集"
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="btn btn-sm"
                      style={{ background: '#dc3545', color: 'white' }}
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                      チャンネルID
                    </label>
                    <code style={{ fontSize: '14px', background: '#f8f9fa', padding: '4px 8px', borderRadius: '4px', display: 'block' }}>
                      {account.channelId}
                    </code>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                      チャンネルシークレット
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <code style={{ fontSize: '14px', background: '#f8f9fa', padding: '4px 8px', borderRadius: '4px', flex: 1, marginRight: '8px' }}>
                        {maskSecret(account.channelSecret, showSecrets[`${account.id}_secret`] || false)}
                      </code>
                      <button
                        onClick={() => toggleSecretVisibility(`${account.id}_secret`)}
                        className="btn btn-sm btn-secondary"
                      >
                        {showSecrets[`${account.id}_secret`] ? '隠す' : '表示'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                      アクセストークン
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <code style={{ fontSize: '14px', background: '#f8f9fa', padding: '4px 8px', borderRadius: '4px', flex: 1, marginRight: '8px' }}>
                        {maskSecret(account.channelAccessToken, showSecrets[`${account.id}_token`] || false)}
                      </code>
                      <button
                        onClick={() => toggleSecretVisibility(`${account.id}_token`)}
                        className="btn btn-sm btn-secondary"
                      >
                        {showSecrets[`${account.id}_token`] ? '隠す' : '表示'}
                      </button>
                    </div>
                  </div>

                  {account.webhookUrl && (
                    <div>
                      <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                        Webhook URL
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{
                          fontSize: '12px',
                          background: '#f8f9fa',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {account.webhookUrl}
                        </code>
                        <button
                          onClick={() => verifyWebhook(account.id)}
                          className="btn btn-sm btn-secondary"
                          title="Webhook検証"
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    追跡コード: {account._count?.trackingCodes || 0}個
                  </div>
                  {!account.webhookUrl ? (
                    <button
                      onClick={() => handleWebhookSetup(account)}
                      className="btn btn-sm"
                      style={{ background: '#17a2b8', color: 'white' }}
                    >
                      <Link size={12} className="btn-icon" />
                      Webhook設定
                    </button>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      作成: {new Date(account.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAccount ? 'LINEアカウント編集' : '新しいLINEアカウント追加'}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">アカウント名 *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: メインアカウント"
                />
                {formErrors.name && (
                  <div className="error-message">{formErrors.name}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">チャンネルID *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.channelId ? 'error' : ''}`}
                  value={formData.channelId}
                  onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                  placeholder="例: 1234567890"
                />
                {formErrors.channelId && (
                  <div className="error-message">{formErrors.channelId}</div>
                )}
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  LINE Developers コンソールで取得
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">チャンネルシークレット *</label>
                <input
                  type={showSecrets.formSecret ? 'text' : 'password'}
                  className={`form-control ${formErrors.channelSecret ? 'error' : ''}`}
                  value={formData.channelSecret}
                  onChange={(e) => setFormData({ ...formData, channelSecret: e.target.value })}
                  placeholder="チャンネルシークレットを入力"
                />
                {formErrors.channelSecret && (
                  <div className="error-message">{formErrors.channelSecret}</div>
                )}
                <button
                  type="button"
                  onClick={() => toggleSecretVisibility('formSecret')}
                  style={{ fontSize: '12px', color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}
                >
                  {showSecrets.formSecret ? '隠す' : '表示'}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">チャンネルアクセストークン *</label>
                <textarea
                  className={`form-control ${formErrors.channelAccessToken ? 'error' : ''}`}
                  value={formData.channelAccessToken}
                  onChange={(e) => setFormData({ ...formData, channelAccessToken: e.target.value })}
                  placeholder="チャンネルアクセストークンを入力"
                  rows={4}
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
                {formErrors.channelAccessToken && (
                  <div className="error-message">{formErrors.channelAccessToken}</div>
                )}
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  長期チャンネルアクセストークンを使用してください
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  キャンセル
                </button>
                <button type="submit" className="btn btn-success">
                  {editingAccount ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook設定モーダル */}
      {showWebhookModal && selectedAccount && (
        <div className="modal-overlay" onClick={() => setShowWebhookModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Webhook設定</h2>
              <button className="modal-close" onClick={() => setShowWebhookModal(false)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p>「{selectedAccount.name}」のWebhook URLを自動設定します。</p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                これにより友だち追加やメッセージの受信が可能になります。
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowWebhookModal(false)}
                className="btn btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={setupWebhookUrl}
                className="btn"
                style={{ background: '#17a2b8', color: 'white' }}
                disabled={loading}
              >
                {loading ? '設定中...' : 'Webhook設定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}