'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Star, ArrowLeft, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/loading-spinner';
import { dt } from '@/lib/design-tokens';
import { resolveApiFileUrl } from '@/lib/asset-utils';
import { useBook, usePopularBooks } from '@/hooks/use-books';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function BookDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const bookId = Number(params.id);

    const { data: book, isLoading: isBookLoading } = useBook(bookId);
    const { data: popularBooks = [], isLoading: isPopularLoading } = usePopularBooks();
    const { isAuthenticated, user } = useAuth();

    // Check if user has active subscription from the user object
    const hasActiveSubscription = (user as any)?.hasActiveSubscription ?? false;

    // Check if the book is in the top 6
    const isTopBook = useMemo(() => {
        if (!book || !popularBooks.length) return false;
        const topSix = popularBooks.slice(0, 6);
        return topSix.some((b) => b.id === book.id);
    }, [book, popularBooks]);

    // Get the rank if it's a top book
    const topRank = useMemo(() => {
        if (!isTopBook || !book) return null;
        return popularBooks.findIndex((b) => b.id === book.id) + 1;
    }, [isTopBook, book, popularBooks]);

    const coverImageUrl = book?.coverImageUrl
        ? resolveApiFileUrl(book.coverImageUrl) ?? book.coverImageUrl
        : undefined;

    const handleBack = () => {
        router.back();
    };

    const handleReadBook = () => {
        if (hasActiveSubscription) {
            router.push(`/reader/${bookId}`);
        } else {
            // If not subscribed, show promo chapter if available
            router.push(`/promo-chapters/${bookId}`);
        }
    };

    const handlePromoChapter = () => {
        router.push(`/promo-chapters/${bookId}`);
    };

    const handleViewPlans = () => {
        router.push('/pricing');
    };

    if (isBookLoading || isPopularLoading) {
        return <PageLoader text="Učitavanje detalja knjige..." />;
    }

    if (!book) {
        return (
            <div className={cn(dt.layouts.mainPage, 'text-reading-contrast')}>
                <div className={cn(dt.layouts.pageContainer, 'py-20 text-center')}>
                    <h1 className={dt.typography.pageTitle}>Knjiga nije pronađena</h1>
                    <p className="mt-4 text-reading-text/70">Knjiga koju tražite ne postoji ili je uklonjena.</p>
                    <Button onClick={handleBack} className="mt-8">
                        Nazad
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-library-parchment/95 text-sky-950">
            <div className="absolute inset-0 -z-10 bg-hero-grid opacity-70" aria-hidden="true" />

            <div className={cn(dt.layouts.pageContainer, 'relative z-10')}>
                <div className="py-8">
                    {/* Back button */}
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="mb-8 text-sky-950 hover:text-library-gold"
                    >
                        <ArrowLeft className="h-8 w-8" />
                    </Button>

                    {/* Main content grid */}
                    <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
                        {/* Left side - Book card */}
                        <div className="relative">
                            <div className={cn(dt.components.bookCard, 'relative')}>
                                {/* Top 6 badge */}
                                {isTopBook && topRank && (
                                    <div className="absolute -top-3 right-6 rounded-full border border-library-gold/20 bg-library-parchment px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-950 shadow-lg">
                                        #{topRank} u poslednjih 30 dana
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div className="relative overflow-hidden rounded-3xl bg-library-parchment/95 p-4 shadow-xl">
                                        {coverImageUrl ? (
                                            <div className="flex min-h-[18rem] items-center justify-center sm:min-h-[22rem]">
                                                <img
                                                    src={coverImageUrl}
                                                    alt={book.title}
                                                    className="max-h-[18rem] w-auto object-contain drop-shadow-xl sm:max-h-[22rem]"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex min-h-[18rem] w-full items-center justify-center rounded-2xl bg-library-azure/15 text-reading-text/60 sm:min-h-[22rem]">
                                                Nema dostupne naslovnice
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className={dt.typography.cardTitle}>{book.title}</h3>
                                                <p className={cn(dt.typography.muted, 'mt-1')}>{book.author}</p>
                                            </div>
                                            <Badge className={dt.components.badge}>
                                                {book.category?.name || 'N/A'}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-reading-text/60">
                                            <div className="flex items-center gap-2 rounded-full border border-library-gold/25 px-3 py-1">
                                                <Clock3 className="h-3.5 w-3.5 text-library-gold" />
                                                {book.pages} strana
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Book info */}
                        <div className="space-y-8">
                            <div>
                                <h1 className={cn(dt.typography.pageTitle, 'text-sky-950')}>
                                    {book.title}
                                </h1>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-950">
                                        Autor
                                    </p>
                                    <p className="mt-2 text-lg text-sky-950">{book.author}</p>
                                </div>

                                {book.publisher && (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-950">
                                            Izdavač
                                        </p>
                                        <p className="mt-2 text-lg text-sky-950">{book.publisher.name}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-950">
                                        Prosečna ocena
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-2xl font-bold text-sky-950">
                                            {book.averageRating > 0 ? book.averageRating.toFixed(1) : 'N/A'}
                                        </span>
                                        {book.averageRating > 0 && (
                                            <Star className="h-6 w-6 fill-library-gold text-library-gold" />
                                        )}
                                        {book.totalRatings > 0 && (
                                            <span className="text-sm text-sky-950/70">
                                                ({book.totalRatings} {book.totalRatings === 1 ? 'ocena' : 'ocena'})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="space-y-4 pt-4">
                                {hasActiveSubscription ? (
                                    <Button
                                        size="lg"
                                        onClick={handleReadBook}
                                        className={cn(dt.interactive.buttonPrimary, 'w-full text-lg')}
                                    >
                                        Nastavi čitanje
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            size="lg"
                                            onClick={handlePromoChapter}
                                            className={cn(dt.interactive.buttonPrimary, 'w-full text-lg')}
                                        >
                                            Promo poglavlje
                                        </Button>

                                        <div className="rounded-2xl border border-library-highlight/30 bg-library-azure/30 p-6">
                                            <p className="text-sm font-semibold text-sky-950">
                                                Niste član Bookoteche?
                                            </p>
                                            <p className="mt-2 text-sm text-sky-950/80">
                                                Pridružite se i dobijte pristup celoj biblioteci.
                                            </p>
                                            <Button
                                                size="lg"
                                                onClick={handleViewPlans}
                                                className="mt-4 bg-library-gold text-md text-library-midnight font-semibold py-4 px-12 rounded-full shadow-[0_18px_40px_rgba(228,179,76,0.25)] transition-transform hover:-translate-y-1 hover:bg-library-gold/90"
                                            >
                                                Pogledaj planove
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description section below the grid */}
                    <div className="mt-12">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-950">
                                Opis
                            </p>
                            <p className="mt-4 max-w-4xl leading-relaxed text-sky-950/90">
                                {book.description || 'Opis nije dostupan.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
