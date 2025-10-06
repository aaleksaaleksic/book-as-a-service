'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useBook } from '@/hooks/use-books';
import { useAdminBookAnalytics } from '@/hooks/use-admin';
import { resolveApiFileUrl } from '@/lib/asset-utils';
import {
    ArrowLeft,
    Edit,
    TrendingUp,
    Users,
    MousePointerClick,
    Star,
    BookOpen,
} from 'lucide-react';

const FALLBACK_COVER_IMAGE = '/book-placeholder.svg';

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
        return analytics.dailyAnalytics.reduce((max: number, day: any) => (day.clicks > max ? day.clicks : max), 1);
    }, [analytics?.dailyAnalytics]);

    // Calculate total clicks from daily analytics
    const totalClicks = useMemo(() => {
        if (!analytics?.dailyAnalytics?.length) return 0;
        return analytics.dailyAnalytics.reduce((sum: number, day: any) => sum + (day.clicks || 0), 0);
    }, [analytics?.dailyAnalytics]);

    if (bookLoading) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
                </div>
            </AdminLayout>
        );
    }

    if (bookError || !book) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                        <p className="text-sm text-red-800">Tražena knjiga nije pronađena ili nemate pristup.</p>
                    </div>
                    <Link
                        href="/admin/books"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Nazad na listu knjiga
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="rounded-lg bg-sky-950 p-8 text-white shadow-xl">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-4">
                            <Link href="/admin/books" className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70 hover:text-white transition-colors">
                                <ArrowLeft className="h-4 w-4" /> Nazad
                            </Link>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold text-white">{book.title}</h1>
                                <p className="text-base text-white/80">{book.author}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
                                        {book.category?.name || 'N/A'}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
                                        {book.language}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
                                        {book.pages} str.
                                    </span>
                                    {book.isPremium ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Premium
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Besplatna
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={`/admin/books/${book.id}/edit`}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                                >
                                    <Edit className="mr-2 h-4 w-4" /> Uredi knjigu
                                </Link>
                            </div>
                        </div>
                        <div className="relative h-40 w-28 overflow-hidden rounded-lg border border-white/20 shadow-2xl lg:h-48 lg:w-32">
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

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total Reads */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Ukupno čitanja</h3>
                            <div className="h-10 w-10 bg-sky-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-sky-950" />
                            </div>
                        </div>
                        {analyticsLoading ? (
                            <div className="h-8 bg-gray-200 rounded animate-pulse" />
                        ) : (
                            <div className="text-3xl font-bold text-gray-900">
                                {book.readCount ?? analytics?.book?.totalReads ?? 0}
                            </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">Broj započetih čitanja</p>
                    </div>

                    {/* Total Clicks */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Ukupno klikova</h3>
                            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <MousePointerClick className="h-5 w-5 text-orange-600" />
                            </div>
                        </div>
                        {analyticsLoading ? (
                            <div className="h-8 bg-gray-200 rounded animate-pulse" />
                        ) : (
                            <div className="text-3xl font-bold text-gray-900">
                                {totalClicks}
                            </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">Za odabrani period</p>
                    </div>

                    {/* Unique Readers */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Jedinstveni čitaoci</h3>
                            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                        {analyticsLoading ? (
                            <div className="h-8 bg-gray-200 rounded animate-pulse" />
                        ) : (
                            <div className="text-3xl font-bold text-gray-900">
                                {analytics?.statistics?.uniqueReaders ?? 0}
                            </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">Ukupan broj korisnika</p>
                    </div>

                    {/* Average Rating */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Prosečna ocena</h3>
                            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Star className="h-5 w-5 text-yellow-600" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-bold text-gray-900">
                                {book.averageRating && book.averageRating > 0 ? book.averageRating.toFixed(1) : '-'}
                            </div>
                            {book.averageRating > 0 && (
                                <span className="text-yellow-500 text-2xl">★</span>
                            )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            {book.ratingsCount ? `${book.ratingsCount} ocena` : 'Nema ocena'}
                        </p>
                    </div>
                </div>

                {/* Daily Analytics Chart */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Trend klikova</h2>
                                <p className="text-sm text-gray-600 mt-1">Analiza po danima za odabrani vremenski period</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {[7, 30, 90].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => setRange(value as 7 | 30 | 90)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                            range === value
                                                ? 'bg-sky-950 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {value} dana
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {analyticsLoading ? (
                            <div className="space-y-3">
                                {[...Array(4)].map((_, index) => (
                                    <div key={index} className="h-10 bg-gray-200 rounded animate-pulse" />
                                ))}
                            </div>
                        ) : analyticsError ? (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                <p className="text-sm text-red-800">Nije moguće učitati analitiku knjige.</p>
                            </div>
                        ) : !analytics?.dailyAnalytics?.length ? (
                            <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-sm text-gray-600">Nema dostupnih podataka za izabrani period.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    {analytics.dailyAnalytics.slice(0, Math.min(range, analytics.dailyAnalytics.length)).map((day: any) => (
                                        <div key={day.date} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                            <div className="w-24 text-xs font-semibold text-gray-700">
                                                {format(new Date(day.date), 'dd.MM.yyyy')}
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                                    <div
                                                        className="h-full rounded-full bg-sky-950"
                                                        style={{ width: `${Math.max(8, Math.round((day.clicks / dailyMax) * 100))}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-20 text-right text-xs font-medium text-gray-900">
                                                {day.clicks} klikova
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                                        <p className="text-xs uppercase tracking-wider text-sky-900 font-medium">Period</p>
                                        <p className="mt-2 font-semibold text-sky-950">
                                            {format(new Date(startDate), 'dd.MM.yyyy.')} – {format(new Date(endDate), 'dd.MM.yyyy.')}
                                        </p>
                                        <p className="mt-1 text-xs text-sky-700">Ukupno {analytics.dailyAnalytics.length} dana aktivnosti</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                        <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Statistika</p>
                                        <p className="mt-2 font-semibold text-gray-900">
                                            Poslednjih {range} dana beleži {totalClicks} klikova i {analytics?.statistics?.uniqueReaders ?? 0} jedinstvenih čitalaca.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Book Details */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Detalji o knjizi</h2>
                    </div>
                    <div className="p-6 grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-gray-700">Opis:</span>
                                <p className="text-sm text-gray-600 mt-1">{book.description || 'Nema opisa'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-700">ISBN:</span>
                                <p className="text-sm text-gray-600 mt-1 font-mono">{book.isbn || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-700">Izdavač:</span>
                                <p className="text-sm text-gray-600 mt-1">{book.publisher?.name || 'Nepoznato'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-700">Objavljena:</span>
                                <p className="text-sm text-gray-600 mt-1">{book.publicationYear || 'Nepoznato'}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-gray-700">Kreirana:</span>
                                <p className="text-sm text-gray-600 mt-1">{format(new Date(book.createdAt), 'dd.MM.yyyy. HH:mm')}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-700">Poslednja izmena:</span>
                                <p className="text-sm text-gray-600 mt-1">{format(new Date(book.updatedAt), 'dd.MM.yyyy. HH:mm')}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-700">Status:</span>
                                <p className="text-sm text-gray-600 mt-1">
                                    {book.isAvailable ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Aktivna
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Sakrivena
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
