'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import {
    useAdminPaymentRevenue,
    useAdminPaymentStats,
    useAdminSubscriptionStats,
    useAdminUsers,
} from '@/hooks/use-admin';
import { Settings, ShieldCheck, Palette, Zap, ExternalLink } from 'lucide-react';

const formatCurrency = (value: number, currency: string) =>
    new Intl.NumberFormat('sr-RS', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);

export default function AdminSettingsPage() {
    const { data: revenueData, isLoading: revenueLoading } = useAdminPaymentRevenue();
    const { data: paymentStats, isLoading: paymentLoading } = useAdminPaymentStats();
    const { data: subscriptionStats, isLoading: subscriptionLoading } = useAdminSubscriptionStats();
    const { data: users, isLoading: usersLoading } = useAdminUsers();

    const currency = revenueData?.currency ?? paymentStats?.stats.currency ?? 'RSD';
    const totalRevenue = revenueData?.totalRevenue ?? paymentStats?.stats.totalRevenue ?? 0;
    const activeSubscriptions = subscriptionStats?.activeSubscriptions ?? 0;
    const totalUsers = subscriptionStats?.totalUsers ?? users?.length ?? 0;
    const conversionRate = subscriptionStats?.conversionRate ?? 0;

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-reading-accent via-book-green-100 to-book-green-600 p-8 text-white shadow-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),transparent_60%)]" />
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.4em] text-white/70">
                            <Settings className="h-4 w-4" />
                            Kontrolni centar
                        </div>
                        <h1 className={cn(dt.typography.pageTitle, 'text-white')}>Podešavanja i organizacija</h1>
                        <p className="max-w-3xl text-sm text-white/80">
                            Centralizovana kontrola dizajna, bezbednosti i poslovnih parametara. Prilagodite Readify iskustvo jednom akcijom.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur">
                        <CardHeader className="flex items-center justify-between pb-4">
                            <CardTitle className="text-lg font-semibold text-reading-text">Poslovni puls</CardTitle>
                            <Zap className="h-5 w-5 text-reading-accent" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {revenueLoading || paymentLoading ? (
                                <Skeleton className="h-24 rounded-2xl" />
                            ) : (
                                <div className="space-y-3">
                                    <div className="rounded-2xl border border-reading-accent/10 bg-reading-accent/5 px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Ukupni prihod</p>
                                        <p className="text-2xl font-semibold text-reading-text">{formatCurrency(totalRevenue ?? 0, currency)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-reading-accent/10 bg-white px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Aktivne pretplate</p>
                                        <p className="text-lg font-semibold text-reading-text">{activeSubscriptions}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur lg:col-span-2">
                        <CardHeader className="flex items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-lg font-semibold text-reading-text">Brzi prečice</CardTitle>
                                <p className="text-sm text-reading-text/60">Najvažnije administratorske akcije na dohvat ruke.</p>
                            </div>
                            <Badge className="bg-reading-accent/10 text-reading-accent">Produktivnost</Badge>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            {[
                                { href: '/admin/books', title: 'Knjige', description: 'Upravljanje katalogom i metapodacima' },
                                { href: '/admin/analytics', title: 'Analitika', description: 'Pratite trendove čitanja i angažman' },
                                { href: '/admin/payments', title: 'Plaćanja', description: 'Finansijski tokovi i pretplate' },
                            ].map((item) => (
                                <Link key={item.href} href={item.href} className="group">
                                    <div className="flex h-full flex-col justify-between rounded-2xl border border-reading-accent/10 bg-reading-surface/80 p-4 shadow-inner transition-all hover:-translate-y-1 hover:border-reading-accent/30">
                                        <div>
                                            <p className="text-sm font-semibold text-reading-text">{item.title}</p>
                                            <p className="mt-1 text-xs text-reading-text/60">{item.description}</p>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-xs text-reading-accent">
                                            Otvori
                                            <ExternalLink className="h-3 w-3" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur">
                        <CardHeader className="flex items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-lg font-semibold text-reading-text">Bezbednosne politike</CardTitle>
                                <p className="text-sm text-reading-text/60">Zaštita korisnika i sadržaja je prioritet.</p>
                            </div>
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[{
                                label: 'Dvofaktorska autentikacija', description: 'Omogućeno za sve administratore', active: true,
                            }, {
                                label: 'Ograničen pristup API-ju', description: 'Pristup dozvoljen samo verifikovanim aplikacijama', active: true,
                            }, {
                                label: 'Automatske revizije', description: 'Dnevna provera aktivnosti i neobičnih obrazaca', active: false,
                            }].map((item) => (
                                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-reading-accent/10 bg-reading-surface/80 px-4 py-3 shadow-inner">
                                    <div>
                                        <p className="text-sm font-semibold text-reading-text">{item.label}</p>
                                        <p className="text-xs text-reading-text/60">{item.description}</p>
                                    </div>
                                    <Switch checked={item.active} disabled className="data-[state=checked]:bg-reading-accent" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur">
                        <CardHeader className="flex items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-lg font-semibold text-reading-text">Iskustvo korisnika</CardTitle>
                                <p className="text-sm text-reading-text/60">Upravljajte brend identitetom i komunikacijom.</p>
                            </div>
                            <Palette className="h-5 w-5 text-amber-500" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-2xl border border-reading-accent/10 bg-reading-surface/80 px-4 py-3 shadow-inner">
                                <div>
                                    <p className="text-sm font-semibold text-reading-text">Tema interfejsa</p>
                                    <p className="text-xs text-reading-text/60">Trenutno: svetla</p>
                                </div>
                                <Badge className="bg-reading-accent/10 text-reading-accent">Automatski</Badge>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-reading-accent/10 bg-reading-surface/80 px-4 py-3 shadow-inner">
                                <div>
                                    <p className="text-sm font-semibold text-reading-text">Obaveštenja o novim knjigama</p>
                                    <p className="text-xs text-reading-text/60">Automatski email za pretplatnike</p>
                                </div>
                                <Switch checked disabled className="data-[state=checked]:bg-reading-accent" />
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-reading-accent/10 bg-reading-surface/80 px-4 py-3 shadow-inner">
                                <div>
                                    <p className="text-sm font-semibold text-reading-text">Brendiranje mobilne aplikacije</p>
                                    <p className="text-xs text-reading-text/60">Logo i boje usklađeni sa Readify identitetom</p>
                                </div>
                                <Switch checked disabled className="data-[state=checked]:bg-reading-accent" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border border-reading-accent/10 bg-gradient-to-r from-reading-accent/5 via-white to-white/90 p-6 shadow-inner">
                    <CardHeader className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold text-reading-text">Sažetak platforme</CardTitle>
                            <p className="text-sm text-reading-text/60">Pregled ključnih brojki koje oblikuju vaše odluke.</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-600">Ažurirano u realnom vremenu</Badge>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-3">
                        {subscriptionLoading || usersLoading ? (
                            <Skeleton className="h-20 rounded-2xl" />
                        ) : (
                            <div className="rounded-2xl border border-reading-accent/10 bg-white/80 px-4 py-3 shadow">
                                <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Ukupno korisnika</p>
                                <p className="text-xl font-semibold text-reading-text">{totalUsers}</p>
                            </div>
                        )}
                        {subscriptionLoading ? (
                            <Skeleton className="h-20 rounded-2xl" />
                        ) : (
                            <div className="rounded-2xl border border-reading-accent/10 bg-white/80 px-4 py-3 shadow">
                                <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Aktivne pretplate</p>
                                <p className="text-xl font-semibold text-reading-text">{activeSubscriptions}</p>
                            </div>
                        )}
                        <div className="rounded-2xl border border-reading-accent/10 bg-white/80 px-4 py-3 shadow">
                            <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Stopa konverzije</p>
                            <p className="text-xl font-semibold text-reading-text">{conversionRate.toFixed(1)}%</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
