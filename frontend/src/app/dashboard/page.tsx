"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useBooks } from '@/hooks/use-books';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { resolveApiFileUrl } from '@/lib/asset-utils';

const FALLBACK_COVER_IMAGE = '/book-placeholder.svg';

export default function DashboardPage() {
    const { data: books, isLoading } = useBooks();

    return (
        <div className="min-h-screen bg-reading-background text-reading-text">
            <div className="mx-auto max-w-5xl px-6 py-10">
                <header className="mb-10 border-b border-white/10 pb-6">
                    <p className="text-xs uppercase tracking-[0.35em] text-reading-text/50">Dobrodošli nazad</p>
                    <h1 className="mt-2 text-3xl font-semibold text-white">Vaša digitalna biblioteka</h1>
                    <p className="mt-2 max-w-2xl text-sm text-reading-text/70">
                        Nastavite čitanje tamo gde ste stali ili otkrijte nove naslove iz naše premium kolekcije. Klikom na
                        "Čitaj" otvara se sigurni čitač koji štiti vaše PDF dokumente.
                    </p>
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <LoadingSpinner size="lg" variant="book" text="Učitavanje knjiga" />
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2">
                        {(books ?? []).slice(0, 6).map(book => {
                            const coverUrl = book.coverImageUrl
                                ? resolveApiFileUrl(book.coverImageUrl) ?? book.coverImageUrl
                                : null;

                            return (
                                <Card
                                    key={book.id}
                                    className="group relative flex h-full flex-col overflow-hidden rounded-[32px] border border-library-highlight/25 bg-library-parchment/95 p-6 text-reading-text shadow-[0_24px_60px_rgba(6,18,38,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_70px_rgba(6,18,38,0.45)]"
                                >
                                    <div
                                        className="pointer-events-none absolute -right-16 top-16 hidden h-36 w-36 rounded-full border border-library-gold/25 opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-40 md:block"
                                        aria-hidden="true"
                                    />
                                    <div className="relative overflow-hidden rounded-3xl border border-library-highlight/30 bg-library-parchment/80 p-4 shadow-inner">
                                        {coverUrl ? (
                                            <div className="flex min-h-[16rem] items-center justify-center sm:min-h-[18rem]">
                                                <img
                                                    src={coverUrl}
                                                    alt={`Naslovnica za ${book.title}`}
                                                    className="max-h-[16rem] w-auto object-contain drop-shadow-xl sm:max-h-[18rem]"
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
                                            <div className="flex min-h-[16rem] items-center justify-center rounded-2xl bg-library-azure/15 text-sm text-reading-text/60 sm:min-h-[18rem]">
                                                Naslovnica u pripremi
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex flex-1 flex-col gap-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="font-display text-xl font-semibold text-reading-text">{book.title}</h3>
                                                <p className="mt-1 text-sm text-reading-text/70">Autor: {book.author}</p>
                                            </div>
                                            {book.category && (
                                                <Badge className="rounded-full bg-library-gold/15 text-library-copper">
                                                    {book.category?.name || 'N/A'}
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
                                                {book.isPremium ? 'Premium naslov' : 'Besplatan pristup'}
                                            </span>
                                        </div>

                                        <Button
                                            asChild
                                            variant="ghost"
                                            className="mt-auto w-full rounded-full border border-library-gold/30 bg-library-azure/15 py-4 text-reading-text transition hover:bg-library-highlight/20"
                                        >
                                            <Link href={`/reader/${book.id}`}>Čitaj</Link>
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
