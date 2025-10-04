// デバッグ用ユーティリティ

export const debugAPI = {
  // APIエンドポイント確認
  testEndpoints: async () => {
    const token = localStorage.getItem('token');
    console.log('🔑 Current token:', token);

    if (!token) {
      console.error('❌ No token found in localStorage');
      return;
    }

    const endpoints = [
      { name: 'Health Check', url: '/health', method: 'GET', auth: false },
      { name: 'Profile', url: '/api/auth/profile', method: 'GET', auth: true },
      { name: 'LINE Accounts', url: '/api/line', method: 'GET', auth: true },
      { name: 'Tracking Codes', url: '/api/tracking/codes', method: 'GET', auth: true },
    ];

    for (const endpoint of endpoints) {
      try {
        const headers: any = {
          'Content-Type': 'application/json',
        };

        if (endpoint.auth && token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}${endpoint.url}`, {
          method: endpoint.method,
          headers,
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`✅ ${endpoint.name}:`, data);
        } else {
          console.error(`❌ ${endpoint.name}:`, response.status, data);
        }
      } catch (error) {
        console.error(`💥 ${endpoint.name} Error:`, error);
      }
    }
  },

  // ローカルストレージ確認
  checkLocalStorage: () => {
    console.log('📦 LocalStorage contents:');
    console.log('- token:', localStorage.getItem('token'));
    console.log('- user:', localStorage.getItem('user'));
  },

  // ログイン状態確認
  checkAuthState: () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 Token payload:', payload);
        console.log('🕐 Expires at:', new Date(payload.exp * 1000));
        console.log('⏰ Is expired:', Date.now() > payload.exp * 1000);
      } catch (error) {
        console.error('❌ Invalid token format:', error);
      }
    } else {
      console.log('❌ No token found');
    }
  },

  // API設定確認
  checkAPIConfig: () => {
    console.log('⚙️ API Configuration:');
    console.log('- REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('- Current API Base:', process.env.REACT_APP_API_URL || 'http://localhost:3002');
  }
};

// グローバルウィンドウオブジェクトに追加（開発環境のみ）
if (process.env.NODE_ENV === 'development') {
  (window as any).debugAPI = debugAPI;
}