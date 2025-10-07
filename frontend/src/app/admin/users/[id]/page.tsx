'use client';

import { useParams, useRouter } from 'next/navigation';
import {
    User,
    Mail,
    Phone,
    Calendar,
    ShieldCheck,
    Crown,
    CheckCircle2,
    ArrowLeft,
    CreditCard,
    Clock,
    TrendingUp,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminUsers, useUserSubscriptions } from '@/hooks/use-admin';
import { format } from 'date-fns';
import type { AdminSubscription } from '@/types/admin';
import { useMemo } from 'react';

const formatDate = (value?: string) => {
    if (!value) return '-';
    try {
        return format(new Date(value), 'dd.MM.yyyy. HH:mm');
    } catch (error) {
        return value;
    }
};

const formatCurrency = (value: number | string | undefined, currency: string = 'RSD') => {
    const numeric = typeof value === 'string' ? Number(value) : value;
    return new Intl.NumberFormat('sr-RS', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
    }).format(Number.isFinite(numeric) ? numeric : 0);
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
        return <Badge className="bg-green-100 text-green-800">Aktivna</Badge>;
    }
    if (subscription.status === 'CANCELED' || subscription.isCanceled) {
        return <Badge className="bg-red-100 text-red-800">Otkazana</Badge>;
    }
    if (subscription.status === 'EXPIRED' || subscription.isExpired) {
        return <Badge className="bg-red-100 text-red-800">Istekla</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">{subscription.status}</Badge>;
};

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = Number(params.id);

    const { data: usersData, isLoading: usersLoading } = useAdminUsers();
    const { data: subscriptionsData, isLoading: subscriptionsLoading } = useUserSubscriptions(userId);

    const user = useMemo(() => {
        return usersData?.users.find(u => u.id === userId);
    }, [usersData?.users, userId]);

    const userSubscriptions = useMemo(() => {
        if (!subscriptionsData?.subscriptions) return [];

        // Subscriptions are already sorted by date from the backend (DESC)
        return subscriptionsData.subscriptions;
    }, [subscriptionsData?.subscriptions]);

    const activeSubscription = useMemo(() => {
        return userSubscriptions.find(sub => sub.isActive || sub.status === 'ACTIVE');
    }, [userSubscriptions]);

    const totalSpent = useMemo(() => {
        return userSubscriptions
            .filter(sub => sub.status === 'ACTIVE' || sub.status === 'EXPIRED' || sub.status === 'CANCELED')
            .reduce((sum, sub) => sum + (Number(sub.priceInRsd) || 0), 0);
    }, [userSubscriptions]);

    if (usersLoading || subscriptionsLoading) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <Skeleton className="h-12 w-64" />
                    <div className="grid gap-6 md:grid-cols-3">
                        <Skeleton className="h-48" />
                        <Skeleton className="h-48" />
                        <Skeleton className="h-48" />
                    </div>
                    <Skeleton className="h-96" />
                </div>
            </AdminLayout>
        );
    }

    if (!user) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <User className="w-16 h-16 text-gray-300" />
                    <h2 className="text-2xl font-bold text-gray-900">Korisnik nije pronađen</h2>
                    <Button onClick={() => router.push('/admin/users')} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Nazad na listu korisnika
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.push('/admin/users')}
                            variant="outline"
                            size="sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Nazad
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Detalji korisnika</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Pregled informacija i istorija plaćanja
                            </p>
                        </div>
                    </div>
                </div>

                {/* User Info Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Basic Info Card */}
                    <Card className="border-none bg-white shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-sky-600" />
                                Osnovni podaci
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <p className="text-lg font-semibold text-gray-900">{fullName}</p>
                                    {user.isAdmin && (
                                        <Badge className="bg-purple-100 text-purple-800">
                                            <Crown className="w-3 h-3 mr-1" />
                                            Admin
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">{user.role}</p>
                            </div>

                            <div className="space-y-3 pt-3 border-t">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-gray-900">{user.email}</p>
                                        {user.emailVerified && (
                                            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Verifikovan
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {user.phoneNumber && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <div className="flex-1">
                                            <p className="text-gray-900">{user.phoneNumber}</p>
                                            {user.phoneVerified && (
                                                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Verifikovan
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Član od</p>
                                        <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                                    </div>
                                </div>

                                {user.lastLoginAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Poslednja aktivnost</p>
                                            <p className="text-gray-900">{formatDate(user.lastLoginAt)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t">
                                {user.active !== false ? (
                                    <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Aktivan nalog
                                    </Badge>
                                ) : (
                                    <Badge className="bg-red-100 text-red-800">
                                        Neaktivan nalog
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Current Subscription Card */}
                    <Card className="border-none bg-white shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                Trenutna pretplata
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {activeSubscription ? (
                                <>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Tip pretplate</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {getSubscriptionTypeName(activeSubscription.type)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Status</p>
                                        {getStatusBadge(activeSubscription)}
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Iznos</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {formatCurrency(activeSubscription.priceInRsd)}
                                        </p>
                                    </div>

                                    {activeSubscription.endDate && (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Ističe</p>
                                            <p className="text-gray-900">{formatDate(activeSubscription.endDate)}</p>
                                            {activeSubscription.daysRemaining != null && activeSubscription.daysRemaining > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    ({activeSubscription.daysRemaining} {activeSubscription.daysRemaining === 1 ? 'dan' : 'dana'} preostalo)
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm text-gray-600">Nema aktivne pretplate</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card className="border-none bg-white shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-amber-600" />
                                Statistika
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Ukupno potrošeno</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(totalSpent)}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-1">Broj pretplata</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {userSubscriptions.length}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-1">Broj dozvola</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {user.permissions?.length || 0}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payments History Table */}
                <Card className="border-none bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-sky-600" />
                            Istorija plaćanja
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {userSubscriptions.length === 0 ? (
                            <div className="text-center py-12">
                                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-600">Nema istorije plaćanja</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Datum plaćanja
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Tip pretplate
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Iznos
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Period važenja
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Način plaćanja
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {userSubscriptions.map((subscription) => (
                                            <tr key={subscription.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-900">
                                                        {formatDate(subscription.activatedAt || subscription.startDate || subscription.createdAt)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-900">
                                                        {getSubscriptionTypeName(subscription.type)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(subscription.priceInRsd)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-900">
                                                        <p>{formatDate(subscription.startDate)}</p>
                                                        <p className="text-xs text-gray-500">do {formatDate(subscription.endDate)}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getStatusBadge(subscription)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">
                                                        {subscription.paymentMethod || '-'}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
