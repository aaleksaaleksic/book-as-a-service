'use client';

import {
    Users,
    UserCheck,
    Calendar,
    BookOpen,
    MousePointerClick,
    TrendingUp,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const { data: analytics, isLoading, error } = useDashboardAnalytics();

    const formatNumber = (value: number) => new Intl.NumberFormat('sr-RS').format(value);

    const StatCard = ({
        title,
        value,
        subtitle,
        icon: Icon,
        trend
    }: {
        title: string;
        value: string | number;
        subtitle: string;
        icon: any;
        trend?: { value: string; positive: boolean }
    }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
                    <p className="text-xs text-gray-500">{subtitle}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-950 text-white shadow-md">
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            {trend && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className={`h-4 w-4 ${trend.positive ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={trend.positive ? 'text-green-600' : 'text-red-600'}>
                            {trend.value}
                        </span>
                        <span className="text-gray-500">u odnosu na prošli mesec</span>
                    </div>
                </div>
            )}
        </div>
    );

    if (error) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-red-600 font-semibold mb-2">Greška pri učitavanju podataka</p>
                        <p className="text-gray-600 text-sm">Pokušajte ponovo kasnije</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Welcome Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Dobrodošli nazad, {user?.firstName}!
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Evo pregleda statistike i aktivnosti platforme
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-950"></div>
                    </div>
                ) : analytics ? (
                    <>
                        {/* Main Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Total Users */}
                            <StatCard
                                title="Ukupno korisnika"
                                value={formatNumber(analytics.users.totalUsers)}
                                subtitle="Svi registrovani korisnici"
                                icon={Users}
                            />

                            {/* Subscribed Users */}
                            <StatCard
                                title="Pretplaćeni korisnici"
                                value={formatNumber(analytics.users.subscribedUsers)}
                                subtitle={`${Math.round((analytics.users.subscribedUsers / analytics.users.totalUsers) * 100)}% ukupnih korisnika`}
                                icon={UserCheck}
                            />

                            {/* Total Books */}
                            <StatCard
                                title="Ukupno knjiga"
                                value={formatNumber(analytics.books.totalBooks)}
                                subtitle="Dostupno na platformi"
                                icon={BookOpen}
                            />
                        </div>

                        {/* Subscription Stats */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Aktivne pretplate</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Total Active */}
                                <div className="bg-gradient-to-br from-sky-950 to-sky-900 rounded-lg p-6 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-sky-200 text-sm font-medium mb-1">Ukupno aktivnih</p>
                                            <h3 className="text-4xl font-bold">{formatNumber(analytics.subscriptions.totalActive)}</h3>
                                        </div>
                                        <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <p className="text-sky-200 text-sm">Sve aktivne pretplate</p>
                                </div>

                                {/* Monthly */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-gray-600 text-sm font-medium mb-1">Mesečne</p>
                                            <h3 className="text-3xl font-bold text-gray-900">{formatNumber(analytics.subscriptions.monthly)}</h3>
                                        </div>
                                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">1 mesec</span>
                                        <span className="font-semibold text-blue-600">
                                            {analytics.subscriptions.totalActive > 0
                                                ? Math.round((analytics.subscriptions.monthly / analytics.subscriptions.totalActive) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                </div>

                                {/* Six Month */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-gray-600 text-sm font-medium mb-1">Šestomesečne</p>
                                            <h3 className="text-3xl font-bold text-gray-900">{formatNumber(analytics.subscriptions.sixMonth)}</h3>
                                        </div>
                                        <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">6 meseci</span>
                                        <span className="font-semibold text-purple-600">
                                            {analytics.subscriptions.totalActive > 0
                                                ? Math.round((analytics.subscriptions.sixMonth / analytics.subscriptions.totalActive) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                </div>

                                {/* Yearly */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-gray-600 text-sm font-medium mb-1">Godišnje</p>
                                            <h3 className="text-3xl font-bold text-gray-900">{formatNumber(analytics.subscriptions.yearly)}</h3>
                                        </div>
                                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-green-600" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">12 meseci</span>
                                        <span className="font-semibold text-green-600">
                                            {analytics.subscriptions.totalActive > 0
                                                ? Math.round((analytics.subscriptions.yearly / analytics.subscriptions.totalActive) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Engagement Stats */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Angažovanje korisnika</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Total Clicks This Month */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-600 mb-1">Ovog meseca</p>
                                            <h3 className="text-4xl font-bold text-gray-900 mb-2">
                                                {formatNumber(analytics.engagement.totalClicksThisMonth)}
                                            </h3>
                                            <p className="text-xs text-gray-500">Klikovi na knjige</p>
                                        </div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                            <MousePointerClick className="h-6 w-6" />
                                        </div>
                                    </div>
                                </div>

                                {/* Total Clicks Last 30 Days */}
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-6 shadow-sm">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-orange-800 mb-1">Poslednjih 30 dana</p>
                                            <h3 className="text-4xl font-bold text-orange-900 mb-2">
                                                {formatNumber(analytics.engagement.totalClicksLast30Days)}
                                            </h3>
                                            <p className="text-xs text-orange-700">Klikovi na knjige</p>
                                        </div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-200 text-orange-800">
                                            <MousePointerClick className="h-6 w-6" />
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats Summary */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Brzi pregled</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                            <span className="text-sm text-gray-600">Stopa konverzije</span>
                                            <span className="text-sm font-semibold text-sky-950">
                                                {analytics.users.totalUsers > 0
                                                    ? Math.round((analytics.users.subscribedUsers / analytics.users.totalUsers) * 100)
                                                    : 0}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                            <span className="text-sm text-gray-600">Danas - Jedinstveni čitaoci</span>
                                            <span className="text-sm font-semibold text-sky-950">
                                                {formatNumber(analytics.today.uniqueReaders)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm text-gray-600">Najpopularnija pretplata</span>
                                            <span className="text-sm font-semibold text-sky-950">
                                                {analytics.subscriptions.monthly >= analytics.subscriptions.yearly &&
                                                 analytics.subscriptions.monthly >= analytics.subscriptions.sixMonth
                                                    ? 'Mesečna'
                                                    : analytics.subscriptions.yearly >= analytics.subscriptions.sixMonth
                                                    ? 'Godišnja'
                                                    : 'Šestomesečna'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </AdminLayout>
    );
}
