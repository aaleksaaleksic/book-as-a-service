'use client';

import { useMemo, useState } from 'react';
import {
    Users,
    ShieldCheck,
    Activity,
    Search,
    Filter,
    Crown,
    PhoneCall,
    CheckCircle2,
    UserX,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    useAdminUsers,
    useAdminSubscriptions,
    useAdminSubscriptionStats,
    useCancelSubscription,
} from '@/hooks/use-admin';
import { useCan } from '@/hooks/useAuth';
import type { AdminSubscription, AdminUser } from '@/types/admin';

const FALLBACK_ACCENTS = ['bg-reading-accent', 'bg-emerald-500', 'bg-cyan-500', 'bg-amber-500'];

const getInitials = (user: AdminUser) => {
    const first = user.firstName?.[0] ?? user.fullName?.[0] ?? user.email?.[0] ?? '?';
    const last = user.lastName?.[0] ?? user.fullName?.split(' ')?.[1]?.[0] ?? '';
    return `${first}${last}`.toUpperCase();
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('sr-RS', { style: 'currency', currency: 'RSD' }).format(Number.isFinite(value) ? value : 0);

const formatDate = (value?: string) => {
    if (!value) return 'Nepoznato';
    try {
        return format(new Date(value), 'dd.MM.yyyy.');
    } catch (error) {
        return value;
    }
};

const getSubscriptionHighlight = (subscription: AdminSubscription | undefined) => {
    if (!subscription) return 'bg-reading-accent/5 text-reading-text/70';

    if (subscription.status === 'ACTIVE' || subscription.isActive) {
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    }

    if (subscription.status === 'TRIAL') {
        return 'bg-amber-50 text-amber-600 border border-amber-200';
    }

    if (subscription.status === 'CANCELED' || subscription.isCanceled || subscription.isExpired) {
        return 'bg-rose-50 text-rose-600 border border-rose-200';
    }

    return 'bg-slate-100 text-slate-600 border border-slate-200';
};

export default function AdminUsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyActive, setShowOnlyActive] = useState(false);
    const { can } = useCan();

    const { data: users, isLoading: usersLoading, error: usersError } = useAdminUsers();
    const { data: subscriptionsData, isLoading: subscriptionsLoading } = useAdminSubscriptions();
    const { data: subscriptionStats, isLoading: statsLoading } = useAdminSubscriptionStats();
    const cancelSubscription = useCancelSubscription();

    const subscriptionMap = useMemo(() => {
        const map = new Map<number, AdminSubscription>();
        subscriptionsData?.subscriptions.forEach((subscription) => {
            map.set(subscription.userId, subscription);
        });
        return map;
    }, [subscriptionsData?.subscriptions]);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        const query = searchTerm.trim().toLowerCase();

        return users
            .filter((user) => {
                const subscription = subscriptionMap.get(user.id);
                if (showOnlyActive && !(subscription?.isActive || subscription?.status === 'ACTIVE')) {
                    return false;
                }

                if (!query) return true;

                return (
                    user.email?.toLowerCase().includes(query) ||
                    user.firstName?.toLowerCase().includes(query) ||
                    user.lastName?.toLowerCase().includes(query) ||
                    user.fullName?.toLowerCase().includes(query)
                );
            })
            .sort((a, b) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
            });
    }, [users, searchTerm, showOnlyActive, subscriptionMap]);

    const isLoading = usersLoading || subscriptionsLoading;

    const renderUserCard = (user: AdminUser, index: number) => {
        const subscription = subscriptionMap.get(user.id);
        const accent = FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length];
        const initials = getInitials(user);

        return (
            <Card
                key={user.id}
                className="relative overflow-hidden border border-reading-accent/10 bg-white/90 shadow-sm transition hover:shadow-lg"
            >
                <div className={cn('absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-20 blur-3xl', accent)} />
                <div className={cn('absolute -bottom-14 -left-10 h-28 w-28 rounded-full opacity-10 blur-3xl', accent)} />
                <CardContent className="relative z-10 space-y-4 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className={cn(
                                    'flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-lg shadow-reading-accent/20',
                                    accent,
                                )}
                            >
                                {initials}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-xl font-semibold text-reading-text">
                                        {user.fullName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email}
                                    </h3>
                                    {user.isAdmin && (
                                        <Badge className="bg-purple-100 text-purple-600">
                                            <Crown className="mr-1 h-3 w-3" /> Admin
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className="border-reading-accent/40 text-xs uppercase tracking-widest">
                                        {user.role}
                                    </Badge>
                                    {user.emailVerified && (
                                        <Badge className="bg-emerald-100 text-emerald-700">
                                            <CheckCircle2 className="mr-1 h-3 w-3" /> Email verifikovan
                                        </Badge>
                                    )}
                                    {user.phoneVerified && (
                                        <Badge className="bg-sky-100 text-sky-700">
                                            <PhoneCall className="mr-1 h-3 w-3" /> Telefon verifikovan
                                        </Badge>
                                    )}
                                </div>
                                <div className="mt-2 space-y-1 text-sm text-reading-text/70">
                                    <p>{user.email}</p>
                                    {user.phoneNumber && (
                                        <p className="flex items-center gap-1 text-xs uppercase tracking-wider">
                                            <PhoneCall className="h-3 w-3" /> {user.phoneNumber}
                                        </p>
                                    )}
                                    <p>Član od {formatDate(user.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 text-sm">
                            <Badge className={cn('px-3 py-1 text-xs font-semibold', getSubscriptionHighlight(subscription))}>
                                {subscription?.statusDescription || subscription?.status || 'Bez pretplate'}
                            </Badge>
                            {subscription?.priceInRsd && (
                                <p className="text-sm font-medium text-reading-text">
                                    {formatCurrency(Number(subscription.priceInRsd))} /{' '}
                                    {subscription.type?.toUpperCase() === 'YEARLY' ? 'god.' : 'mes.'}
                                </p>
                            )}
                            <p className="text-xs text-reading-text/60">Poslednja aktivnost: {formatDate(user.lastLoginAt)}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl bg-reading-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-reading-text/80">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-reading-accent" />
                                <span>Dozvole: {user.permissions?.length ? user.permissions.length : 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-reading-accent" />
                                <span>Status pretplate: {subscription?.isActive ? 'Aktivna' : subscription?.statusDescription ?? 'Nema'}</span>
                            </div>
                            {subscription?.daysRemaining != null && (
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-reading-accent" />
                                    <span>{subscription.daysRemaining} dana preostalo</span>
                                </div>
                            )}
                        </div>
                        {subscription && can('CAN_CANCEL_SUBSCRIPTION') && (
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={cancelSubscription.isPending}
                                onClick={() => {
                                    if (confirm('Da li ste sigurni da želite otkazati pretplatu ovog korisnika?')) {
                                        cancelSubscription.mutate(subscription.id);
                                    }
                                }}
                            >
                                <UserX className="mr-2 h-4 w-4" /> Otkazi pretplatu
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="rounded-3xl bg-reading-accent p-8 text-white shadow-lg">
                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.4em] text-white/70">Upravljanje korisnicima</p>
                        <h1 className={cn(dt.typography.pageTitle, 'text-white')}>Korisnici platforme</h1>
                        <p className="max-w-2xl text-sm text-white/80">
                            Analizirajte angažovanje, upravljajte pretplatama i reagujte brzo na potrebe čitalaca uz pregledne kartice i pametne filtere.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-none bg-white/90 shadow-lg shadow-reading-accent/10 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-reading-text/70">Ukupno korisnika</CardTitle>
                            <Users className="h-5 w-5 text-reading-accent" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-9 w-24" />
                            ) : (
                                <div className="text-3xl font-semibold text-reading-text">
                                    {subscriptionStats?.totalUsers ?? users?.length ?? 0}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white/90 shadow-lg shadow-emerald-200/40 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-reading-text/70">Aktivne pretplate</CardTitle>
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-9 w-24" />
                            ) : (
                                <div className="text-3xl font-semibold text-emerald-600">
                                    {subscriptionStats?.activeSubscriptions ?? subscriptionsData?.subscriptions.filter((sub) => sub.isActive)?.length ?? 0}
                                </div>
                            )}
                            <p className="mt-1 text-xs text-reading-text/60">Pretplate koje su trenutno aktivne</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white/90 shadow-lg shadow-amber-200/50 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-reading-text/70">Stopa konverzije</CardTitle>
                            <Activity className="h-5 w-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-9 w-24" />
                            ) : (
                                <div className="text-3xl font-semibold text-amber-600">
                                    {subscriptionStats ? `${subscriptionStats.conversionRate.toFixed(1)}%` : '0%'}
                                </div>
                            )}
                            <p className="mt-1 text-xs text-reading-text/60">Udeo korisnika sa aktivnom pretplatom</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur">
                    <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-reading-accent/10 bg-reading-surface/70 px-4 py-3 shadow-inner">
                            <Search className="h-4 w-4 text-reading-text/50" />
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Pretraži korisnike po imenu ili email adresi"
                                className="border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-reading-accent/10 bg-reading-surface/70 px-4 py-3 text-sm text-reading-text/80 shadow-inner">
                            <Filter className="h-4 w-4 text-reading-text/50" />
                            <span>Aktivne pretplate</span>
                            <Switch checked={showOnlyActive} onCheckedChange={setShowOnlyActive} />
                        </div>
                    </CardContent>
                </Card>

                {usersError ? (
                    <Alert variant="destructive">
                        <AlertDescription>
                            Nije moguće učitati korisnike. Proverite dozvole ili pokušajte ponovo kasnije.
                        </AlertDescription>
                    </Alert>
                ) : isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {[...Array(4)].map((_, index) => (
                            <Skeleton key={index} className="h-52 rounded-2xl" />
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <Card className="border border-dashed border-reading-accent/20 bg-white/70 py-16 text-center">
                        <Users className="mx-auto mb-4 h-12 w-12 text-reading-accent/30" />
                        <p className={cn(dt.typography.body, 'text-reading-text/70')}>
                            {searchTerm
                                ? 'Nema korisnika koji odgovaraju pretrazi.'
                                : 'Još uvek nema registrovanih korisnika sa aktivnim pretplatama.'}
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {filteredUsers.map((user, index) => renderUserCard(user, index))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
