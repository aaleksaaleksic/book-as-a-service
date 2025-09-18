'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Play, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { dt } from '@/lib/design-tokens';
import { resolveApiFileUrl } from '@/lib/asset-utils';

interface FeaturedBook {
    id: number;
    title: string;
    author: string;
    description: string;
    coverImageUrl: string;
    category: string;
    rating: number;
}

interface HeroSectionProps {
    featuredBook?: FeaturedBook;
}

export const HeroSection = ({ featuredBook }: HeroSectionProps) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const handleStartTrial = () => {
        if (isAuthenticated) {
            router.push('/dashboard');
        } else {
            router.push('/auth/register');
        }
    };

    const handleBrowseBooks = () => {
        router.push('/browse');
    };

    const handleReadNow = () => {
        if (featuredBook) {
            if (isAuthenticated) {
                router.push(`/read/${featuredBook.id}`);
            } else {
                router.push('/auth/register');
            }
        }
    };

    return (
        <section className="relative bg-gradient-to-br from-reading-background via-book-green-50 to-reading-surface">
            <div className={dt.layouts.pageContainer}>
                <div className="py-16 lg:py-24">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className={dt.spacing.componentSpacing}>
                            <Badge variant="secondary" className="mb-4">
                                ReadBookHub Premium
                            </Badge>

                            <h1 className={`${dt.responsive.heroTitle} font-bold text-reading-text leading-tight`}>
                                Vaša digitalna biblioteka
                                <span className="block text-reading-accent">vas čeka</span>
                            </h1>

                            <p className={`${dt.responsive.heroSubtitle} text-reading-text/80 leading-relaxed mt-6`}>
                                Otkrijte neograničene knjige uz našu premium pretplatnicu.
                                Čitajte bilo gde, bilo kada na bilo kom uređaju. Počnite svoje putovanje danas.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                <Button
                                    size="lg"
                                    onClick={handleStartTrial}
                                    className={`${dt.interactive.buttonPrimary} group`}
                                >
                                    {isAuthenticated ? 'Idite na kontrolnu tablu' : 'Počni besplatno'}
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>

                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handleBrowseBooks}
                                    className={dt.interactive.buttonSecondary}
                                >
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Pretraži knjige
                                </Button>
                            </div>

                            <div className="flex items-center gap-6 mt-8 text-sm text-reading-text/70">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    14-dnevna besplatna proba
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Otkažite bilo kada
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Neograničene knjige
                                </div>
                            </div>
                        </div>

                        {featuredBook && (
                            <div className="relative">
                                <Card className={`${dt.components.bookCard} max-w-sm mx-auto lg:max-w-none`}>
                                    <div className="relative">
                                        <img
                                            src={resolveApiFileUrl(featuredBook.coverImageUrl) ?? featuredBook.coverImageUrl}
                                            alt={featuredBook.title}
                                            className="w-full h-96 object-cover rounded-t-lg"
                                        />
                                        <Badge className="absolute top-4 left-4 bg-reading-accent text-white">
                                            Izdvojeno
                                        </Badge>
                                        <Button
                                            size="icon"
                                            onClick={handleReadNow}
                                            className="absolute bottom-4 right-4 rounded-full bg-white/90 hover:bg-white text-reading-accent shadow-lg"
                                        >
                                            <Play className="w-5 h-5" fill="currentColor" />
                                        </Button>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div>
                                            <Badge variant="outline" className="mb-2">
                                                {featuredBook.category}
                                            </Badge>
                                            <h3 className={`${dt.typography.cardTitle} text-reading-text mb-1`}>
                                                {featuredBook.title}
                                            </h3>
                                            <p className={`${dt.typography.small} text-reading-text/60 mb-3`}>
                                                {featuredBook.author}
                                            </p>
                                            <p className={`${dt.typography.small} text-reading-text/70 mb-4`}>
                                                {featuredBook.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-3 h-3 rounded-full ${
                                                            i < featuredBook.rating
                                                                ? 'bg-yellow-400'
                                                                : 'bg-gray-200'
                                                        }`}
                                                    />
                                                ))}
                                                <span className={`${dt.typography.small} ml-2 text-reading-text/60`}>
                          {featuredBook.rating}/5
                        </span>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleReadNow}
                                                className="text-reading-accent hover:bg-book-green-100"
                                            >
                                                Čitaj odmah
                                            </Button>
                                        </div>
                                    </div>
                                </Card>

                                <div className="absolute -top-8 -right-8 w-32 h-32 bg-reading-accent/10 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-book-green-600/10 rounded-full blur-2xl"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};