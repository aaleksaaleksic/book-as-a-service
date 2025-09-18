'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useBook } from '@/hooks/use-books';
import { useAdminBookAnalytics } from '@/hooks/use-admin';
import { resolveApiFileUrl } from '@/lib/asset-utils';
import {
    ArrowLeft,
    Edit,
    TrendingUp,
    Clock,
    Users,
    BarChart3,
} from 'lucide-react';

const FALLBACK_COVER_IMAGE = '/book-placeholder.svg';

const formatMinutes = (minutes: number | undefined) => {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    return `${(minutes / 60).toFixed(1)} h`;
};

export default function AdminBookDetailsPage() {
    const params = useParams();
    const bookId = Number(params?.id);
    const [range, setRange] = useState<7 | 30 | 90>(30);

    const endDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
    const startDate = useMemo(() => format(subDays(new Date(), range), 'yyyy-MM-dd'), [range]);

    const { data: book, isLoading: bookLoading, error: bookError } = useBook(bookId);
    const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useAdminBookAnalytics(bookId, startDate, endDate);

    const coverUrl = book?.coverImageUrl ? resolveApiFileUrl(book.coverImageUrl) : FALLBACK_COVER_IMAGE;

    const dailyMax = useMemo(() => {
        if (!analytics?.dailyAnalytics?.length) return 1;
        return analytics.dailyAnalytics.reduce((max, day) => (day.readingMinutes > max ? day.readingMinutes : max), 1);
    }, [analytics?.dailyAnalytics]);

    if (bookLoading) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <Skeleton className="h-64 rounded-3xl" />
                    <Skeleton className="h-48 rounded-3xl" />
                    <Skeleton className="h-64 rounded-3xl" />
                </div>
            </AdminLayout>
        );
    }

    if (bookError || !book) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <Alert variant="destructive">
                        <AlertDescription>Tražena knjiga nije pronađena ili nemate pristup.</AlertDescription>
                    </Alert>
                    <Button asChild variant="outline">
                        <Link href="/admin/books">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Nazad na listu knjiga
                        </Link>
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="rounded-3xl bg-reading-accent p-8 text-white shadow-xl">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-4">
                            <Link href="/admin/books" className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/70">
                                <ArrowLeft className="h-4 w-4" /> Nazad
                            </Link>
                            <div className="space-y-2">
                                <h1 className={cn(dt.typography.pageTitle, 'text-white')}>{book.title}</h1>
                                <p className="text-sm text-white/80">{book.author}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className="bg-white/10 text-white">{book.category}</Badge>
                                    <Badge className="bg-white/10 text-white">{book.language}</Badge>
                                    <Badge className="bg-white/10 text-white">{book.pages} str.</Badge>
                                    {book.isPremium ? (
                                        <Badge className="bg-amber-400 text-amber-900">Premium</Badge>
                                    ) : (
                                        <Badge className="bg-emerald-300 text-emerald-900">Besplatna</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" className="bg-white/20 text-white hover:bg-white/30">
                                    <Link href={`/admin/books/${book.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" /> Uredi knjigu
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <div className="relative h-40 w-28 overflow-hidden rounded-3xl border border-white/20 shadow-2xl lg:h-48 lg:w-32">
                            <img
                                src={coverUrl ?? FALLBACK_COVER_IMAGE}
                                alt={book.title}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                    event.currentTarget.src = FALLBACK_COVER_IMAGE;
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[{
                        title: 'Ukupno čitanja',
                        value: book.readCount ?? analytics?.book?.totalReads ?? 0,
                        icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
                        description: 'Broj započetih čitanja',
                    }, {
                        title: 'Vreme čitanja',
                        value: analytics?.statistics?.totalReadingMinutes ?? 0,
                        icon: <Clock className="h-5 w-5 text-emerald-500" />,
                        description: 'Ukupno minuta zabeleženo',
                        formatter: formatMinutes,
                    }, {
                        title: 'Jedinstveni čitaoci',
                        value: analytics?.statistics?.uniqueReaders ?? 0,
                        icon: <Users className="h-5 w-5 text-emerald-500" />,
                        description: 'Ukupan broj korisnika',
                    }, {
                        title: 'Prosečno trajanje',
                        value: analytics?.statistics?.averageSessionMinutes ?? 0,
                        icon: <BarChart3 className="h-5 w-5 text-emerald-500" />,
                        description: 'Prosečna sesija čitanja',
                        formatter: formatMinutes,
                    }].map((item) => (
                        <Card key={item.title} className="border-none bg-white/90 shadow-lg shadow-reading-accent/15 backdrop-blur">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-semibold text-reading-text/70">{item.title}</CardTitle>
                                {item.icon}
                            </CardHeader>
                            <CardContent>
                                {analyticsLoading ? (
                                    <Skeleton className="h-8 w-20" />
                                ) : (
                                    <div className="text-3xl font-semibold text-reading-text">
                                        {item.formatter ? item.formatter(item.value as number) : item.value}
                                    </div>
                                )}
                                <p className="mt-2 text-xs text-reading-text/60">{item.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur">
                    <CardHeader className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold text-reading-text">Trend čitanja</CardTitle>
                            <p className="text-sm text-reading-text/60">Analiza po danima za odabrani vremenski period.</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-reading-accent/20 bg-reading-accent/5 px-2 py-1 text-xs text-reading-text/80">
                            {[7, 30, 90].map((value) => (
                                <Button
                                    key={value}
                                    size="sm"
                                    variant={range === value ? 'default' : 'ghost'}
                                    className={cn('h-8 px-3 text-xs', range === value ? 'bg-reading-accent text-white hover:bg-reading-accent/90' : 'text-reading-text/70')}
                                    onClick={() => setRange(value as 7 | 30 | 90)}
                                >
                                    {value} dana
                                </Button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {analyticsLoading ? (
                            <div className="space-y-3">
                                {[...Array(4)].map((_, index) => (
                                    <Skeleton key={index} className="h-10 rounded-xl" />
                                ))}
                            </div>
                        ) : analyticsError ? (
                            <Alert variant="destructive">
                                <AlertDescription>Nije moguće učitati analitiku knjige.</AlertDescription>
                            </Alert>
                        ) : !analytics?.dailyAnalytics?.length ? (
                            <div className="rounded-2xl border border-dashed border-reading-accent/20 bg-reading-accent/5 p-12 text-center text-sm text-reading-text/60">
                                Nema dostupnih podataka za izabrani period.
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                    {analytics.dailyAnalytics.slice(0, 7).map((day) => (
                                        <div key={day.date} className="flex items-center gap-3 rounded-xl border border-reading-accent/10 bg-reading-surface/80 px-4 py-3 shadow-inner">
                                            <div className="w-24 text-xs font-semibold text-reading-text/70">
                                                {format(new Date(day.date), 'dd.MM.')}
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-reading-accent/10">
                                                    <div className="h-full rounded-full bg-reading-accent" style={{ width: `${Math.max(8, Math.round((day.readingMinutes / dailyMax) * 100))}%` }} />
                                                </div>
                                            </div>
                                            <div className="w-20 text-right text-xs text-reading-text/60">{formatMinutes(day.readingMinutes)}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-reading-accent/10 bg-reading-accent/5 p-4 text-sm text-reading-text/80">
                                        <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Period</p>
                                        <p className="mt-2 font-semibold text-reading-text">
                                            {format(new Date(startDate), 'dd.MM.yyyy.')} – {format(new Date(endDate), 'dd.MM.yyyy.')}
                                        </p>
                                        <p className="mt-1 text-xs text-reading-text/60">Ukupno {analytics.dailyAnalytics.length} dana aktivnosti</p>
                                    </div>
                                    <div className="rounded-2xl border border-reading-accent/10 bg-white/80 p-4 text-sm text-reading-text/80 shadow">
                                        <p className="text-xs uppercase tracking-[0.3em] text-reading-text/50">Opis</p>
                                        <p className="mt-2 font-semibold text-reading-text">
                                            Poslednjih {range} dana beleži {analytics?.statistics?.totalReadingMinutes ?? 0} minuta čitanja i {analytics?.statistics?.uniqueReaders ?? 0} jedinstvenih čitalaca.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border border-reading-accent/10 bg-white/90 shadow-sm backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-reading-text">Detalji o knjizi</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3 text-sm text-reading-text/80">
                            <p><span className="font-semibold text-reading-text">Opis:</span> {book.description}</p>
                            <p><span className="font-semibold text-reading-text">ISBN:</span> {book.isbn || 'N/A'}</p>
                            <p><span className="font-semibold text-reading-text">Objavljena:</span> {book.publicationYear || 'Nepoznato'}</p>
                        </div>
                        <div className="space-y-3 text-sm text-reading-text/80">
                            <p><span className="font-semibold text-reading-text">Kreirana:</span> {format(new Date(book.createdAt), 'dd.MM.yyyy.')}</p>
                            <p><span className="font-semibold text-reading-text">Poslednja izmena:</span> {format(new Date(book.updatedAt), 'dd.MM.yyyy.')}</p>
                            <p><span className="font-semibold text-reading-text">Status:</span> {book.isAvailable ? 'Aktivna' : 'Sakrivena'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
