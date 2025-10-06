import type { AxiosInstance } from 'axios';
import type {
    ReadingSessionApiResponse,
    ReadingSessionPayload,
    ReadingProgressPayload,
    ReadingSessionEndPayload,
} from '@/types/reader';

export interface DashboardAnalytics {
  users: {
    totalUsers: number;
    subscribedUsers: number;
    freeUsers: number;
  };
  subscriptions: {
    totalActive: number;
    monthly: number;
    sixMonth: number;
    yearly: number;
    trial: number;
  };
  books: {
    totalBooks: number;
  };
  engagement: {
    totalClicksThisMonth: number;
    totalClicksLast30Days: number;
    todayClicks: number;
  };
  today: {
    totalClicks: number;
    totalReadingMinutes: number;
    totalReadingHours: number;
    uniqueReaders: number;
  };
  trends: {
    mostReadThisWeek: Array<{
      bookId: number;
      title: string;
      author: string;
      totalReadingMinutes: number;
      totalReadingHours: number;
    }>;
    mostPopularThisMonth: Array<{
      bookId: number;
      title: string;
      author: string;
      totalClicks: number;
      totalReads: number;
    }>;
  };
}

export interface DashboardAnalyticsResponse {
  success: boolean;
  analytics: DashboardAnalytics;
}

export const analyticsApi = {
    startReadingSession: (client: AxiosInstance, payload: ReadingSessionPayload) =>
        client.post<ReadingSessionApiResponse>('/api/v1/analytics/reading/start', payload),

    updateReadingProgress: (client: AxiosInstance, payload: ReadingProgressPayload) =>
        client.put<ReadingSessionApiResponse>(
            `/api/v1/analytics/reading/${payload.sessionId}/progress`,
            { currentPage: payload.currentPage }
        ),

    endReadingSession: (client: AxiosInstance, payload: ReadingSessionEndPayload) =>
        client.put<ReadingSessionApiResponse>(
            `/api/v1/analytics/reading/${payload.sessionId}/end`,
            payload.pagesRead ? { pagesRead: payload.pagesRead } : {}
        ),

    trackBookClick: (client: AxiosInstance, bookId: number) =>
        client.post(`/api/v1/analytics/books/${bookId}/click`),

    getDashboardAnalytics: (client: AxiosInstance) =>
        client.get<DashboardAnalyticsResponse>('/api/v1/admin/analytics/dashboard'),
};
