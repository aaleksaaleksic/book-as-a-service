'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { HeroSection } from '@/components/landing/HeroSection';
import { TopBooksSection } from '@/components/landing/TopBooksSection';
import { ValuePropositionSection } from '@/components/landing/ValuePropositionSection';
import { LoadingSpinner, PageLoader } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { dt } from '@/lib/design-tokens';
import { useAuth } from '@/hooks/useAuth';
import { usePopularBooks } from '@/hooks/use-books';
import { cn } from '@/lib/utils';
import { ArrowUpRight, Mail } from 'lucide-react';

export default function LandingPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, refreshUser, user } = useAuth();
    const { data: popularBooks = [], isLoading: isPopularLoading } = usePopularBooks();

    // Check if user has active subscription from the user object
    const hasActiveSubscription = (user as any)?.hasActiveSubscription ?? false;

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const token = localStorage.getItem('readbookhub_auth_token');

        if (token && !isAuthenticated) {
            void refreshUser();
        }
    }, [isAuthenticated, refreshUser]);

    const topBook = useMemo(() => popularBooks[0], [popularBooks]);

    const handlePrimaryCta = () => {
        if (isAuthenticated) {
            router.push('/library');
            return;
        }

        router.push('/auth/register');
    };

    const handleBrowse = () => {
        router.push('/browse');
    };

    if (isLoading) {
        return <PageLoader text="Pripremamo vašu biblioteku..." />;
    }

    const currentYear = new Date().getFullYear();

    return (
        <div className={cn(dt.layouts.mainPage, 'text-reading-contrast')}>
            <main>
                <HeroSection
                    topBook={topBook}
                    isAuthenticated={isAuthenticated}
                    isBooksLoading={isPopularLoading}
                    hasActiveSubscription={hasActiveSubscription}
                />

                <TopBooksSection books={popularBooks} isLoading={isPopularLoading} />

                <ValuePropositionSection isAuthenticated={isAuthenticated} />

                <section className="relative overflow-hidden border-t border-library-gold/15 bg-sky-950 py-24 text-reading-contrast">
                    <div className="absolute inset-0 -z-10 bg-hero-grid opacity-30" aria-hidden="true" />
                    <div className={dt.layouts.pageContainer}>
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/25 bg-library-azure/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-library-gray">
                                Spremni za sledeću knjigu?
                            </div>
                            <h2 className={cn(dt.typography.pageTitle, 'mt-6 text-reading-contrast')}>
                                Bez obzira da li tek ulaziš u svet čitanja ili želiš da proširiš svoju biblioteku.
                            </h2>
                            {/*<p className="mt-4 text-sm text-reading-contrast/75">*/}
                            {/*    Bez obzira da li tek ulaziš u svet čitanja ili želiš da proširiš svoju biblioteku, Bookotecha ti pruža sve alate za nezaboravno iskustvo.*/}
                            {/*</p>*/}

                            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                {/* Show different buttons based on authentication and subscription status */}
                                {isAuthenticated && hasActiveSubscription ? (
                                    // Authenticated with active subscription: Show "Otvori moju biblioteku" + "Istraži katalog" + "Promo poglavlja"
                                    <>
                                        <Button
                                            size="lg"
                                            onClick={() => router.push('/library')}
                                            className={cn(dt.interactive.buttonPrimary, 'group flex items-center gap-2 text-lg')}
                                        >
                                            Otvori moju biblioteku
                                            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                        </Button>

                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={handleBrowse}
                                            className={cn(dt.interactive.buttonSecondary, 'text-lg text-reading-contrast')}
                                        >
                                            Istraži katalog
                                        </Button>

                                        <Button
                                            size="lg"
                                            variant="ghost"
                                            onClick={() => router.push('/promo-chapters')}
                                            className={cn(dt.interactive.buttonGhost, 'text-lg text-reading-contrast')}
                                        >
                                            Promo poglavlja
                                        </Button>
                                    </>
                                ) : isAuthenticated && !hasActiveSubscription ? (
                                    // Authenticated WITHOUT active subscription: Show "Pogledaj planove" + "Pogledaj promo poglavlja"
                                    <>
                                        <Button
                                            size="lg"
                                            onClick={() => router.push('/pricing')}
                                            className={cn(dt.interactive.buttonPrimary, 'group flex items-center gap-2 text-lg')}
                                        >
                                            Pogledaj planove
                                            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                        </Button>

                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={() => router.push('/promo-chapters')}
                                            className={cn(dt.interactive.buttonSecondary, 'text-lg text-reading-contrast')}
                                        >
                                            Pogledaj promo poglavlja
                                        </Button>
                                    </>
                                ) : (
                                    // Not authenticated: Show "Aktiviraj besplatnu probu" + "Pogledaj promo poglavlja" + "Istraži katalog"
                                    <>
                                        <Button
                                            size="lg"
                                            onClick={() => router.push('/auth/register')}
                                            className={cn(dt.interactive.buttonPrimary, 'group flex items-center gap-2 text-lg')}
                                        >
                                            Aktiviraj besplatnu probu
                                            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                        </Button>

                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={() => router.push('/promo-chapters')}
                                            className={cn(dt.interactive.buttonSecondary, 'text-lg text-reading-contrast')}
                                        >
                                            Pogledaj promo poglavlja
                                        </Button>

                                        <Button
                                            size="lg"
                                            variant="ghost"
                                            onClick={handleBrowse}
                                            className={cn(dt.interactive.buttonGhost, 'text-lg text-reading-contrast')}
                                        >
                                            Istraži katalog
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-library-gold/20 bg-sky-950 text-reading-contrast">
                <div className={cn(dt.layouts.pageContainer, 'py-16')}>
                    <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr]">
                        <div className="space-y-4">
                            <h3 className={cn(dt.typography.sectionTitle, 'text-reading-contrast')}>Bookotecha</h3>
                            <p className="max-w-sm text-sm text-reading-contrast/75">
                                Platforma koja spaja vrhunske knjige, pametne preporuke i zajednicu istinskih ljubitelja kompjuterske literature.
                                Kreirana za sve koji žele da čitaju više i bolje.
                            </p>
                            <div className="flex items-center gap-3 rounded-2xl border border-library-highlight/25 bg-library-azure/20 px-4 py-3 text-sm text-reading-contrast/80">
                                <Mail className="h-5 w-5 text-library-gold" />
                                bookotecha@gmail.com
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold uppercase tracking-[0.32em] text-reading-contrast/70">Navigacija</h4>
                            <ul className="mt-4 space-y-3 text-sm text-reading-contrast/70">
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/promo-chapters')}
                                        className="transition hover:text-library-gold"
                                    >
                                        Promo poglavlja
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={handleBrowse}
                                        className="transition hover:text-library-gold"
                                    >
                                        Pretraži knjige
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/auth/login')}
                                        className="transition hover:text-library-gold"
                                    >
                                        Prijavi se
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={handlePrimaryCta}
                                        className="transition hover:text-library-gold"
                                    >
                                        {isAuthenticated ? 'Idi na kontrolnu tablu' : 'Registruj se'}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold uppercase tracking-[0.32em] text-reading-contrast/70">Resursi</h4>
                            <ul className="mt-4 space-y-3 text-sm text-reading-contrast/70">
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/help')}
                                        className="transition hover:text-library-gold"
                                    >
                                        Pomoć i podrška
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/terms')}
                                        className="transition hover:text-library-gold"
                                    >
                                        Uslovi korišćenja
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/privacy')}
                                        className="transition hover:text-library-gold"
                                    >
                                        Privatnost
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 border-t border-library-gold/20 pt-6 text-sm text-reading-contrast/60">
                        © {currentYear} Bookotecha. Sva prava zadržana.
                    </div>
                </div>
            </footer>
        </div>
    );
}
