'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, ArrowUpRight, Compass } from 'lucide-react';

import { usePromoChapters } from '@/hooks/use-books';
import type { BookResponseDTO } from '@/api/types/books.types';
import { resolveApiFileUrl } from '@/lib/asset-utils';
import { cn } from '@/lib/utils';
import { dt } from '@/lib/design-tokens';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner, PageLoader } from '@/components/ui/loading-spinner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BookSuggestionForm } from '@/components/BookSuggestionForm';

const PROMO_BOOKS_PER_PAGE = 6;
const FALLBACK_COVER_IMAGE = '/book-placeholder.svg';

const ensureBooksArray = (rawData: unknown): BookResponseDTO[] => {
    if (!rawData) {
        return [];
    }

    if (Array.isArray(rawData)) {
        return rawData as BookResponseDTO[];
    }

    const potentialCollection = (rawData as { data?: unknown; books?: unknown }).books ??
        (rawData as { data?: unknown; books?: unknown }).data;

    if (Array.isArray(potentialCollection)) {
        return potentialCollection as BookResponseDTO[];
    }

    return [];
};

export default function PromoChaptersPage() {
    const router = useRouter();
    const { data, isLoading, isFetching, error } = usePromoChapters();

    const books = useMemo(() => ensureBooksArray(data), [data]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const highlightBook = books[0];

    const categoryOptions = useMemo(() => {
        if (!books.length) {
            return [] as string[];
        }

        const uniqueCategories = new Map<string, string>();

        for (const book of books) {
            const name = book?.category?.name?.trim();

            if (!name) {
                continue;
            }

            const key = name.toLowerCase();

            if (!uniqueCategories.has(key)) {
                uniqueCategories.set(key, name);
            }
        }

        return Array.from(uniqueCategories.values()).sort((categoryA, categoryB) =>
            categoryA.localeCompare(categoryB, 'sr', { sensitivity: 'base' }),
        );
    }, [books]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory]);

    const filteredBooks = useMemo(() => {
        if (!books.length) {
            return [] as BookResponseDTO[];
        }

        const normalizedQuery = searchTerm.trim().toLowerCase();
        const normalizedCategory = selectedCategory.toLowerCase();

        return books.filter(book => {
            const title = book.title?.toLowerCase() ?? '';
            const author = book.author?.toLowerCase() ?? '';
            const description = book.description?.toLowerCase() ?? '';
            const categoryName = book.category?.name?.trim().toLowerCase() ?? '';

            const matchesQuery =
                !normalizedQuery ||
                title.includes(normalizedQuery) ||
                author.includes(normalizedQuery) ||
                description.includes(normalizedQuery);

            const matchesCategory = normalizedCategory === 'all' || categoryName === normalizedCategory;

            return matchesQuery && matchesCategory;
        });
    }, [books, searchTerm, selectedCategory]);

    const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PROMO_BOOKS_PER_PAGE));
    const paginatedBooks = filteredBooks.slice(
        (currentPage - 1) * PROMO_BOOKS_PER_PAGE,
        currentPage * PROMO_BOOKS_PER_PAGE,
    );

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    if (isLoading && !books.length) {
        return <PageLoader text="Učitavamo promo poglavlja…" />;
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-library-parchment/95 text-sky-950">
                <div className="rounded-3xl border border-destructive/30 bg-white/90 p-10 text-center shadow-lg">
                    <p className="text-lg font-semibold">Došlo je do greške pri učitavanju promo poglavlja.</p>
                    <p className="mt-3 text-sm text-destructive/70">
                        Molimo pokušajte ponovo kasnije ili posetite našu stranicu sa planovima pretplate.
                    </p>
                    <Button
                        className="mt-6"
                        onClick={() => router.push('/pricing')}
                    >
                        Pogledaj ponudu
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(dt.layouts.library, 'min-h-screen text-reading-text pb-16')}>
            <div className={cn(dt.layouts.pageContainer, 'space-y-16 pt-12')}>
                <section className="relative overflow-hidden rounded-[48px] border border-library-gold/20 bg-gradient-to-br from-library-azure/25 via-library-parchment/95 to-library-azure/15 px-8 py-12 shadow-[0_40px_120px_rgba(6,18,38,0.45)]">
                    <div className="pointer-events-none absolute -left-10 top-0 h-64 w-64 rounded-full bg-library-gold/10 blur-3xl" aria-hidden="true" />
                    <div className="pointer-events-none absolute -right-12 bottom-0 h-72 w-72 rounded-full bg-library-highlight/15 blur-3xl" aria-hidden="true" />

                    <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-6 text-sky-950">
                            <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/40 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-sky-950">
                                Promo sekcija
                            </div>

                            <h1 className={cn(dt.typography.pageTitle, dt.responsive.heroTitle, 'text-sky-950')}>
                                Zavirite u Bookotecha kolekciju pre pretplate
                            </h1>

                            <div className="space-y-4">
                                <p className={cn(dt.typography.muted, 'text-base text-sky-950/80')}>
                                    Pristupite izdvojenim promo poglavljima i upoznajte se sa našim čitalačkim iskustvom pre nego što se pretplatite.
                                </p>
                                <p className={cn(dt.typography.muted, 'text-base font-semibold text-sky-950')}>
                                    Niste član Bookoteche? Pogledajte ponudu i izaberite plan koji vam najviše odgovara.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <Button
                                    size="lg"
                                    onClick={() => router.push('/pricing')}
                                    className={cn(dt.interactive.buttonPrimary, 'flex items-center gap-2 text-base')}
                                >
                                    Pogledaj ponudu
                                    <ArrowUpRight className="h-5 w-5" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => router.push('/auth/register')}
                                    className={cn(dt.interactive.buttonSecondary, 'text-base text-sky-950')}
                                >
                                    Kreiraj nalog
                                </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-sky-950/70">
                                <div className="flex items-center gap-2 rounded-full border border-library-gold/40 bg-white/70 px-4 py-2">
                                    <BookOpen className="h-4 w-4 text-library-gold" />
                                    {books.length} promo naslova
                                </div>
                                <div className="flex items-center gap-2 rounded-full border border-library-gold/40 bg-white/70 px-4 py-2">
                                    <Compass className="h-4 w-4 text-library-gold" />
                                    {categoryOptions.length || '0'} kategorija
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 -z-10 rounded-[36px] bg-library-azure/40 blur-3xl" aria-hidden="true" />
                            <div className="relative overflow-hidden rounded-[36px] border border-library-gold/25 bg-white/70 p-6 shadow-[0_30px_90px_rgba(9,20,45,0.35)]">
                                {highlightBook?.coverImageUrl ? (
                                    <div className="flex min-h-[20rem] items-center justify-center">
                                        <img
                                            src={resolveApiFileUrl(highlightBook.coverImageUrl) ?? highlightBook.coverImageUrl}
                                            alt={`Naslovnica za ${highlightBook.title}`}
                                            className="max-h-[20rem] w-auto object-contain drop-shadow-2xl"
                                            onError={event => {
                                                const target = event.currentTarget;
                                                if (!target.src.endsWith(FALLBACK_COVER_IMAGE)) {
                                                    target.onerror = null;
                                                    target.src = FALLBACK_COVER_IMAGE;
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex min-h-[20rem] items-center justify-center rounded-3xl bg-library-azure/20 text-sm text-sky-950/70">
                                        Naslovnica će uskoro biti dostupna
                                    </div>
                                )}

                                <div className="mt-6 space-y-2 text-center text-sky-950">
                                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-library-gray">
                                        Istaknuto promo poglavlje
                                    </p>
                                    <h3 className="font-display text-2xl">{highlightBook?.title ?? 'Promo sadržaj se ažurira'}</h3>
                                    {highlightBook?.author ? (
                                        <p className="text-sm text-sky-950/70">{highlightBook.author}</p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-8">
                    <div className="space-y-3">
                        <h2 className={cn(dt.typography.sectionTitle, 'text-sky-950')}>Dostupna promo poglavlja</h2>
                        <p className={cn(dt.typography.muted, 'text-sky-950')}>
                            Pretražite naslove po autoru, naslovu ili kategoriji i započnite čitanje besplatnih poglavlja.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 rounded-[32px] border border-library-highlight/25 bg-library-parchment/95 p-6 shadow-[0_24px_60px_rgba(6,18,38,0.35)] lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Sparkles className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-reading-text/60" />
                            <Input
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Pretraži po naslovu, autoru ili opisu"
                                className="h-12 rounded-full border-library-highlight/40 bg-white/80 pl-12 text-base text-reading-text shadow-inner focus-visible:ring-library-gold/40"
                            />
                        </div>

                        <Select
                            value={selectedCategory}
                            onValueChange={value => setSelectedCategory(value)}
                        >
                            <SelectTrigger className="h-12 w-full rounded-full border-library-highlight/40 bg-white/80 px-5 text-left text-base text-reading-text shadow-inner focus:ring-library-gold/40 lg:w-64">
                                <SelectValue placeholder="Sve kategorije" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl border border-library-highlight/20 bg-library-parchment/95">
                                <SelectItem value="all">Sve kategorije</SelectItem>
                                {categoryOptions.length ? (
                                    categoryOptions.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="no-categories" disabled>
                                        Kategorije će uskoro biti dostupne
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {(isFetching && !books.length) ? (
                        <div className="flex justify-center py-16">
                            <div className="rounded-3xl bg-library-parchment/95 px-10 py-8 text-sky-950 shadow-inner">
                                <LoadingSpinner size="lg" variant="book" text="Učitavamo naslove" color="primary" />
                            </div>
                        </div>
                    ) : paginatedBooks.length ? (
                        <>
                            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                                {paginatedBooks.map(book => {
                                    const coverUrl = book.coverImageUrl
                                        ? resolveApiFileUrl(book.coverImageUrl) ?? book.coverImageUrl
                                        : null;

                                    return (
                                        <article
                                            key={book.id}
                                            className={cn(dt.components.bookCard, 'relative cursor-pointer')}
                                            onClick={() => router.push(`/promo-chapters/${book.id}`)}
                                        >
                                            <Badge className="absolute right-6 top-4 z-10 rounded-full bg-library-gold/80 text-library-midnight shadow-lg">
                                                Promo
                                            </Badge>

                                            <div className="space-y-6">
                                                <div className="relative overflow-hidden rounded-3xl bg-library-parchment/95 p-4 shadow-xl">
                                                    {coverUrl ? (
                                                        <div className="flex min-h-[18rem] items-center justify-center sm:min-h-[22rem]">
                                                            <img
                                                                src={coverUrl}
                                                                alt={book.title}
                                                                className="max-h-[18rem] w-auto object-contain drop-shadow-xl sm:max-h-[22rem]"
                                                                loading="lazy"
                                                                onError={event => {
                                                                    const target = event.currentTarget;
                                                                    if (!target.src.endsWith(FALLBACK_COVER_IMAGE)) {
                                                                        target.onerror = null;
                                                                        target.src = FALLBACK_COVER_IMAGE;
                                                                    }
                                                                }}
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
                                                        {book.category?.name && (
                                                            <Badge className={dt.components.badge}>
                                                                {book.category.name}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {book.description && (
                                                        <p className={cn(dt.typography.muted, 'line-clamp-4')}>
                                                            {book.description}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-reading-text/60">
                                                        {book.pages ? (
                                                            <div className="flex items-center gap-2 rounded-full border border-library-gold/25 px-3 py-1">
                                                                {book.pages} strana
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <Button
                                                        size="lg"
                                                        variant="ghost"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            router.push(`/promo-chapters/${book.id}`);
                                                        }}
                                                        className="w-full rounded-full border border-library-gold/25 bg-library-azure/10 py-5 text-reading-text transition hover:bg-library-highlight/10"
                                                    >
                                                        Čitaj promo poglavlje
                                                    </Button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            <div className="mt-12 flex flex-col items-center justify-between gap-6 text-sm text-reading-text/70 sm:flex-row">
                                <p>
                                    Prikazano {Math.min((currentPage - 1) * PROMO_BOOKS_PER_PAGE + 1, filteredBooks.length)}–
                                    {Math.min(currentPage * PROMO_BOOKS_PER_PAGE, filteredBooks.length)} od {filteredBooks.length} promo poglavlja
                                </p>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        className="rounded-full border-library-gold/40 bg-white/80 px-5"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    >
                                        Prethodna
                                    </Button>
                                    <div className="rounded-full border border-library-gold/30 bg-white/80 px-5 py-2 font-semibold text-reading-text">
                                        Strana {currentPage} od {totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="rounded-full border-library-gold/40 bg-white/80 px-5"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    >
                                        Sledeća
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 rounded-[32px] border border-dashed border-library-highlight/40 bg-library-parchment/80 py-16 text-center">
                            <h3 className={cn(dt.typography.sectionTitle, 'text-library-gray')}>Nema dostupnih promo poglavlja</h3>
                            <p className={cn(dt.typography.muted, 'max-w-xl text-library-gray/80')}>
                                Trenutno nema knjiga sa promo poglavljima. Vratite se uskoro ili istražite naše planove pretplate.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Button
                                    variant="outline"
                                    className="rounded-full border-library-gold/40 bg-white/80 px-8"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                    }}
                                >
                                    Poništi filtere
                                </Button>
                                <Button
                                    className="rounded-full"
                                    onClick={() => router.push('/pricing')}
                                >
                                    Pogledaj ponudu
                                </Button>
                            </div>
                        </div>
                    )}
                </section>

                <section className="rounded-[32px] border border-library-highlight/25 bg-white/85 p-8 shadow-[0_24px_60px_rgba(6,18,38,0.35)]">
                    <h2 className={cn(dt.typography.subsectionTitle, 'text-sky-950')}>Predložite knjigu</h2>
                    <p className={cn(dt.typography.muted, 'mt-3 text-sky-950/80')}>
                        Želite da vidite određenu knjigu na platformi? Pošaljite nam predlog i pomoći ćemo vam.
                    </p>
                    <BookSuggestionForm className="mt-6" />
                </section>
            </div>
        </div>
    );
}
