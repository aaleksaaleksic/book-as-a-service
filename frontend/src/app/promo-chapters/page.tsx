'use client';

import { usePromoChapters } from '@/hooks/use-books';
import { BookOpen, Sparkles, Eye, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolveApiFileUrl } from '@/lib/asset-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export default function PromoChaptersPage() {
    const router = useRouter();
    const { data: books, isLoading, error } = usePromoChapters();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-reading-background">
                <LoadingSpinner size="lg" text="Učitavanje promo poglavlja..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-reading-background">
                <div className="text-center">
                    <p className="text-red-600">Greška pri učitavanju knjiga</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-reading-background text-reading-contrast">
            {/* Hero Section - matching landing page style */}
            <section className="relative overflow-hidden border-b border-library-gold/20 bg-gradient-to-br from-library-midnight via-library-azure to-library-midnight">
                <div className="absolute inset-0 -z-10 bg-hero-grid opacity-70" aria-hidden="true" />
                <div className="absolute -top-24 right-10 h-56 w-56 rounded-full border border-library-highlight/30 opacity-40 blur-2xl" />
                <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-[40px] border border-library-gold/20 opacity-60" />

                <div className={cn(dt.layouts.pageContainer, 'relative z-10')}>
                    <div className="py-20 lg:py-32">
                        <div className="mx-auto max-w-4xl text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/20 bg-library-azure/30 px-4 py-2 text-sm font-semibold uppercase tracking-[0.32em] text-library-gray shadow-sm backdrop-blur">
                                <Sparkles className="h-4 w-4 text-library-highlight" />
                                Besplatno za sve
                            </div>

                            <h1 className={cn(dt.responsive.heroTitle, 'mt-6 font-display font-semibold leading-tight drop-shadow-[0_25px_60px_rgba(12,24,48,0.45)]')}>
                                Promo Poglavlja
                            </h1>

                            <p className={cn(dt.responsive.heroSubtitle, 'mt-4 max-w-2xl mx-auto text-reading-contrast/80 leading-relaxed')}>
                                Zavirite u naše knjige potpuno besplatno. Čitajte promo poglavlja bez pretplate i odlučite šta želite da nastavite.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-reading-contrast/70">
                                <div className="flex items-center gap-2 rounded-full border border-library-gold/25 bg-library-azure/20 px-4 py-2">
                                    <BookOpen className="h-4 w-4 text-library-highlight" />
                                    <span>{books?.length || 0} knjiga dostupno</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-full border border-library-gold/25 bg-library-azure/20 px-4 py-2">
                                    <Eye className="h-4 w-4 text-library-highlight" />
                                    <span>Bez obaveze</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Books Grid */}
            <div className={cn(dt.layouts.pageContainer, 'py-16 lg:py-24')}>
                {books && books.length > 0 ? (
                    <>
                        <div className="mb-12">
                            <h2 className="font-display text-3xl font-semibold text-reading-contrast lg:text-4xl mb-3">
                                Dostupna Promo Poglavlja
                            </h2>
                            <p className="text-lg text-reading-contrast/70">
                                Izaberite knjigu i počnite da čitate odmah
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {books.map((book: any) => (
                                <div
                                    key={book.id}
                                    className="group relative overflow-hidden rounded-3xl border border-library-gold/20 bg-library-parchment/95 p-4 shadow-[0_20px_60px_rgba(4,12,28,0.3)] transition-all hover:shadow-[0_30px_80px_rgba(4,12,28,0.45)] hover:-translate-y-1"
                                >
                                    {/* Book Cover */}
                                    <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-2xl bg-library-azure/15">
                                        {book.coverImageUrl ? (
                                            <img
                                                src={resolveApiFileUrl(book.coverImageUrl)}
                                                alt={book.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <BookOpen className="h-20 w-20 text-library-copper/30" />
                                            </div>
                                        )}

                                        {/* Promo Badge */}
                                        <div className="absolute right-3 top-3">
                                            <Badge className="rounded-full bg-library-gold/90 text-library-midnight shadow-lg">
                                                <Sparkles className="mr-1 h-3 w-3" />
                                                Promo
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Book Info */}
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="font-display text-xl font-semibold text-reading-text line-clamp-2 group-hover:text-library-copper transition-colors">
                                                {book.title}
                                            </h3>
                                            <p className="mt-1 text-sm text-reading-text/60">{book.author}</p>
                                        </div>

                                        {book.description && (
                                            <p className="text-sm text-reading-text/70 line-clamp-2">
                                                {book.description}
                                            </p>
                                        )}

                                        <Link href={`/promo-chapters/${book.id}`}>
                                            <Button
                                                variant="outline"
                                                className="w-full rounded-full border-library-gold/30 bg-transparent text-reading-text transition hover:bg-library-azure/30"
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                Čitaj besplatno
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA Section - matching landing page style */}
                        <section className="relative mt-20 overflow-hidden rounded-3xl border border-library-gold/20 bg-gradient-to-br from-library-midnight via-library-azure to-library-midnight py-16 text-reading-contrast">
                            <div className="absolute inset-0 -z-10 bg-hero-grid opacity-30" aria-hidden="true" />
                            <div className="mx-auto max-w-3xl text-center px-6">
                                <h3 className="font-display text-3xl font-semibold sm:text-4xl">
                                    Svidela vam se knjiga?
                                </h3>
                                <p className="mt-4 text-lg text-reading-contrast/75">
                                    Pretplatite se i dobijte pristup celoj biblioteci sa stotinama knjiga
                                </p>
                                <div className="mt-8">
                                    <Button
                                        size="lg"
                                        onClick={() => router.push('/pricing')}
                                        className="group flex items-center gap-2 rounded-full bg-library-gold px-10 py-6 text-lg font-semibold text-library-midnight shadow-[0_18px_40px_rgba(228,179,76,0.25)] transition-transform hover:-translate-y-1 hover:bg-library-gold/90"
                                    >
                                        Pogledaj Planove
                                        <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </>
                ) : (
                    <div className="py-20 text-center">
                        <div className="mx-auto max-w-md">
                            <BookOpen className="mx-auto h-20 w-20 text-library-copper/30 mb-6" />
                            <h3 className="font-display text-2xl font-bold text-reading-contrast mb-3">
                                Nema dostupnih promo poglavlja
                            </h3>
                            <p className="text-reading-contrast/70 mb-8">
                                Trenutno nema knjiga sa promo poglavljima. Vratite se uskoro!
                            </p>
                            <Button
                                onClick={() => router.push('/')}
                                variant="outline"
                                className="rounded-full border-library-gold/30 bg-transparent px-8 py-4 text-reading-contrast transition hover:bg-library-azure/40"
                            >
                                Nazad na početnu
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
