'use client';

import { useMemo } from 'react';
import {
    Activity,
    Users,
    BookOpen,
    Building2,
    MousePointerClick,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    useAdminDashboardAnalytics,
    useAdminPopularBooks,
    useAdminPublishersByClicks,
} from '@/hooks/use-admin';
import type { DashboardTrendBook } from '@/types/admin';

const formatNumber = (value: number | undefined) => new Intl.NumberFormat('sr-RS').format(value || 0);

const computeMaxValue = (items: DashboardTrendBook[], key: 'totalClicks') => {
    return items.reduce((max, item) => {
        const value = Number(item[key] ?? 0);
        return value > max ? value : max;
    }, 0) || 1;
};

const computeMaxClicks = (items: Array<{ totalClicks: number }>) => {
    return items.reduce((max, item) => {
        const value = Number(item.totalClicks ?? 0);
        return value > max ? value : max;
    }, 0) || 1;
};

export default function AdminAnalyticsPage() {
    const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboardAnalytics();
    const { data: popularBooksYear, isLoading: popularYearLoading } = useAdminPopularBooks(365); // Last year for top 20
    const { data: popularBooksMonth, isLoading: popularMonthLoading } = useAdminPopularBooks(30); // Current month
    const { data: publishersDataYear, isLoading: publishersYearLoading } = useAdminPublishersByClicks(365); // Last year
    const { data: publishersDataMonth, isLoading: publishersMonthLoading } = useAdminPublishersByClicks(30); // Current month

    const top20BooksYear = useMemo(() => {
        return (popularBooksYear?.books ?? []).slice(0, 20);
    }, [popularBooksYear?.books]);

    const top20BooksMonth = useMemo(() => {
        return (popularBooksMonth?.books ?? []).slice(0, 20);
    }, [popularBooksMonth?.books]);

    const publishersYear = useMemo(() => {
        return (publishersDataYear?.publishers ?? []);
    }, [publishersDataYear?.publishers]);

    const publishersMonth = useMemo(() => {
        return (publishersDataMonth?.publishers ?? []);
    }, [publishersDataMonth?.publishers]);

    const popularYearMax = computeMaxValue(top20BooksYear, 'totalClicks');
    const popularMonthMax = computeMaxValue(top20BooksMonth, 'totalClicks');
    const publishersYearMax = computeMaxClicks(publishersYear);
    const publishersMonthMax = computeMaxClicks(publishersMonth);

    const todayClicks = (dashboard?.today?.totalClicks as number | undefined) ?? 0;
    const uniqueReaders = (dashboard?.today?.uniqueReaders as number | undefined) ?? 0;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Analitika & Performanse</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Dubinski uvid u ponašanje čitalaca i popularnost naslova
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-none bg-white shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700">Današnje interakcije</CardTitle>
                            <Activity className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            {dashboardLoading ? (
                                <Skeleton className="h-9 w-24" />
                            ) : (
                                <div className="text-3xl font-semibold text-gray-900">
                                    {formatNumber(todayClicks)}
                                </div>
                            )}
                            <p className="mt-2 text-xs text-gray-600">Klikovi na naslove tokom dana</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700">Jedinstveni čitaoci</CardTitle>
                            <Users className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            {dashboardLoading ? (
                                <Skeleton className="h-9 w-24" />
                            ) : (
                                <div className="text-3xl font-semibold text-gray-900">
                                    {formatNumber(uniqueReaders)}
                                </div>
                            )}
                            <p className="mt-2 text-xs text-gray-600">Broj korisnika koji su klikali danas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Top 20 Books by Clicks - Current Month */}
                <Card className="border-none bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <MousePointerClick className="w-5 h-5 text-emerald-600" />
                            Top 20 knjiga po klikovima - Trenutni mesec
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                            Najkliknutije knjige u poslednjih 30 dana - rangiranje po broju interakcija
                        </p>
                    </CardHeader>
                    <CardContent>
                        {popularMonthLoading ? (
                            <div className="space-y-3">
                                {[...Array(10)].map((_, index) => (
                                    <Skeleton key={index} className="h-16 rounded-lg" />
                                ))}
                            </div>
                        ) : top20BooksMonth.length === 0 ? (
                            <div className="text-center py-12">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-600">Nema podataka o klikovima</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
                                                Rang
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Knjiga
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Autor
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Klikovi
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Popularnost
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {top20BooksMonth.map((book, index) => {
                                            const progress = Math.round(((book.totalClicks ?? 0) / popularMonthMax) * 100);
                                            const isTopThree = index < 3;
                                            return (
                                                <tr key={book.bookId} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-4 py-3">
                                                        <div className={cn(
                                                            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                                                            isTopThree ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
                                                        )}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-medium text-gray-900">{book.title}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm text-gray-700">{book.author}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge className="bg-emerald-100 text-emerald-800">
                                                            {formatNumber(book.totalClicks)} klikova
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
                                                                <div
                                                                    className="h-full rounded-full bg-emerald-600"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-600 w-12 text-right">{progress}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top 20 Books by Clicks - Yearly */}
                <Card className="border-none bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <MousePointerClick className="w-5 h-5 text-sky-600" />
                            Top 20 knjiga po klikovima - Godišnje
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                            Najkliknutije knjige tokom godine - rangiranje po ukupnom broju interakcija
                        </p>
                    </CardHeader>
                    <CardContent>
                        {popularYearLoading ? (
                            <div className="space-y-3">
                                {[...Array(10)].map((_, index) => (
                                    <Skeleton key={index} className="h-16 rounded-lg" />
                                ))}
                            </div>
                        ) : top20BooksYear.length === 0 ? (
                            <div className="text-center py-12">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-600">Nema podataka o klikovima</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
                                                Rang
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Knjiga
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Autor
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Klikovi
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Popularnost
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {top20BooksYear.map((book, index) => {
                                            const progress = Math.round(((book.totalClicks ?? 0) / popularYearMax) * 100);
                                            const isTopThree = index < 3;
                                            return (
                                                <tr key={book.bookId} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-4 py-3">
                                                        <div className={cn(
                                                            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                                                            isTopThree ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"
                                                        )}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-medium text-gray-900">{book.title}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm text-gray-700">{book.author}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge className="bg-sky-100 text-sky-800">
                                                            {formatNumber(book.totalClicks)} klikova
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
                                                                <div
                                                                    className="h-full rounded-full bg-sky-600"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-600 w-12 text-right">{progress}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Publishers by Total Clicks - Monthly */}
                <Card className="border-none bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            Izdavači po ukupnim klikovima - Trenutni mesec
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                            Rangiranje izdavača prema ukupnom broju klikova u poslednjih 30 dana
                        </p>
                    </CardHeader>
                    <CardContent>
                        {publishersMonthLoading ? (
                            <div className="space-y-3">
                                {[...Array(8)].map((_, index) => (
                                    <Skeleton key={index} className="h-16 rounded-lg" />
                                ))}
                            </div>
                        ) : publishersMonth.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-600">Nema podataka o izdavačima</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
                                                Rang
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Izdavač
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Ukupni klikovi
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Učešće
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {publishersMonth.map((publisher, index) => {
                                            const progress = Math.round(((publisher.totalClicks ?? 0) / publishersMonthMax) * 100);
                                            const isTopThree = index < 3;
                                            return (
                                                <tr key={publisher.publisherId} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-4 py-3">
                                                        <div className={cn(
                                                            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                                                            isTopThree ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"
                                                        )}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-medium text-gray-900">{publisher.publisherName}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge className="bg-indigo-100 text-indigo-800">
                                                            {formatNumber(publisher.totalClicks)} klikova
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
                                                                <div
                                                                    className="h-full rounded-full bg-indigo-600"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-600 w-12 text-right">{progress}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Publishers by Total Clicks - Yearly */}
                <Card className="border-none bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-purple-600" />
                            Izdavači po ukupnim klikovima - Godišnje
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                            Rangiranje izdavača prema ukupnom broju klikova tokom godine
                        </p>
                    </CardHeader>
                    <CardContent>
                        {publishersYearLoading ? (
                            <div className="space-y-3">
                                {[...Array(8)].map((_, index) => (
                                    <Skeleton key={index} className="h-16 rounded-lg" />
                                ))}
                            </div>
                        ) : publishersYear.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-600">Nema podataka o izdavačima</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
                                                Rang
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Izdavač
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Ukupni klikovi
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Učešće
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {publishersYear.map((publisher, index) => {
                                            const progress = Math.round(((publisher.totalClicks ?? 0) / publishersYearMax) * 100);
                                            const isTopThree = index < 3;
                                            return (
                                                <tr key={publisher.publisherId} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-4 py-3">
                                                        <div className={cn(
                                                            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                                                            isTopThree ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                                                        )}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-medium text-gray-900">{publisher.publisherName}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge className="bg-purple-100 text-purple-800">
                                                            {formatNumber(publisher.totalClicks)} klikova
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
                                                                <div
                                                                    className="h-full rounded-full bg-purple-600"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-600 w-12 text-right">{progress}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
