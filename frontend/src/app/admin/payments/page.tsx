'use client';

import { useState } from 'react';
import {
    DollarSign,
    TrendingUp,
    PieChart,
    ShieldCheck,
    Search,
    X,
    CheckCircle2,
    PhoneCall,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    useAdminPaymentRevenue,
    useAdminPaymentStats,
    useAdminSubscriptionStats,
    useAdminSubscriptions,
    useAdminUsers,
} from '@/hooks/use-admin';
import { format } from 'date-fns';
import type { AdminSubscription } from '@/types/admin';
import { useMemo } from 'react';

const normalize = (value: number | string | undefined | null) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const formatCurrency = (value: number | string | undefined, currency: string) =>
    new Intl.NumberFormat('sr-RS', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
    }).format(normalize(value));

const formatNumber = (value: number | string | undefined) => new Intl.NumberFormat('sr-RS').format(normalize(value));

const formatDate = (value?: string) => {
    if (!value) return '-';
    try {
        return format(new Date(value), 'dd.MM.yyyy.');
    } catch (error) {
        return value;
    }
};

const getSubscriptionTypeName = (type?: string) => {
    if (!type) return '-';
    const upperType = type.toUpperCase();
    if (upperType === 'MONTHLY') return 'Mesečna';
    if (upperType === 'YEARLY') return 'Godišnja';
    return type;
};

const getStatusBadge = (subscription: AdminSubscription) => {
    if (subscription.status === 'ACTIVE' || subscription.isActive) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktivna</span>;
    }
    if (subscription.status === 'CANCELED' || subscription.isCanceled) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Otkazana</span>;
    }
    if (subscription.status === 'EXPIRED' || subscription.isExpired) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Istekla</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{subscription.status}</span>;
};

export default function AdminPaymentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const { data: revenueData, isLoading: revenueLoading } = useAdminPaymentRevenue();
    const { data: paymentStatsData, isLoading: paymentStatsLoading } = useAdminPaymentStats();
    const { data: subscriptionStats, isLoading: subscriptionStatsLoading } = useAdminSubscriptionStats();
    const { data: subscriptionsData, isLoading: subscriptionsLoading } = useAdminSubscriptions();
    const { data: usersData, isLoading: usersLoading } = useAdminUsers();

    const currency = revenueData?.currency ?? paymentStatsData?.stats.currency ?? 'RSD';
    const stats = paymentStatsData?.stats;

    const totalRevenue = normalize(revenueData?.totalRevenue ?? stats?.totalRevenue);
    const monthlyRevenue = normalize(revenueData?.monthlyRevenue ?? stats?.monthlyRevenue);
    const successfulPayments = normalize(revenueData?.successfulPaymentsCount ?? stats?.successfulPayments);
    const averagePayment = normalize(stats?.averagePaymentAmount);

    const subscriptions = subscriptionsData?.subscriptions || [];
    const users = usersData?.users || [];

    // Create a map of userId -> user phone number for quick lookup
    const userPhoneMap = useMemo(() => {
        const map = new Map<number, string>();
        users.forEach(user => {
            if (user.phoneNumber) {
                map.set(user.id, user.phoneNumber);
            }
        });
        return map;
    }, [users]);

    const filteredSubscriptions = subscriptions.filter(subscription => {
        const matchesSearch = subscription.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subscription.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subscription.userFirstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subscription.userLastName?.toLowerCase().includes(searchQuery.toLowerCase());

        const isActive = subscription.status === 'ACTIVE' || subscription.isActive;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && isActive) ||
            (statusFilter === 'inactive' && !isActive);

        return matchesSearch && matchesStatus;
    });

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Plaćanja & Pretplate</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Ukupno {formatNumber(filteredSubscriptions.length)} pretplata
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 lg:grid-cols-4">
                    <Card className="border-none bg-white shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700">Ukupni prihod</CardTitle>
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            {revenueLoading ? (
                                <Skeleton className="h-10 w-28" />
                            ) : (
                                <div className="text-3xl font-semibold text-gray-900">
                                    {formatCurrency(totalRevenue, currency)}
                                </div>
                            )}
                            <p className="mt-2 text-xs text-gray-600">Kumulativno od lansiranja</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700">Prihod ovog meseca</CardTitle>
                            <DollarSign className="h-5 w-5 text-sky-600" />
                        </CardHeader>
                        <CardContent>
                            {revenueLoading ? (
                                <Skeleton className="h-10 w-28" />
                            ) : (
                                <div className="text-3xl font-semibold text-gray-900">
                                    {formatCurrency(monthlyRevenue, currency)}
                                </div>
                            )}
                            <p className="mt-2 text-xs text-gray-600">Mesečni prihod</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700">Uspešne transakcije</CardTitle>
                            <ShieldCheck className="h-5 w-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            {paymentStatsLoading ? (
                                <Skeleton className="h-10 w-24" />
                            ) : (
                                <div className="text-3xl font-semibold text-gray-900">
                                    {formatNumber(successfulPayments)}
                                </div>
                            )}
                            <p className="mt-2 text-xs text-gray-600">Uspela plaćanja</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700">Prosečna uplata</CardTitle>
                            <PieChart className="h-5 w-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            {paymentStatsLoading ? (
                                <Skeleton className="h-10 w-24" />
                            ) : (
                                <div className="text-3xl font-semibold text-gray-900">
                                    {formatCurrency(averagePayment, currency)}
                                </div>
                            )}
                            <p className="mt-2 text-xs text-gray-600">Prosek po transakciji</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Pretraži po imenu ili email adresi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none placeholder:text-gray-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 text-sm text-sky-950 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none"
                        >
                            <option value="all">Sve pretplate</option>
                            <option value="active">Aktivne</option>
                            <option value="inactive">Neaktivne</option>
                        </select>
                    </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    {subscriptionsLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : filteredSubscriptions.length === 0 ? (
                        <div className="p-12 text-center">
                            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-600 mb-4">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Nema pretplata koje odgovaraju filterima'
                                    : 'Nema registrovanih pretplata'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Korisnik</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Telefon</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tip pretplate</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Iznos</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Datum plaćanja</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Isticanje pretplate</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredSubscriptions.map((subscription) => {
                                        // Determine if we have user contact info
                                        const userName = subscription.userName ||
                                            `${subscription.userFirstName || ''} ${subscription.userLastName || ''}`.trim() ||
                                            subscription.userEmail ||
                                            'Nepoznato';

                                        const userPhone = subscription.userId ? userPhoneMap.get(subscription.userId) : undefined;

                                        return (
                                            <tr key={subscription.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                {/* User Name */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-gray-900">{userName}</p>
                                                </td>

                                                {/* Email */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">{subscription.userEmail || '-'}</p>
                                                </td>

                                                {/* Phone */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">{userPhone || '-'}</p>
                                                </td>

                                                {/* Subscription Type */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">{getSubscriptionTypeName(subscription.type)}</p>
                                                </td>

                                                {/* Amount */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(subscription.priceInRsd, currency)}
                                                    </p>
                                                </td>

                                                {/* Payment Date */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">
                                                        {formatDate(subscription.activatedAt || subscription.startDate || subscription.createdAt)}
                                                    </p>
                                                </td>

                                                {/* Expiration Date */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">{formatDate(subscription.endDate)}</p>
                                                    {subscription.daysRemaining != null && subscription.daysRemaining > 0 && (
                                                        <p className="text-xs text-gray-500">
                                                            ({subscription.daysRemaining} {subscription.daysRemaining === 1 ? 'dan' : 'dana'} preostalo)
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3">
                                                    {getStatusBadge(subscription)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
