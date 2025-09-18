'use client';

import { useMemo } from 'react';
import {
    DollarSign,
    TrendingUp,
    PieChart,
    ShieldCheck,
    BarChart3,
    ArrowUpRight,
    CalendarDays,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import {
    useAdminPaymentRevenue,
    useAdminPaymentStats,
    useAdminSubscriptionStats,
    useAdminSubscriptions,
} from '@/hooks/use-admin';
import type { AdminSubscription } from '@/types/admin';

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

const describeSubscription = (subscription: AdminSubscription) => {
    const period = subscription.type?.toUpperCase() === 'YEARLY' ? 'Godišnja' : subscription.type?.toUpperCase() === 'TRIAL' ? 'Probna' : 'Mesečna';
    const status = subscription.statusDescription || subscription.status;
    return `${period} • ${status}`;
};

export default function AdminPaymentsPage() {
    const { data: revenueData, isLoading: revenueLoading } = useAdminPaymentRevenue();
    const { data: paymentStatsData, isLoading: paymentStatsLoading } = useAdminPaymentStats();
    const { data: subscriptionStats, isLoading: subscriptionStatsLoading } = useAdminSubscriptionStats();
    const { data: subscriptionsData, isLoading: subscriptionsLoading } = useAdminSubscriptions();

    const currency = revenueData?.currency ?? paymentStatsData?.stats.currency ?? 'RSD';
    const stats = paymentStatsData?.stats;
    const insights = paymentStatsData?.insights;

    const featuredSubscriptions = useMemo(() => {
        if (!subscriptionsData?.subscriptions?.length) return [];
        return [...subscriptionsData.subscriptions]
            .sort((a, b) => {
                const aDate = a.activatedAt || a.startDate;
                const bDate = b.activatedAt || b.startDate;
                const aTime = aDate ? new Date(aDate).getTime() : 0;
                const bTime = bDate ? new Date(bDate).getTime() : 0;
                return bTime - aTime;
            })
            .slice(0, 6);
    }, [subscriptionsData?.subscriptions]);

    const totalRevenue = normalize(revenueData?.totalRevenue ?? stats?.totalRevenue);
    const monthlyRevenue = normalize(revenueData?.monthlyRevenue ?? stats?.monthlyRevenue);
    const successfulPayments = normalize(revenueData?.successfulPaymentsCount ?? stats?.successfulPayments);
    const averagePayment = normalize(stats?.averagePaymentAmount);

    const conversionRate = subscriptionStats?.conversionRate ?? 0;

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="rounded-3xl bg-reading-accent p-8 text-white shadow-xl">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.4em] text-white/70">
                            <DollarSign className="h-4 w-4" />
                            Finansijski puls
                        </div>
                        <h1 className={cn(dt.typography.pageTitle, 'text-white')}>Plaćanja & pretplate</h1>
                        <p className="max-w-3xl text-sm text-white/80">
                            Pratite promet, uočite trendove i donesite odluke zasnovane na podacima. Sve ključne metrike o monetizaciji na jednom mestu.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                    <Card className="border-none bg-white/90 shadow-lg shadow-emerald-200/40 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-reading-text/70">Ukupni prihod</CardTitle>
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            {revenueLoading ? (
                                <Skeleton className="h-10 w-28" />
                            ) : (
                                <div className="text-3xl font-semibold text-reading-text">
                                    {formatCurrency(totalRevenue, currency)}
                                </div>
                            )}
                            <p className="mt-2 text-xs text-reading-text/60">Kumulativno od lansiranja</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white/90 shadow-lg shadow-reading-accent/15 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-reading-text/70">Prihod ovog meseca</CardTitle>
                            <BarChart3 className="h-5 w-5 text-reading-accent" />
                        </CardHeader>
                        <CardContent>
                            {revenueLoading ? (
                                <Skeleton className="h-10 w-28" />
                            ) : (
                                <div className="text-3xl font-semibold text-reading-text">
                                    {formatCurrency(monthlyRevenue, currency)}
                                </div>
                            )}
                            <div className="mt-2 flex items-center gap-2 text-xs text-reading-text/60">
                                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                <span>+{formatNumber(averagePayment ? monthlyRevenue / Math.max(averagePayment, 1) : monthlyRevenue)} novih uplata</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white/90 shadow-lg shadow-indigo-200/30 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-reading-text/70">Uspešne transakcije</CardTitle>
                            <ShieldCheck className="h-5 w-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            {paymentStatsLoading ? (
                                <Skeleton className="h-10 w-24" />
                            ) : (
                                <div className="text-3xl font-semibold text-reading-text">
                                    {formatNumber(successfulPayments)}
                                </div>
                            )}
                            <p className="mt-2 text-xs text-reading-text/60">Uspela plaćanja u ukupnom periodu</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white/90 shadow-lg shadow-amber-200/40 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-reading-text/70">Prosečna uplata</CardTitle>
                            <PieChart className="h-5 w-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            {paymentStatsLoading ? (
                                <Skeleton className="h-10 w-24" />
                            ) : (
                                <div className="text-3xl font-semibold text-amber-600">
                                    {formatCurrency(averagePayment, currency)}
                                </div>
                            )}
                            <p className="mt-2 text-xs text-reading-text/60">Prosek po uspešnoj transakciji</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur lg:col-span-2">
                        <CardHeader className="flex flex-col gap-1 pb-4">
                            <CardTitle className="text-lg font-semibold text-reading-text">Momentum rasta</CardTitle>
                            <p className="text-sm text-reading-text/60">
                                Vizuelni prikaz odnosa između ukupnog i mesečnog prihoda, kao i stope konverzije pretplata.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                    <div className="flex items-center justify-between text-sm text-reading-text/70">
                                        <span>Ostvareno ovaj mesec</span>
                                        <span>{formatCurrency(monthlyRevenue, currency)}</span>
                                    </div>
                                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-reading-accent/10">
                                        <div
                                            className="h-full rounded-full bg-reading-accent"
                                            style={{ width: `${Math.min(100, totalRevenue ? (monthlyRevenue / totalRevenue) * 100 : 0)}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-sm text-reading-text/70">
                                        <span>Stopa konverzije</span>
                                        <span>{conversionRate.toFixed(1)}%</span>
                                    </div>
                                    <div className="mt-2 flex h-24 items-end gap-2 rounded-2xl bg-reading-accent/5 p-4">
                                        {[25, 45, 65, conversionRate].map((value, index) => (
                                            <div key={index} className="flex-1">
                                                <div
                                                    className="w-full rounded-xl bg-reading-accent"
                                                    style={{ height: `${Math.max(12, Math.min(100, value))}%` }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {insights && (
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-reading-accent/10 bg-reading-accent/5 p-4 text-sm text-reading-text/80">
                                        <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Trend</p>
                                        <p className="mt-2 text-lg font-semibold text-reading-text">{insights.revenueGrowth === 'positive' ? 'Pozitivan rast' : 'Stabilno'}</p>
                                        <p className="mt-1 text-xs text-reading-text/60">Prihod pokazuje {insights.revenueGrowth === 'positive' ? 'uzlazni trend u odnosu na prošli mesec.' : 'stabilne performanse.'}</p>
                                    </div>
                                    <div className="rounded-2xl border border-reading-accent/10 bg-emerald-50 p-4 text-sm text-emerald-700">
                                        <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Stopa uspeha</p>
                                        <p className="mt-2 text-lg font-semibold">{insights.paymentSuccessRate}</p>
                                        <p className="mt-1 text-xs text-emerald-600">Transakcije prolaze uz minimalne neuspehe.</p>
                                    </div>
                                    <div className="rounded-2xl border border-reading-accent/10 bg-white p-4 text-sm text-reading-text/80 shadow-inner">
                                        <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Top metoda</p>
                                        <p className="mt-2 text-lg font-semibold text-reading-text">{insights.primaryPaymentMethod}</p>
                                        <p className="mt-1 text-xs text-reading-text/60">Najčešće korišćen način plaćanja korisnika.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur">
                        <CardHeader className="flex flex-col gap-1 pb-4">
                            <CardTitle className="text-lg font-semibold text-reading-text">Aktivne pretplate</CardTitle>
                            <p className="text-sm text-reading-text/60">Najskorije aktivirane pretplate koje generišu prihod.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {subscriptionsLoading ? (
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, index) => (
                                        <Skeleton key={index} className="h-16 rounded-xl" />
                                    ))}
                                </div>
                            ) : featuredSubscriptions.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-reading-accent/20 bg-reading-accent/5 p-8 text-center text-sm text-reading-text/60">
                                    Nema aktivnih pretplata u poslednjem periodu.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {featuredSubscriptions.map((subscription) => (
                                        <div key={subscription.id} className="flex items-center justify-between rounded-2xl border border-reading-accent/10 bg-reading-surface/80 px-4 py-3 shadow-inner">
                                            <div>
                                                <p className="text-sm font-semibold text-reading-text">{subscription.userName || subscription.userEmail}</p>
                                                <p className="text-xs text-reading-text/60">{describeSubscription(subscription)}</p>
                                            </div>
                                            <div className="text-right text-sm font-semibold text-reading-text">
                                                {formatCurrency(subscription.priceInRsd, currency)}
                                                <p className="mt-1 text-xs text-reading-text/50 flex items-center justify-end gap-1">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('sr-RS') : 'Nepoznato'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border border-reading-accent/10 bg-white p-6 shadow-inner">
                        <CardHeader className="space-y-2 pb-4">
                            <CardTitle className="text-lg font-semibold text-reading-text">Sažetak KPI pokazatelja</CardTitle>
                            <p className="text-sm text-reading-text/60">Brzi pregled ključnih indikatora uspeha monetizacije.</p>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {subscriptionStatsLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, index) => (
                                        <Skeleton key={index} className="h-16 rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 shadow">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Stopa konverzije</p>
                                            <p className="text-lg font-semibold text-reading-text">{conversionRate.toFixed(1)}%</p>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-600">Stabilno</Badge>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 shadow">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Broj aktivnih pretplata</p>
                                            <p className="text-lg font-semibold text-reading-text">{subscriptionStats?.activeSubscriptions ?? 0}</p>
                                        </div>
                                        <Badge className="bg-reading-accent/10 text-reading-accent">+{formatNumber(subscriptionStats?.activeSubscriptions ?? 0)}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 shadow">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Ukupno korisnika</p>
                                            <p className="text-lg font-semibold text-reading-text">{subscriptionStats?.totalUsers ?? 0}</p>
                                        </div>
                                        <Badge className="bg-indigo-100 text-indigo-600">Bazni potencijal</Badge>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>


                </div>
            </div>
        </AdminLayout>
    );
}
