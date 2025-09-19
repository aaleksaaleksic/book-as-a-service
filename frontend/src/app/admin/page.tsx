
'use client';

import { useMemo } from 'react';
import {
    Activity,
    BookOpen,
    Clock,
    BookMarked,
    Gem,
    Gift,
    TrendingUp,
    UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useBooks } from '@/hooks/use-books';
import { useAuth } from '@/hooks/useAuth';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import type { BookResponseDTO } from '@/api/types/books.types';

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const { data: fetchedBooks, isLoading, error } = useBooks();

    const stats = useMemo(() => {
        const books = fetchedBooks ?? [];

        if (!books.length) {
            return {
                totalBooks: 0,
                premiumBooks: 0,
                freeBooks: 0,
                totalReads: 0,
                averageRating: 0,
                recentBooks: [] as BookResponseDTO[],
                topReadBooks: [] as BookResponseDTO[],
            };
        }

        const premiumBooks = books.filter(book => book.isPremium);
        const freeBooks = books.length - premiumBooks.length;
        const totalReads = books.reduce((sum, book) => sum + (book.readCount ?? 0), 0);
        const averageRating = books.reduce((sum, book) => sum + (book.averageRating ?? 0), 0) /
            books.length;

        const recentBooks = [...books]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

        const topReadBooks = [...books]
            .sort((a, b) => (b.readCount ?? 0) - (a.readCount ?? 0))
            .slice(0, 5);

        return {
            totalBooks: books.length,
            premiumBooks: premiumBooks.length,
            freeBooks,
            totalReads,
            averageRating,
            recentBooks,
            topReadBooks,
        };
    }, [fetchedBooks]);

    const formatNumber = (value: number) => new Intl.NumberFormat('sr-RS').format(value);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div>
                    <h1 className={cn(dt.typography.pageTitle)}>
                        Dobrodošli nazad, {user?.firstName}!
                    </h1>
                    <p className={cn(dt.typography.muted, "mt-1")}>
                        Evo pregleda današnje aktivnosti i statistike
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Books */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ukupno knjiga
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stats.totalBooks}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats.totalBooks === 1 ? '1 dostupna knjiga' : `${stats.totalBooks} dostupnih knjiga`}
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Premium Books */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Premium naslovi
                            </CardTitle>
                            <Gem className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stats.premiumBooks}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats.premiumBooks > 0
                                            ? `${stats.premiumBooks} premium ${stats.premiumBooks === 1 ? 'naslov' : 'naslova'}`
                                            : 'Dodajte premium naslove'}
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Free Books */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Besplatni naslovi
                            </CardTitle>
                            <Gift className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stats.freeBooks}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats.freeBooks > 0
                                            ? `${stats.freeBooks} besplatnih ${stats.freeBooks === 1 ? 'naslov' : 'naslova'}`
                                            : 'Nema besplatnih naslova'}
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Total Reads */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ukupno čitanja
                            </CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{formatNumber(Math.round(stats.totalReads))}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Ukupno evidentiranih čitanja
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            Nismo uspeli da učitamo podatke o knjigama. Pokušajte ponovo kasnije.
                        </AlertDescription>
                    </Alert>
                )}
                {/* Recent Activity & Popular Books */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Nedavna aktivnost
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, index) => (
                                        <div key={index} className="space-y-2">
                                            <Skeleton className="h-5 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    ))}
                                </div>
                            ) : stats.recentBooks.length > 0 ? (
                                <ul className="space-y-4">
                                    {stats.recentBooks.map(book => (
                                        <li key={book.id} className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-medium">{book.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {book.author} • Dodato {book.createdAt
                                                        ? formatDistanceToNow(new Date(book.createdAt), { addSuffix: true })
                                                        : 'nedavno'}
                                                </p>
                                            </div>
                                            <Badge variant={book.isPremium ? 'default' : 'secondary'}>
                                                {book.isPremium ? 'Premium' : 'Besplatna'}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Još uvek nema zabeleženih aktivnosti
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Most Popular Books */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookMarked className="h-5 w-5" />
                                Najpopularnije knjige
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, index) => (
                                        <div key={index} className="space-y-2">
                                            <Skeleton className="h-5 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    ))}
                                </div>
                            ) : stats.topReadBooks.length > 0 ? (
                                <ul className="space-y-4">
                                    {stats.topReadBooks.map(book => (
                                        <li key={book.id} className="space-y-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="font-medium">{book.title}</p>
                                                    <p className="text-sm text-muted-foreground">{book.author}</p>
                                                </div>
                                                <Badge variant={book.isPremium ? 'default' : 'secondary'}>
                                                    {book.isPremium ? 'Premium' : 'Besplatna'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {formatNumber(book.readCount ?? 0)} čitanja • Prosečna ocena {book.averageRating?.toFixed(1) ?? '0.0'}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Nema podataka o popularnosti
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}