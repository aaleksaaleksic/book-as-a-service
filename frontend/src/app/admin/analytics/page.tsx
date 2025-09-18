'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
    Activity,
    Users,
    Sparkles,
    BookOpen,
    LineChart,
    Timer,
    Target,
    Crown,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import {
    useAdminDashboardAnalytics,
    useAdminPopularBooks,
    useAdminMostReadBooks,
    useAdminTopReaders,
    useAdminUsers,
} from '@/hooks/use-admin';
import type { DashboardTrendBook } from '@/types/admin';

const formatMinutes = (minutes: number | undefined) => {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = minutes / 60;
    return `${hours.toFixed(1)} h`;
};

const computeMaxValue = (items: DashboardTrendBook[], key: 'totalClicks' | 'totalReadingMinutes') => {
    return items.reduce((max, item) => {
        const value = Number(item[key] ?? 0);
        return value > max ? value : max;
    }, 0) || 1;
};

export default function AdminAnalyticsPage() {
    const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboardAnalytics();
    const { data: popularBooks, isLoading: popularLoading } = useAdminPopularBooks();
    const { data: mostReadBooks, isLoading: mostReadLoading } = useAdminMostReadBooks();
    const { data: topReadersData, isLoading: topReadersLoading } = useAdminTopReaders();
    const { data: users } = useAdminUsers();

    const userMap = useMemo(() => {
        const map = new Map<number, string>();
        users?.forEach((user) => {
            map.set(user.id, user.fullName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email);
        });
        return map;
    }, [users]);

    const topReaders = useMemo(() => {
        return (topReadersData?.readers ?? []).map((reader, index) => ({
            ...reader,
            label: userMap.get(reader.userId) ?? `Korisnik #${reader.userId}`,
            accent: index === 0 ? 'from-amber-400 to-orange-500' : index === 1 ? 'from-purple-400 to-indigo-500' : 'from-emerald-400 to-reading-accent',
        }));
    }, [topReadersData?.readers, userMap]);

    const mostReadMax = computeMaxValue(mostReadBooks?.books ?? [], 'totalReadingMinutes');
    const popularMax = computeMaxValue(popularBooks?.books ?? [], 'totalClicks');

    const metricConfig: Array<{ key: 'totalClicks' | 'totalReadingMinutes' | 'totalReadingHours' | 'uniqueReaders'; title: string; subtitle: string; icon: ReactNode; format?: (value: number) => string }> = [
        {
            key: 'totalClicks',
            title: 'Današnje interakcije',
            subtitle: 'Klikovi na naslove tokom dana',
            icon: <Activity className="h-5 w-5 text-emerald-500" />,
        },
        {
            key: 'totalReadingMinutes',
            title: 'Minuta čitanja',
            subtitle: 'Ukupno vreme provedeno u knjigama',
            icon: <Timer className="h-5 w-5 text-emerald-500" />,
        },
        {
            key: 'totalReadingHours',
            title: 'Sati čitanja',
            subtitle: 'Ekstrahovano iz današnjeg angažmana',
            icon: <LineChart className="h-5 w-5 text-emerald-500" />,
            format: (value) => value.toFixed(1),
        },
        {
            key: 'uniqueReaders',
            title: 'Jedinstveni čitaoci',
            subtitle: 'Broj korisnika koji su čitali danas',
            icon: <Users className="h-5 w-5 text-emerald-500" />,
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-reading-accent via-book-green-100 to-cyan-500 p-8 text-white shadow-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),transparent_65%)]" />
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.5em] text-white/70">
                            <Sparkles className="h-4 w-4" />
                            Superinteligentna analitika
                        </div>
                        <h1 className={cn(dt.typography.pageTitle, 'text-white')}>Analitika & performanse</h1>
                        <p className="max-w-3xl text-sm text-white/80">
                            Dubinski uvid u ponašanje čitalaca, popularnost naslova i trendove čitanja. Svaki podatak je dizajniran da inspiriše sledeći strateški potez.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {metricConfig.map(({ key, title, subtitle, icon, format }) => {
                        const metricValue = (dashboard?.today?.[key] as number | undefined) ?? 0;
                        return (
                            <Card key={key} className="border-none bg-white/90 shadow-lg shadow-reading-accent/15 backdrop-blur">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-semibold text-reading-text/70">{title}</CardTitle>
                                    {icon}
                                </CardHeader>
                                <CardContent>
                                    {dashboardLoading ? (
                                        <Skeleton className="h-9 w-24" />
                                    ) : (
                                        <div className="text-3xl font-semibold text-reading-text">
                                            {format ? format(metricValue) : metricValue}
                                        </div>
                                    )}
                                    <p className="mt-2 text-xs text-reading-text/60">{subtitle}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur lg:col-span-2">
                        <CardHeader className="flex flex-col gap-2 pb-4">
                            <CardTitle className="text-lg font-semibold text-reading-text">Najčitanije knjige</CardTitle>
                            <p className="text-sm text-reading-text/60">Naslovi sa najviše provedenog vremena u poslednjih 30 dana.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {mostReadLoading ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, index) => (
                                        <Skeleton key={index} className="h-16 rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {(mostReadBooks?.books ?? []).map((book, index) => {
                                        const progress = Math.round(((book.totalReadingMinutes ?? 0) / mostReadMax) * 100);
                                        return (
                                            <div
                                                key={book.bookId}
                                                className="relative overflow-hidden rounded-2xl border border-reading-accent/10 bg-reading-surface/80 p-4 shadow-inner"
                                            >
                                                <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-reading-accent to-emerald-500" />
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className="bg-reading-accent/10 text-reading-accent">#{index + 1}</Badge>
                                                            <p className="font-semibold text-reading-text">{book.title}</p>
                                                        </div>
                                                        <p className="text-xs text-reading-text/60">{book.author}</p>
                                                    </div>
                                                    <div className="text-right text-sm text-reading-text/80">
                                                        <p>{formatMinutes(book.totalReadingMinutes)}</p>
                                                        <p className="text-xs text-reading-text/50">{book.totalReadingHours?.toFixed?.(1) ?? '0.0'} h</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-reading-accent/10">
                                                    <div className="h-full rounded-full bg-gradient-to-r from-reading-accent via-emerald-500 to-emerald-400" style={{ width: `${progress}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur">
                        <CardHeader className="flex flex-col gap-2 pb-4">
                            <CardTitle className="text-lg font-semibold text-reading-text">Najpopularniji naslovi</CardTitle>
                            <p className="text-sm text-reading-text/60">Naslovi sa najviše klikova i interesovanja u poslednjih 30 dana.</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {popularLoading ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, index) => (
                                        <Skeleton key={index} className="h-14 rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {(popularBooks?.books ?? []).map((book) => {
                                        const progress = Math.round(((book.totalClicks ?? 0) / popularMax) * 100);
                                        return (
                                            <div key={book.bookId} className="rounded-2xl border border-reading-accent/10 bg-reading-accent/5 px-4 py-3">
                                                <div className="flex items-center justify-between text-sm text-reading-text/80">
                                                    <div>
                                                        <p className="font-semibold text-reading-text">{book.title}</p>
                                                        <p className="text-xs text-reading-text/60">{book.author}</p>
                                                    </div>
                                                    <Badge className="bg-white text-reading-accent shadow">{book.totalClicks ?? 0} klikova</Badge>
                                                </div>
                                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/40">
                                                    <div className="h-full rounded-full bg-reading-accent" style={{ width: `${progress}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur">
                        <CardHeader className="flex flex-col gap-2 pb-4">
                            <CardTitle className="text-lg font-semibold text-reading-text">Top čitaoci</CardTitle>
                            <p className="text-sm text-reading-text/60">Najposvećeniji korisnici po ukupnom vremenu čitanja.</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {topReadersLoading ? (
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, index) => (
                                        <Skeleton key={index} className="h-16 rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topReaders.map((reader, index) => (
                                        <div key={reader.userId} className="flex items-center justify-between rounded-2xl border border-reading-accent/10 bg-reading-surface/80 px-4 py-3 shadow-inner">
                                            <div className="flex items-center gap-3">
                                                <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-semibold text-white shadow', reader.accent)}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-reading-text">{reader.label}</p>
                                                    <p className="text-xs text-reading-text/60">{formatMinutes(reader.totalReadingMinutes)}</p>
                                                </div>
                                            </div>
                                            <Badge className="bg-reading-accent/10 text-reading-accent">
                                                {reader.totalReadingHours.toFixed(1)} h
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-reading-accent/10 bg-gradient-to-br from-reading-accent/5 via-white to-white/90 p-6 shadow-inner lg:col-span-2">
                        <CardHeader className="space-y-2 pb-4">
                            <CardTitle className="text-lg font-semibold text-reading-text">Strategijski uvidi</CardTitle>
                            <p className="text-sm text-reading-text/60">Automatske preporuke bazirane na aktivnostima korisnika.</p>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-reading-accent/10 bg-white/80 p-4 shadow">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-reading-text/50">
                                    <Target className="h-3.5 w-3.5 text-reading-accent" /> Fokus
                                </div>
                                <p className="mt-3 text-sm font-semibold text-reading-text">
                                    Naslovi iz top 5 najčitanijih knjiga generišu najveći deo angažmana – predložite slične premium naslove.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-reading-accent/10 bg-white/80 p-4 shadow">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-reading-text/50">
                                    <Crown className="h-3.5 w-3.5 text-amber-500" /> VIP čitaoci
                                </div>
                                <p className="mt-3 text-sm font-semibold text-reading-text">
                                    Nagradite top čitaoce ekskluzivnim sadržajem – njihova lojalnost podiže ukupni broj sati čitanja.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-reading-accent/10 bg-white/80 p-4 shadow md:col-span-2">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-reading-text/50">
                                    <BookOpen className="h-3.5 w-3.5 text-reading-accent" /> Momentum kataloga
                                </div>
                                <p className="mt-3 text-sm font-semibold text-reading-text">
                                    Najpopularniji naslovi beleže visok broj klikova – istaknite ih na naslovnoj strani i u newsletter kampanjama kako biste kapitalizovali interesovanje.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
