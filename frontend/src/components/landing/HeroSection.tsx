'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight, BookOpen, Clock3, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dt } from '@/lib/design-tokens';
import { resolveApiFileUrl } from '@/lib/asset-utils';
import type { BookResponseDTO } from '@/api/types/books.types';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
    topBook?: BookResponseDTO;
    isAuthenticated: boolean;
    isBooksLoading: boolean;
}

export const HeroSection = ({ topBook, isAuthenticated, isBooksLoading }: HeroSectionProps) => {
    const router = useRouter();

    const handlePrimaryCta = () => {
        if (isAuthenticated) {
            router.push('/dashboard');
            return;
        }

        router.push('/auth/register');
    };

    const handleBrowse = () => {
        router.push('/browse');
    };

    const coverImageUrl = topBook?.coverImageUrl
        ? resolveApiFileUrl(topBook.coverImageUrl) ?? topBook.coverImageUrl
        : undefined;

    return (
        <section className="relative overflow-hidden bg-library-parchment/95 text-sky-950">
            <div className="absolute inset-0 -z-10 bg-hero-grid opacity-70" aria-hidden="true" />
            <div className="absolute -top-24 right-10 h-56 w-56 rounded-full border border-library-highlight/30 opacity-40 blur-2xl" />
            <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-[40px] border border-library-gold/20 opacity-60" />

            <div className={cn(dt.layouts.pageContainer, 'relative z-10')}>
                <div className="py-20 lg:py-32">
                    <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/20 bg-library-azure/30 px-4 py-2 text-sm font-semibold uppercase tracking-[0.32em] text-white shadow-sm backdrop-blur">
                                <Sparkles className="h-4 w-4 text-library-highlight" />
                                Nova era digitalnog čitanja
                            </div>

                            <h1 className={cn(dt.responsive.heroTitle, dt.typography.heroTitle, 'drop-shadow-[0_25px_60px_rgba(12,24,48,0.45)]')}>
                                Zaronite u biblioteku koja se prilagođava vama
                            </h1>

                            <p
                                className={cn(
                                    dt.responsive.heroSubtitle,
                                    'max-w-xl leading-relaxed',
                                    `text-${dt.colors.textContrast}`
                                )}
                            >
                                Knjige koje vas čekaju na svakom uređaju.
                                Bez ograničenja, uz iskustvo dizajnirano za moderne čitaoce.
                            </p>

                            {!isAuthenticated && (
                                <div className={cn(dt.components.infoBox, 'max-w-xl')}>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-library-highlight">Niste još član?</p>
                                    <p className={cn(dt.typography.muted, `text-${dt.colors.textContrast}`, 'mt-3')}>
                                        Kreirajte nalog za manje od minuta i otključajte sve dostupne naslove.
                                        Vaša avantura počinje besplatnom trodnevnom probom.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Button
                                    size="lg"
                                    onClick={() => isAuthenticated ? router.push('/dashboard') : router.push('/promo-chapters')}
                                    className={cn(dt.interactive.buttonPrimary, 'group flex items-center gap-2 text-lg')}
                                >
                                    {isAuthenticated ? 'Nastavi čitanje' : (
                                        <>
                                            <Sparkles className="h-5 w-5" />
                                            Čitaj promo poglavlja
                                        </>
                                    )}
                                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => isAuthenticated ? handleBrowse() : router.push('/auth/register')}
                                    className={cn(dt.interactive.buttonSecondary, 'text-lg')}
                                >
                                    {isAuthenticated ? (
                                        <>
                                            <BookOpen className="mr-2 h-5 w-5" />
                                            Pogledaj katalog
                                        </>
                                    ) : (
                                        'Registruj se besplatno'
                                    )}
                                </Button>
                            </div>

                        </div>

                        <div className="relative">
                            <div className="absolute -left-10 top-10 hidden h-24 w-24 rounded-full border border-library-highlight/40 opacity-70 blur-xl lg:block" />
                            <div className="absolute -right-12 bottom-10 hidden h-28 w-28 rounded-3xl border border-dashed border-library-gold/30 opacity-70 lg:block" />

                            <div className="relative mx-auto max-w-md rounded-[32px] border border-library-highlight/30 bg-library-parchment/95 p-6 text-reading-text shadow-[0_30px_80px_rgba(4,12,28,0.45)] backdrop-blur">
                                <div className="absolute -top-10 left-6 hidden items-center gap-2 rounded-full border border-library-gold/20 bg-library-parchment px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-950 shadow-lg lg:flex animate-float-slow">
                                    <Users className="h-4 w-4" />
                                    Najčitanija knjiga ove nedelje
                                </div>
                                {isBooksLoading ? (
                                    <div className="space-y-5">
                                        <div className="h-64 w-full animate-pulse rounded-3xl bg-library-azure/30" />
                                        <div className="space-y-3">
                                            <div className="h-6 w-3/4 animate-pulse rounded bg-library-azure/40" />
                                            <div className="h-4 w-1/2 animate-pulse rounded bg-library-azure/40" />
                                            <div className="h-20 w-full animate-pulse rounded bg-library-azure/30" />
                                        </div>
                                    </div>
                                ) : topBook ? (
                                    <div className="space-y-6">
                                        <div className="relative overflow-hidden rounded-3xl bg-library-parchment/95 p-4 shadow-xl">
                                            {coverImageUrl ? (
                                                <div className="flex min-h-[18rem] items-center justify-center sm:min-h-[22rem]">
                                                    <img
                                                        src={coverImageUrl}
                                                        alt={topBook.title}
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
                                                    <h3 className={dt.typography.cardTitle}>{topBook.title}</h3>
                                                    <p className={cn(dt.typography.muted, 'mt-1')}>{topBook.author}</p>
                                                </div>
                                                <Badge className={dt.components.badge}>
                                                    {topBook.category?.name || 'N/A'}
                                                </Badge>
                                            </div>

                                            {topBook.description && (
                                                <p className={cn(dt.typography.muted, 'line-clamp-4')}>
                                                    {topBook.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-reading-text/60">
                                                <div className="flex items-center gap-2 rounded-full border border-library-gold/25 px-3 py-1">
                                                    <Clock3 className="h-3.5 w-3.5 text-library-gold" />
                                                    {topBook.pages} strana
                                                </div>
                                                {/*<div className="flex items-center gap-2 rounded-full border border-library-gold/25 px-3 py-1">*/}
                                                {/*    <Users className="h-3.5 w-3.5 text-library-gold" />*/}
                                                {/*    {topBook.readCount ?? 0} čitanja*/}
                                                {/*</div>*/}
                                            </div>

                                            <Button
                                                size="lg"
                                                variant="ghost"
                                                onClick={() => (isAuthenticated ? router.push(`/book/${topBook.id}`) : router.push('/auth/register'))}
                                                className="w-full rounded-full border border-library-gold/25 bg-library-azure/10 py-5 text-reading-text transition hover:bg-library-highlight/10"
                                            >
                                                Otvori detalje knjige
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 text-sm text-reading-text/70">
                                        <p className="font-semibold text-reading-text">Knjige će uskoro stići.</p>
                                        <p>
                                            Dodaj omiljene naslove u svoju listu želja i čim budu dostupni, dobićeš personalizovane preporuke.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};