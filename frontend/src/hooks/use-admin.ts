import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHttpClient } from '@/context/HttpClientProvider';
import { toast } from '@/hooks/use-toast';
import type {
    AdminSubscription,
    AdminSubscriptionStats,
    AdminUser,
    PaymentRevenueAnalytics,
    PaymentStats,
    PaymentInsights,
    DashboardAnalytics,
    DashboardTrendBook,
    TopReader,
    BookAnalyticsSummary,
} from '@/types/admin';

type AdminSubscriptionsResponse = {
    success?: boolean;
    subscriptions?: AdminSubscription[];
    totalCount?: number;
};

type AdminSubscriptionStatsResponse = {
    success?: boolean;
    stats?: AdminSubscriptionStats;
};

type PaymentRevenueResponse = {
    success?: boolean;
    revenue?: Partial<PaymentRevenueAnalytics>;
};

type PaymentStatsResponse = {
    success?: boolean;
    stats?: Partial<PaymentStats>;
    insights?: PaymentInsights;
};

type DashboardAnalyticsResponse = {
    success?: boolean;
    analytics?: DashboardAnalytics;
};

type BooksAnalyticsListResponse = {
    success?: boolean;
    books?: DashboardTrendBook[];
    period?: {
        startDate?: string;
        endDate?: string;
        days?: number;
    };
};

type TopReadersResponse = {
    success?: boolean;
    readers?: TopReader[];
    period?: {
        startDate?: string;
        endDate?: string;
        days?: number;
    };
};

type BookAnalyticsResponse = {
    success?: boolean;
    analytics?: BookAnalyticsSummary;
    period?: {
        startDate?: string;
        endDate?: string;
    };
};

const parseNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

export function useAdminUsers() {
    const client = useHttpClient();

    return useQuery<AdminUser[]>({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            const response = await client.get<AdminUser[]>('/api/v1/users');
            return response.data ?? [];
        },
    });
}

export function useAdminSubscriptions() {
    const client = useHttpClient();

    return useQuery<{ subscriptions: AdminSubscription[]; totalCount: number }>({
        queryKey: ['admin', 'subscriptions'],
        queryFn: async () => {
            const response = await client.get<AdminSubscriptionsResponse>('/api/v1/admin/subscriptions');
            const payload = response.data ?? {};
            return {
                subscriptions: payload.subscriptions ?? [],
                totalCount: payload.totalCount ?? payload.subscriptions?.length ?? 0,
            };
        },
    });
}

export function useAdminSubscriptionStats() {
    const client = useHttpClient();

    return useQuery<AdminSubscriptionStats>({
        queryKey: ['admin', 'subscriptions', 'stats'],
        queryFn: async () => {
            const response = await client.get<AdminSubscriptionStatsResponse>('/api/v1/admin/subscriptions/stats');
            const stats = response.data?.stats;
            return {
                activeSubscriptions: stats?.activeSubscriptions ?? 0,
                totalUsers: stats?.totalUsers ?? 0,
                conversionRate: stats?.conversionRate ?? 0,
            };
        },
    });
}

export function useCancelSubscription() {
    const client = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (subscriptionId: number) => {
            const response = await client.post(`/api/v1/subscriptions/${subscriptionId}/cancel`);
            return response.data;
        },
        onSuccess: () => {
            toast({
                title: 'Pretplata otkazana',
                description: 'Korisnik više nema aktivnu pretplatu.',
            });
            queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions', 'stats'] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message ?? 'Nije moguće otkazati pretplatu.';
            toast({
                title: 'Greška',
                description: message,
                variant: 'destructive',
            });
        },
    });
}

export function useAdminPaymentRevenue() {
    const client = useHttpClient();

    return useQuery<PaymentRevenueAnalytics>({
        queryKey: ['admin', 'payments', 'revenue'],
        queryFn: async () => {
            const response = await client.get<PaymentRevenueResponse>('/api/v1/admin/payments/revenue');
            const revenue = response.data?.revenue ?? {};
            return {
                totalRevenue: parseNumber(revenue.totalRevenue),
                monthlyRevenue: parseNumber(revenue.monthlyRevenue),
                successfulPaymentsCount: parseNumber(revenue.successfulPaymentsCount),
                currency: revenue.currency ?? 'RSD',
            };
        },
    });
}

export function useAdminPaymentStats() {
    const client = useHttpClient();

    return useQuery<{ stats: PaymentStats; insights: PaymentInsights | null }>({
        queryKey: ['admin', 'payments', 'stats'],
        queryFn: async () => {
            const response = await client.get<PaymentStatsResponse>('/api/v1/admin/payments/stats');
            const stats = response.data?.stats ?? {};
            return {
                stats: {
                    totalRevenue: parseNumber(stats.totalRevenue),
                    monthlyRevenue: parseNumber(stats.monthlyRevenue),
                    successfulPayments: parseNumber(stats.successfulPayments),
                    averagePaymentAmount: parseNumber(stats.averagePaymentAmount),
                    currency: stats.currency ?? 'RSD',
                },
                insights: response.data?.insights ?? null,
            };
        },
    });
}

export function useAdminDashboardAnalytics(days?: number) {
    const client = useHttpClient();

    return useQuery<DashboardAnalytics>({
        queryKey: ['admin', 'analytics', 'dashboard', days ?? 'default'],
        queryFn: async () => {
            const response = await client.get<DashboardAnalyticsResponse>('/api/v1/admin/analytics/dashboard');
            const analytics = response.data?.analytics;
            if (!analytics) {
                return {
                    today: {
                        totalClicks: 0,
                        totalReadingMinutes: 0,
                        totalReadingHours: 0,
                        uniqueReaders: 0,
                    },
                    trends: {
                        mostReadThisWeek: [],
                        mostPopularThisMonth: [],
                    },
                } satisfies DashboardAnalytics;
            }
            return analytics;
        },
    });
}

export function useAdminPopularBooks(days = 30) {
    const client = useHttpClient();

    return useQuery<{ books: DashboardTrendBook[]; period?: BooksAnalyticsListResponse['period'] }>({
        queryKey: ['admin', 'analytics', 'popular', days],
        queryFn: async () => {
            const response = await client.get<BooksAnalyticsListResponse>(`/api/v1/admin/analytics/books/popular?days=${days}`);
            return {
                books: response.data?.books ?? [],
                period: response.data?.period,
            };
        },
    });
}

export function useAdminMostReadBooks(days = 30) {
    const client = useHttpClient();

    return useQuery<{ books: DashboardTrendBook[]; period?: BooksAnalyticsListResponse['period'] }>({
        queryKey: ['admin', 'analytics', 'most-read', days],
        queryFn: async () => {
            const response = await client.get<BooksAnalyticsListResponse>(`/api/v1/admin/analytics/books/most-read?days=${days}`);
            return {
                books: response.data?.books ?? [],
                period: response.data?.period,
            };
        },
    });
}

export function useAdminTopReaders(days = 30) {
    const client = useHttpClient();

    return useQuery<{ readers: TopReader[]; period?: BooksAnalyticsListResponse['period'] }>({
        queryKey: ['admin', 'analytics', 'top-readers', days],
        queryFn: async () => {
            const response = await client.get<TopReadersResponse>(`/api/v1/admin/analytics/readers/top?days=${days}`);
            return {
                readers: response.data?.readers ?? [],
                period: response.data?.period,
            };
        },
    });
}

export function useAdminBookAnalytics(bookId?: number, startDate?: string, endDate?: string) {
    const client = useHttpClient();

    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    }, [startDate, endDate]);

    return useQuery<BookAnalyticsSummary>({
        queryKey: ['admin', 'analytics', 'book', bookId, startDate, endDate],
        enabled: Boolean(bookId),
        queryFn: async () => {
            const response = await client.get<BookAnalyticsResponse>(`/api/v1/admin/analytics/books/${bookId}${queryParams}`);
            const analytics = response.data?.analytics;
            if (!analytics) {
                return {
                    book: {
                        id: bookId ?? 0,
                        title: '',
                        author: '',
                        totalReads: 0,
                    },
                    statistics: {
                        totalReadingMinutes: 0,
                        totalReadingHours: 0,
                        uniqueReaders: 0,
                        averageSessionMinutes: 0,
                    },
                    dailyAnalytics: [],
                } satisfies BookAnalyticsSummary;
            }
            return analytics;
        },
    });
}
