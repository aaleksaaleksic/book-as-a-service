export interface AdminUser {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
    fullName?: string;
    role: string;
    permissions: string[];
    emailVerified?: boolean;
    phoneVerified?: boolean;
    active?: boolean;
    createdAt?: string;
    lastLoginAt?: string;
    isVerified?: boolean;
    isFullyVerified?: boolean;
    isAdmin?: boolean;
    hasActiveSubscription?: boolean;
}

export type AdminSubscriptionType = 'MONTHLY' | 'YEARLY' | 'TRIAL';

export type AdminSubscriptionStatus =
    | 'ACTIVE'
    | 'PENDING'
    | 'EXPIRED'
    | 'CANCELED'
    | 'TRIAL'
    | 'SUSPENDED'
    | 'PAYMENT_FAILED';

export interface AdminSubscription {
    id: number;
    type: AdminSubscriptionType;
    status: AdminSubscriptionStatus;
    priceInRsd: number;
    startDate?: string;
    endDate?: string;
    activatedAt?: string;
    canceledAt?: string;
    autoRenew?: boolean;
    paymentMethod?: string;
    externalSubscriptionId?: string;
    createdAt?: string;
    updatedAt?: string;
    userId: number;
    userEmail?: string;
    userName?: string;
    userFirstName?: string;
    userLastName?: string;
    isActive?: boolean;
    isExpired?: boolean;
    daysRemaining?: number;
    isTrial?: boolean;
    isCanceled?: boolean;
    statusDescription?: string;
}

export interface AdminSubscriptionStats {
    activeSubscriptions: number;
    totalUsers: number;
    conversionRate: number;
}

export interface PaymentRevenueAnalytics {
    totalRevenue: number;
    monthlyRevenue: number;
    successfulPaymentsCount: number;
    currency: string;
}

export interface PaymentStats {
    totalRevenue: number;
    monthlyRevenue: number;
    successfulPayments: number;
    averagePaymentAmount: number;
    currency: string;
}

export interface PaymentInsights {
    revenueGrowth: string;
    paymentSuccessRate: string;
    primaryPaymentMethod: string;
}

export interface DashboardTodayMetrics {
    totalClicks: number;
    totalReadingMinutes: number;
    totalReadingHours: number;
    uniqueReaders: number;
}

export interface DashboardTrendBook {
    bookId: number;
    title: string;
    author: string;
    totalReadingMinutes?: number;
    totalReadingHours?: number;
    totalClicks?: number;
    totalReads?: number;
}

export interface DashboardAnalytics {
    today: DashboardTodayMetrics;
    trends: {
        mostReadThisWeek: DashboardTrendBook[];
        mostPopularThisMonth: DashboardTrendBook[];
    };
}

export interface TopReader {
    userId: number;
    totalReadingMinutes: number;
    totalReadingHours: number;
}

export interface BookAnalyticsSummary {
    book: {
        id: number;
        title: string;
        author: string;
        totalReads: number;
    };
    statistics: {
        totalReadingMinutes: number;
        totalReadingHours: number;
        uniqueReaders: number;
        averageSessionMinutes: number;
    };
    dailyAnalytics: Array<{
        date: string;
        clicks: number;
        readingMinutes: number;
        uniqueReaders: number;
        sessions: number;
    }>;
}
