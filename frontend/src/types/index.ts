export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineAccount {
  id: string;
  name: string;
  channelId: string;
  channelSecret: string;
  channelAccessToken: string;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    trackingCodes: number;
  };
}

export interface TrackingCode {
  id: string;
  name: string;
  code: string;
  description?: string;
  lineAccountId: string;
  lineAccount: {
    name: string;
    channelId: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  trackingUrl: string;
  qrCodeUrl: string;
  stats: {
    totalClicks: number;
    totalFriends: number;
    conversionRate: string;
  };
}

export interface AnalyticsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalClicks: number;
    totalFriends: number;
    conversionRate: string;
  };
  trackingCodes: {
    id: string;
    name: string;
    code: string;
    clicks: number;
    friends: number;
    conversionRate: string;
  }[];
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}