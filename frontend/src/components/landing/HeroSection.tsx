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
        <section className="relative overflow-hidden border-b border-reading-accent/20">
            <div className="absolute inset-0 -z-10 bg-hero-grid opacity-80" aria-hidden="true" />
            <div className="absolute -top-24 right-10 h-56 w-56 rounded-full border border-reading-accent/20 opacity-40 blur-2xl" />
            <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-[40px] border border-reading-accent/20 opacity-60" />

            <div className={cn(dt.layouts.pageContainer, 'relative z-10')}>
                <div className="py-20 lg:py-28">
                    <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-reading-accent/20 bg-reading-surface/80 px-4 py-2 text-sm text-reading-text/80 shadow-sm backdrop-blur">
                                <Sparkles className="h-4 w-4 text-reading-accent" />
                                Nova era digitalnog čitanja
                            </div>

                            <h1 className={cn(dt.responsive.heroTitle, 'font-semibold leading-tight text-reading-text drop-shadow-sm')}>
                                Zaronite u biblioteku koja se prilagođava vama
                            </h1>

                            <p className={cn(dt.responsive.heroSubtitle, 'max-w-xl text-reading-text/80 leading-relaxed')}>
                                Personalizovane preporuke, sinhronizovane beleške i knjige koje vas čekaju na svakom uređaju.
                                Bez ograničenja, uz iskustvo dizajnirano za moderne čitaoce.
                            </p>

                            {!isAuthenticated && (
                                <div className="max-w-xl rounded-3xl border border-reading-accent/20 bg-reading-surface/90 p-6 shadow-lg backdrop-blur">
                                    <p className="text-sm font-semibold uppercase tracking-wide text-reading-accent">Niste još član?</p>
                                    <p className="mt-2 text-sm text-reading-text/80">
                                        Kreirajte nalog za manje od minuta i otključajte preko 2.000 naslova, klubove čitalaca i offline čitanje.
                                        Vaša avantura počinje besplatnom trodnevnom probom.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Button
                                    size="lg"
                                    onClick={handlePrimaryCta}
                                    className="group flex items-center gap-2 rounded-full bg-reading-accent px-8 py-6 text-lg font-semibold text-white shadow-lg transition hover:bg-reading-accent/90"
                                >
                                    {isAuthenticated ? 'Nastavi čitanje' : 'Probaj 3 dana besplatno'}
                                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleBrowse}
                                    className="rounded-full border-reading-accent/30 bg-reading-surface px-8 py-6 text-lg font-semibold text-reading-text shadow-sm transition hover:bg-book-green-100"
                                >
                                    <BookOpen className="mr-2 h-5 w-5" />
                                    Pogledaj katalog
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-6 pt-4 text-sm sm:grid-cols-3">
                                <div className="rounded-2xl border border-reading-accent/20 bg-reading-surface/80 p-4 shadow-sm">
                                    <p className="text-xs uppercase tracking-widest text-reading-text/60">Naslovi</p>
                                    <p className="mt-2 text-2xl font-semibold text-reading-text">2.000+</p>
                                    <p className="mt-1 text-xs text-reading-text/70">Svaki žanr koji možete da zamislite</p>
                                </div>
                                <div className="rounded-2xl border border-reading-accent/20 bg-reading-surface/80 p-4 shadow-sm">
                                    <p className="text-xs uppercase tracking-widest text-reading-text/60">Pros. vreme čitanja</p>
                                    <p className="mt-2 text-2xl font-semibold text-reading-text">36 min/dan</p>
                                    <p className="mt-1 text-xs text-reading-text/70">Zasnovano na navikama naše zajednice</p>
                                </div>
                                <div className="rounded-2xl border border-reading-accent/20 bg-reading-surface/80 p-4 shadow-sm">
                                    <p className="text-xs uppercase tracking-widest text-reading-text/60">Zadovoljstvo</p>
                                    <p className="mt-2 text-2xl font-semibold text-reading-text">4.9/5</p>
                                    <p className="mt-1 text-xs text-reading-text/70">Ocena članova zajednice</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -left-10 top-10 hidden h-24 w-24 rounded-full border border-reading-accent/20 opacity-70 blur-xl lg:block" />
                            <div className="absolute -right-12 bottom-10 hidden h-28 w-28 rounded-3xl border border-dashed border-reading-accent/30 opacity-70 lg:block" />

                            <div className="relative mx-auto max-w-md rounded-[32px] border border-reading-accent/20 bg-reading-surface/90 p-6 shadow-2xl backdrop-blur">
                                <div className="absolute -top-10 left-6 hidden items-center gap-2 rounded-full border border-reading-accent/20 bg-reading-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-reading-accent shadow-lg lg:flex animate-float-slow">
                                    <Users className="h-4 w-4" />
                                    Najčitanija knjiga ove nedelje
                                </div>

                                <div className="absolute -bottom-12 right-8 hidden items-center gap-3 rounded-2xl border border-reading-accent/20 bg-reading-surface px-5 py-3 text-xs text-reading-text shadow-lg lg:flex animate-tilt-soft">
                                    <ShieldCheck className="h-4 w-4 text-reading-accent" />
                                    Sinhronizovano na svim uređajima
                                </div>

                                {isBooksLoading ? (
                                    <div className="space-y-5">
                                        <div className="h-64 w-full animate-pulse rounded-3xl bg-reading-background/80" />
                                        <div className="space-y-3">
                                            <div className="h-6 w-3/4 animate-pulse rounded bg-reading-background" />
                                            <div className="h-4 w-1/2 animate-pulse rounded bg-reading-background" />
                                            <div className="h-20 w-full animate-pulse rounded bg-reading-background/90" />
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
                                                <div className="flex h-64 w-full items-center justify-center rounded-3xl bg-reading-background text-reading-text/50">
                                                    Nema dostupne naslovnice
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-2xl font-semibold text-reading-text">{topBook.title}</h3>
                                                    <p className="mt-1 text-sm text-reading-text/70">{topBook.author}</p>
                                                </div>
                                                <Badge className="rounded-full bg-reading-accent/10 text-reading-accent">
                                                    {topBook.category}
                                                </Badge>
                                            </div>

                                            {topBook.description && (
                                                <p className="text-sm text-reading-text/70 line-clamp-4">
                                                    {topBook.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-reading-text/60">
                                                <div className="flex items-center gap-2 rounded-full border border-reading-accent/20 px-3 py-1">
                                                    <Clock3 className="h-3.5 w-3.5 text-reading-accent" />
                                                    {topBook.pages} strana
                                                </div>
                                                <div className="flex items-center gap-2 rounded-full border border-reading-accent/20 px-3 py-1">
                                                    <Users className="h-3.5 w-3.5 text-reading-accent" />
                                                    {topBook.readCount ?? 0} čitanja
                                                </div>
                                            </div>

                                            <Button
                                                size="lg"
                                                variant="ghost"
                                                onClick={() => (isAuthenticated ? router.push(`/book/${topBook.id}`) : router.push('/auth/register'))}
                                                className="w-full rounded-full border border-reading-accent/30 bg-reading-background/60 py-5 text-reading-text transition hover:bg-book-green-100"
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