'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight, BookOpen, Clock3, ShieldCheck, Sparkles, Users } from 'lucide-react';
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
        <section className="relative overflow-hidden border-b border-library-gold/20 bg-gradient-to-br from-library-midnight via-library-azure to-library-midnight text-reading-contrast">
            <div className="absolute inset-0 -z-10 bg-hero-grid opacity-70" aria-hidden="true" />
            <div className="absolute -top-24 right-10 h-56 w-56 rounded-full border border-library-highlight/30 opacity-40 blur-2xl" />
            <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-[40px] border border-library-gold/20 opacity-60" />

            <div className={cn(dt.layouts.pageContainer, 'relative z-10')}>
                <div className="py-20 lg:py-32">
                    <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/20 bg-library-azure/30 px-4 py-2 text-sm font-semibold uppercase tracking-[0.32em] text-library-gray shadow-sm backdrop-blur">
                                <Sparkles className="h-4 w-4 text-library-highlight" />
                                Nova era digitalnog čitanja
                            </div>

                            <h1 className={cn(dt.responsive.heroTitle, 'font-display font-semibold leading-tight text-reading-contrast drop-shadow-[0_25px_60px_rgba(12,24,48,0.45)]')}>
                                Zaronite u biblioteku koja se prilagođava vama
                            </h1>

                            <p
                                className={cn(
                                    dt.responsive.heroSubtitle,
                                    'max-w-xl text-reading-contrast/80 leading-relaxed',
                                )}
                            >
                                Personalizovane preporuke, sinhronizovane beleške i knjige koje vas čekaju na svakom uređaju.
                                Bez ograničenja, uz iskustvo dizajnirano za moderne čitaoce.
                            </p>

                            {!isAuthenticated && (
                                <div className="max-w-xl rounded-3xl border border-library-highlight/30 bg-library-azure/40 p-6 shadow-[0_20px_60px_rgba(6,18,38,0.6)] backdrop-blur">
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-library-highlight">Niste još član?</p>
                                    <p className="mt-3 text-sm text-reading-contrast/85">
                                        Kreirajte nalog za manje od minuta i otključajte preko 2.000 naslova, klubove čitalaca i offline čitanje.
                                        Vaša avantura počinje besplatnom trodnevnom probom.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Button
                                    size="lg"
                                    onClick={handlePrimaryCta}
                                    className="group flex items-center gap-2 rounded-full bg-library-gold px-10 py-6 text-lg font-semibold text-library-midnight shadow-[0_18px_40px_rgba(228,179,76,0.25)] transition-transform hover:-translate-y-1 hover:bg-library-gold/90"
                                >
                                    {isAuthenticated ? 'Nastavi čitanje' : 'Probaj 3 dana besplatno'}
                                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleBrowse}
                                    className="rounded-full border-library-gold/30 bg-transparent px-10 py-6 text-lg font-semibold text-reading-contrast transition hover:bg-library-azure/40"
                                >
                                    <BookOpen className="mr-2 h-5 w-5" />
                                    Pogledaj katalog
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-6 pt-4 text-sm sm:grid-cols-3">
                                <div className="rounded-2xl border border-library-gold/25 bg-library-azure/30 p-5 shadow-[0_12px_35px_rgba(7,18,36,0.45)]">
                                    <p className="text-xs uppercase tracking-[0.3em] text-library-gray">Naslovi</p>
                                    <p className="mt-3 text-2xl font-semibold text-reading-contrast">2.000+</p>
                                    <p className="mt-2 text-xs text-reading-contrast/70">Svaki žanr koji možete da zamislite</p>
                                </div>
                                <div className="rounded-2xl border border-library-gold/25 bg-library-azure/30 p-5 shadow-[0_12px_35px_rgba(7,18,36,0.45)]">
                                    <p className="text-xs uppercase tracking-[0.3em] text-library-gray">Pros. vreme čitanja</p>
                                    <p className="mt-3 text-2xl font-semibold text-reading-contrast">36 min/dan</p>
                                    <p className="mt-2 text-xs text-reading-contrast/70">Zasnovano na navikama naše zajednice</p>
                                </div>
                                <div className="rounded-2xl border border-library-gold/25 bg-library-azure/30 p-5 shadow-[0_12px_35px_rgba(7,18,36,0.45)]">
                                    <p className="text-xs uppercase tracking-[0.3em] text-library-gray">Zadovoljstvo</p>
                                    <p className="mt-3 text-2xl font-semibold text-reading-contrast">4.9/5</p>
                                    <p className="mt-2 text-xs text-reading-contrast/70">Ocena članova zajednice</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -left-10 top-10 hidden h-24 w-24 rounded-full border border-library-highlight/40 opacity-70 blur-xl lg:block" />
                            <div className="absolute -right-12 bottom-10 hidden h-28 w-28 rounded-3xl border border-dashed border-library-gold/30 opacity-70 lg:block" />

                            <div className="relative mx-auto max-w-md rounded-[32px] border border-library-highlight/30 bg-library-parchment/95 p-6 text-reading-text shadow-[0_30px_80px_rgba(4,12,28,0.45)] backdrop-blur">
                                <div className="absolute -top-10 left-6 hidden items-center gap-2 rounded-full border border-library-gold/20 bg-library-parchment px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-library-copper shadow-lg lg:flex animate-float-slow">
                                    <Users className="h-4 w-4" />
                                    Najčitanija knjiga ove nedelje
                                </div>

                                <div className="absolute -bottom-12 right-8 hidden items-center gap-3 rounded-2xl border border-library-gold/25 bg-library-parchment px-5 py-3 text-xs text-reading-text shadow-lg lg:flex animate-tilt-soft">
                                    <ShieldCheck className="h-4 w-4 text-library-gold" />
                                    Sinhronizovano na svim uređajima
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
                                        <div className="overflow-hidden rounded-3xl shadow-xl">
                                            {coverImageUrl ? (
                                                <img
                                                    src={coverImageUrl}
                                                    alt={topBook.title}
                                                    className="h-64 w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-64 w-full items-center justify-center rounded-3xl bg-library-azure/20 text-reading-text/60">
                                                    Nema dostupne naslovnice
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="font-display text-2xl font-semibold text-reading-text">{topBook.title}</h3>
                                                    <p className="mt-1 text-sm text-reading-text/70">{topBook.author}</p>
                                                </div>
                                                <Badge className="rounded-full bg-library-gold/15 text-library-copper">
                                                    {topBook.category}
                                                </Badge>
                                            </div>

                                            {topBook.description && (
                                                <p className="text-sm text-reading-text/70 line-clamp-4">
                                                    {topBook.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-reading-text/60">
                                                <div className="flex items-center gap-2 rounded-full border border-library-gold/25 px-3 py-1">
                                                    <Clock3 className="h-3.5 w-3.5 text-library-gold" />
                                                    {topBook.pages} strana
                                                </div>
                                                <div className="flex items-center gap-2 rounded-full border border-library-gold/25 px-3 py-1">
                                                    <Users className="h-3.5 w-3.5 text-library-gold" />
                                                    {topBook.readCount ?? 0} čitanja
                                                </div>
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