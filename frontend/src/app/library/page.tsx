"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { srLatn } from "date-fns/locale";
import { Search, Calendar, BookOpen, Bookmark } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useBooks, useBookCategories } from "@/hooks/use-books";
import { useHttpClient } from "@/context/HttpClientProvider";
import { bookmarksApi } from "@/api/bookmarks";
import type { BookmarkResponseDTO } from "@/api/types/bookmarks.types";
import { resolveApiFileUrl } from "@/lib/asset-utils";
import { cn } from "@/lib/utils";
import { dt } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const BOOKS_PER_PAGE = 6;
const FALLBACK_COVER_IMAGE = "/book-placeholder.svg";

const formatLastOpened = (bookmark: BookmarkResponseDTO | null) => {
    if (!bookmark) {
        return null;
    }

    try {
        return formatDistanceToNow(new Date(bookmark.updatedAt ?? bookmark.createdAt), {
            addSuffix: true,
            locale: srLatn,
        });
    } catch (error) {
        console.error("Failed to format bookmark timestamp", error);
        return null;
    }
};

export default function LibraryPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const client = useHttpClient();

    const {
        data: books = [],
        isLoading: isBooksLoading,
        isFetching: isBooksFetching,
    } = useBooks();
    const { data: categories = [], isLoading: isCategoriesLoading } = useBookCategories();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const canReadPremium = useMemo(
        () => user?.permissions?.includes("CAN_READ_PREMIUM_BOOKS") ?? false,
        [user?.permissions],
    );

    const hasActiveSubscription = useMemo(() => {
        const activeStatus = user?.subscriptionStatus === "ACTIVE";
        const backendFlag = (user as unknown as { hasActiveSubscription?: boolean })?.hasActiveSubscription ?? false;
        return activeStatus || backendFlag;
    }, [user]);

    const hasLibraryAccess = useMemo(
        () => Boolean(isAuthenticated && (canReadPremium || hasActiveSubscription)),
        [isAuthenticated, canReadPremium, hasActiveSubscription],
    );

    useEffect(() => {
        if (!isAuthLoading && (!isAuthenticated || !hasLibraryAccess)) {
            router.replace("/pricing");
        }
    }, [isAuthLoading, isAuthenticated, hasLibraryAccess, router]);

    const { data: bookmarks = [] } = useQuery({
        queryKey: ["bookmarks", "library"],
        queryFn: async () => {
            const response = await bookmarksApi.getUserBookmarks(client);
            return response.data ?? [];
        },
        enabled: hasLibraryAccess,
        staleTime: 5 * 60 * 1000,
    });

    const recentBookmark = useMemo(() => {
        if (!bookmarks?.length) {
            return null;
        }

        return [...bookmarks].sort((a, b) =>
            new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime(),
        )[0];
    }, [bookmarks]);

    const continueReadingBook = useMemo(() => {
        if (!recentBookmark) {
            return null;
        }

        const bookFromCollection = books.find(book => book.id === recentBookmark.bookId);

        return {
            id: recentBookmark.bookId,
            title: bookFromCollection?.title ?? recentBookmark.bookTitle,
            author: bookFromCollection?.author ?? recentBookmark.bookAuthor,
            description: bookFromCollection?.description ?? "Spremni da nastavite tamo gde ste stali?",
            coverImageUrl: bookFromCollection?.coverImageUrl ?? recentBookmark.bookCoverImageUrl ?? undefined,
            pages: bookFromCollection?.pages,
            category: bookFromCollection?.category?.name,
            pageNumber: recentBookmark.pageNumber,
        };
    }, [books, recentBookmark]);

    const formattedLastOpened = useMemo(() => formatLastOpened(recentBookmark), [recentBookmark]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory]);

    const filteredBooks = useMemo(() => {
        const normalizedQuery = searchTerm.trim().toLowerCase();
        const normalizedCategory = selectedCategory.toLowerCase();

        return (books ?? []).filter(book => {
            const matchesQuery =
                !normalizedQuery ||
                book.title.toLowerCase().includes(normalizedQuery) ||
                book.author.toLowerCase().includes(normalizedQuery) ||
                (book.description?.toLowerCase().includes(normalizedQuery) ?? false);

            const matchesCategory =
                normalizedCategory === "all" ||
                book.category?.name?.toLowerCase() === normalizedCategory;

            return matchesQuery && matchesCategory;
        });
    }, [books, searchTerm, selectedCategory]);

    const totalPages = Math.max(1, Math.ceil(filteredBooks.length / BOOKS_PER_PAGE));
    const paginatedBooks = filteredBooks.slice((currentPage - 1) * BOOKS_PER_PAGE, currentPage * BOOKS_PER_PAGE);

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    if (isAuthLoading || !hasLibraryAccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-reading-background">
                <LoadingSpinner size="lg" text="Pripremamo vašu biblioteku…" />
            </div>
        );
    }

    return (
        <div className={cn(dt.layouts.mainPage, "text-reading-text pb-16")}>
            <div className={cn(dt.layouts.pageContainer, "space-y-16 pt-12")}>
                <section className="relative overflow-hidden rounded-[48px] border border-library-gold/20 bg-gradient-to-br from-library-azure/30 via-library-parchment/95 to-library-azure/20 px-8 py-12 shadow-[0_40px_120px_rgba(6,18,38,0.45)]">
                    <div className="pointer-events-none absolute -left-10 top-0 h-64 w-64 rounded-full bg-library-gold/10 blur-3xl" aria-hidden="true" />
                    <div className="pointer-events-none absolute -right-12 bottom-0 h-72 w-72 rounded-full bg-library-highlight/15 blur-3xl" aria-hidden="true" />

                    <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-6 text-sky-950">
                            <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/40 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-library-gray">
                                Nastavi čitanje
                            </div>

                            <h1 className={cn(dt.typography.pageTitle, dt.responsive.heroTitle, "text-sky-950")}
>
                                {continueReadingBook ? continueReadingBook.title : "Započnite novo čitalačko putovanje"}
                            </h1>

                            <div className="space-y-4">
                                <p className={cn(dt.typography.muted, "text-base text-sky-950/80")}
>
                                    {continueReadingBook
                                        ? `Autor: ${continueReadingBook.author}`
                                        : "Još uvek niste započeli čitanje nijedne knjige. Kada otvorite PDF čitač, ovde će vas čekati naslov koji ste poslednji čitali."}
                                </p>
                                {continueReadingBook && (
                                    <p className={cn(dt.typography.muted, "max-w-2xl text-sky-950/75")}
>
                                        {continueReadingBook.description}
                                    </p>
                                )}
                            </div>

                            {continueReadingBook ? (
                                <div className="flex flex-wrap items-center gap-4 text-sm text-sky-950/70">
                                    <div className="flex items-center gap-2 rounded-full border border-library-gold/40 bg-white/70 px-4 py-2">
                                        <Bookmark className="h-4 w-4 text-library-gold" />
                                        Strana {continueReadingBook.pageNumber}
                                    </div>
                                    {continueReadingBook.category && (
                                        <div className="flex items-center gap-2 rounded-full border border-library-gold/40 bg-white/70 px-4 py-2">
                                            <BookOpen className="h-4 w-4 text-library-gold" />
                                            {continueReadingBook.category}
                                        </div>
                                    )}
                                    {formattedLastOpened && (
                                        <div className="flex items-center gap-2 rounded-full border border-library-gold/40 bg-white/70 px-4 py-2">
                                            <Calendar className="h-4 w-4 text-library-gold" />
                                            Poslednji put otvoreno {formattedLastOpened}
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            <div className="flex flex-wrap items-center gap-4">
                                {continueReadingBook ? (
                                    <>
                                        <Button
                                            size="lg"
                                            onClick={() => router.push(`/reader/${continueReadingBook.id}`)}
                                            className={cn(dt.interactive.buttonPrimary, "flex items-center gap-2 text-base")}
                                        >
                                            Nastavi čitanje
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={() => router.push(`/book/${continueReadingBook.id}`)}
                                            className={cn(dt.interactive.buttonSecondary, "text-base")}
                                        >
                                            Detalji knjige
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        size="lg"
                                        onClick={() => router.push("/browse")}
                                        className={cn(dt.interactive.buttonPrimary, "text-base")}
                                    >
                                        Istraži naslove
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 -z-10 rounded-[36px] bg-library-azure/40 blur-3xl" aria-hidden="true" />
                            <div className="relative overflow-hidden rounded-[36px] border border-library-gold/25 bg-white/70 p-6 shadow-[0_30px_90px_rgba(9,20,45,0.35)]">
                                {continueReadingBook?.coverImageUrl ? (
                                    <div className="flex min-h-[20rem] items-center justify-center">
                                        <img
                                            src={resolveApiFileUrl(continueReadingBook.coverImageUrl) ?? continueReadingBook.coverImageUrl}
                                            alt={`Naslovnica za ${continueReadingBook.title}`}
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
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-8">
                    <div className="space-y-3">
                        <h2 className={cn(dt.typography.sectionTitle, "text-white")}>Sve dostupne knjige</h2>
                        <p className={cn(dt.typography.muted, "text-white/70")}
>
                            Pretražite kolekciju po autoru, naslovu ili kategoriji i nastavite da gradite svoju digitalnu biblioteku.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 rounded-[32px] border border-library-highlight/25 bg-library-parchment/95 p-6 shadow-[0_24px_60px_rgba(6,18,38,0.35)] lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-reading-text/60" />
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
                                {categories.map(category => (
                                    <SelectItem key={category.id} value={category.name}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {(isBooksLoading || isBooksFetching || isCategoriesLoading) && !books.length ? (
                        <div className="flex justify-center py-16">
                            <LoadingSpinner size="lg" variant="book" text="Učitavamo naslove" />
                        </div>
                    ) : paginatedBooks.length ? (
                        <>
                            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                                {paginatedBooks.map(book => {
                                    const coverUrl = book.coverImageUrl ? resolveApiFileUrl(book.coverImageUrl) ?? book.coverImageUrl : null;

                                    return (
                                        <Card
                                            key={book.id}
                                            className="group relative flex h-full flex-col overflow-hidden rounded-[32px] border border-library-highlight/30 bg-library-parchment/95 p-6 text-reading-text shadow-[0_24px_60px_rgba(6,18,38,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_80px_rgba(6,18,38,0.45)]"
                                        >
                                            <div className="relative overflow-hidden rounded-3xl border border-library-highlight/30 bg-library-parchment/80 p-4 shadow-inner">
                                                {coverUrl ? (
                                                    <div className="flex min-h-[18rem] items-center justify-center">
                                                        <img
                                                            src={coverUrl}
                                                            alt={`Naslovnica za ${book.title}`}
                                                            className="max-h-[18rem] w-auto object-contain drop-shadow-xl"
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
                                                    <div className="flex min-h-[18rem] items-center justify-center rounded-2xl bg-library-azure/15 text-sm text-reading-text/60">
                                                        Naslovnica u pripremi
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-6 flex flex-1 flex-col gap-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="font-display text-2xl text-reading-text">{book.title}</h3>
                                                        <p className="mt-1 text-sm text-reading-text/70">Autor: {book.author}</p>
                                                    </div>
                                                    {book.category?.name && (
                                                        <Badge className="rounded-full bg-library-gold/15 text-library-copper">
                                                            {book.category.name}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {book.description && (
                                                    <p className="text-sm text-reading-text/70 line-clamp-3">{book.description}</p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-3 text-[0.7rem] uppercase tracking-[0.3em] text-reading-text/60">
                                                    <span className="rounded-full border border-library-gold/30 px-3 py-1">
                                                        {book.pages} strana
                                                    </span>
                                                    <span className="rounded-full border border-library-gold/30 px-3 py-1">
                                                        {book.isPremium ? "Premium naslov" : "Besplatan pristup"}
                                                    </span>
                                                </div>

                                                <div className="mt-auto flex flex-wrap gap-3">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        className="flex-1 rounded-full border border-library-gold/30 bg-library-azure/15 py-4 text-reading-text transition hover:bg-library-highlight/20"
                                                    >
                                                        <Link href={`/reader/${book.id}`}>Čitaj</Link>
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        className="flex-1 rounded-full border-library-gold/30 bg-white/80 py-4 text-reading-text transition hover:bg-library-highlight/20"
                                                    >
                                                        <Link href={`/book/${book.id}`}>Detalji</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>

                            <div className="mt-12 flex flex-col items-center justify-between gap-6 text-sm text-reading-text/70 sm:flex-row">
                                <p>
                                    Prikazano {Math.min((currentPage - 1) * BOOKS_PER_PAGE + 1, filteredBooks.length)}–
                                    {Math.min(currentPage * BOOKS_PER_PAGE, filteredBooks.length)} od {filteredBooks.length} knjiga
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
                            <h3 className={cn(dt.typography.sectionTitle, "text-library-gray")}>Nema rezultata</h3>
                            <p className={cn(dt.typography.muted, "max-w-xl text-library-gray/80")}
>
                                Nismo pronašli knjige koje odgovaraju zadatoj pretrazi. Pokušajte sa drugim pojmom ili resetujte filtere.
                            </p>
                            <Button
                                variant="outline"
                                className="rounded-full border-library-gold/40 bg-white/80 px-8"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedCategory("all");
                                }}
                            >
                                Poništi filtere
                            </Button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
