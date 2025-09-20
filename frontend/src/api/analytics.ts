import type { AxiosInstance } from 'axios';
import type {
    ReadingSessionApiResponse,
    ReadingSessionPayload,
    ReadingProgressPayload,
    ReadingSessionEndPayload,
} from '@/types/reader';

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
};
