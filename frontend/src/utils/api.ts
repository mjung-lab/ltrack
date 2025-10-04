const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`API Request: ${config.method || 'GET'} ${API_BASE_URL}${endpoint}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }

        console.error('API Error:', errorData);
        throw new ApiError(
          response.status,
          errorData.error || `HTTP ${response.status}`,
          errorData.details
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('API Response:', data);
        return data;
      }

      return response.text() as any;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Network Error:', error);
      throw new ApiError(0, 'ネットワークエラーが発生しました');
    }
  },

  // Auth
  async login(email: string, password: string) {
    return this.request<{
      user: any;
      token: string;
      expiresIn: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email: string, password: string, name: string) {
    return this.request<{
      user: any;
      token: string;
      expiresIn: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role: 'admin' }),
    });
  },

  async getProfile() {
    return this.request<{ user: any }>('/auth/profile');
  },

  // Tracking Codes
  async getTrackingCodes() {
    return this.request<{
      trackingCodes: any[];
      total: number;
    }>('/tracking/codes');
  },

  async createTrackingCode(data: {
    name: string;
    description?: string;
    lineAccountId: string;
  }) {
    return this.request<{
      trackingCode: any;
    }>('/tracking/codes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTrackingCodeDetails(code: string) {
    return this.request<{
      trackingCode: any;
      stats: any;
    }>(`/tracking/codes/${code}`);
  },

  async updateTrackingCode(id: string, data: any) {
    return this.request<{
      trackingCode: any;
    }>(`/tracking/codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTrackingCode(id: string) {
    return this.request(`/tracking/codes/${id}`, {
      method: 'DELETE',
    });
  },

  // LINE Accounts
  async getLineAccounts() {
    return this.request<{
      lineAccounts: any[];
      total: number;
    }>('/line');
  },

  async createLineAccount(data: {
    name: string;
    channelId: string;
    channelSecret: string;
    channelAccessToken: string;
  }) {
    return this.request<{
      lineAccount: any;
    }>('/line', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateLineAccount(id: string, data: any) {
    return this.request<{
      lineAccount: any;
    }>(`/line/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteLineAccount(id: string) {
    return this.request(`/line/${id}`, {
      method: 'DELETE',
    });
  },

  // Analytics
  async getAnalytics(period: string = '7d') {
    return this.request<any>(`/tracking/analytics?period=${period}`);
  },

  async getDashboardStats() {
    return this.request<any>('/tracking/dashboard/stats');
  },

  async getWebhookStats(period: string = '7d') {
    return this.request<any>(`/webhook/stats?period=${period}`);
  },

  // AI Analysis
  async getFriendPrediction(period: string = '30d') {
    return this.request<any>(`/ai/predictions/friends?period=${period}`);
  },

  async getROIPrediction(investmentAmount: number = 100000, period: string = '30d') {
    return this.request<any>(`/ai/predictions/roi?investmentAmount=${investmentAmount}&period=${period}`);
  },

  async getSegmentAnalysis() {
    return this.request<any>('/ai/segments');
  },

  async getChurnPrediction() {
    return this.request<any>('/ai/predictions/churn');
  },

  async getAIOverview() {
    return this.request<any>('/ai/overview');
  },
};