import React, { useState } from 'react';
import { api } from '../utils/api';

export default function TestAPI() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    try {
      setLoading(true);

      // 1. LINEアカウント取得テスト
      console.log('Testing LINE accounts API...');
      const lineResponse = await api.getLineAccounts();
      console.log('LINE accounts response:', lineResponse);

      // 2. トラッキングコード取得テスト
      console.log('Testing tracking codes API...');
      const codesResponse = await api.getTrackingCodes();
      console.log('Tracking codes response:', codesResponse);

      // 3. テストエンドポイント
      console.log('Testing custom endpoint...');
      const testResponse = await api.request('/tracking/test');
      console.log('Test endpoint response:', testResponse);

      setResult({
        lineAccounts: lineResponse,
        trackingCodes: codesResponse,
        testEndpoint: testResponse
      });

    } catch (error) {
      console.error('API Test Error:', error);
      setResult({ error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">API テスト</h1>
      </div>

      <div className="page-content">
        <div className="card">
          <button
            onClick={testAPI}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'テスト中...' : 'API テスト実行'}
          </button>

          {result && (
            <div style={{ marginTop: '20px' }}>
              <h3>結果:</h3>
              <pre style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '5px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}