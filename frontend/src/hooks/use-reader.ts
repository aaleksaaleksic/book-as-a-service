"use client";

import { useQuery, useMutation } from '@tanstack/react-query';
import { useHttpClient } from '@/context/HttpClientProvider';
import { booksApi } from '@/api/books';
import { analyticsApi } from '@/api/analytics';
import type {
    BookReadAccessResponse,
    ReadingSessionApiResponse,
    ReadingSessionPayload,
    ReadingProgressPayload,
    ReadingSessionEndPayload,
} from '@/types/reader';

export const useBookReadAccess = (bookId?: number) => {
    const client = useHttpClient();

    return useQuery<BookReadAccessResponse>({
        queryKey: ['books', bookId, 'read-access'],
        queryFn: async () => {
            const response = await booksApi.readBook(client, bookId!);
            return response.data;
        },
        enabled: typeof bookId === 'number' && bookId > 0,
        staleTime: 60 * 1000,
    });
};

export const useStartReadingSession = () => {
    const client = useHttpClient();
    return useMutation({
        mutationFn: async (payload: ReadingSessionPayload) => {
            const response = await analyticsApi.startReadingSession(client, payload);
            return response.data as ReadingSessionApiResponse;
        },
    });
};

export const useUpdateReadingProgress = () => {
    const client = useHttpClient();
    return useMutation({
        mutationFn: async (payload: ReadingProgressPayload) => {
            const response = await analyticsApi.updateReadingProgress(client, payload);
            return response.data as ReadingSessionApiResponse;
        },
    });
};

export const useEndReadingSession = () => {
    const client = useHttpClient();
    return useMutation({
        mutationFn: async (payload: ReadingSessionEndPayload) => {
            const response = await analyticsApi.endReadingSession(client, payload);
            return response.data as ReadingSessionApiResponse;
        },
    });
};
