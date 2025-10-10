'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { useAuth } from '@/hooks/useAuth';
import { useHttpClient } from '@/context/HttpClientProvider';
import { analyticsApi } from '@/api/analytics';
import { dt } from '@/lib/design-tokens';
import { resolveApiFileUrl } from '@/lib/asset-utils';

interface Book {
    id: number;
    title: string;
    author: string;
    coverImageUrl?: string;
    category: string;
    popular?: boolean;
    featured?: boolean;
}

interface BookCarouselProps {
    title: string;
    books: Book[];
    viewAllHref?: string;
}

export const BookCarousel = ({ title, books, viewAllHref }: BookCarouselProps) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const handleBookClick = (bookId: number) => {
        if (isAuthenticated) {
            router.push(`/book/${bookId}`);
        } else {
            router.push('/auth/register');
        }
    };

    const handleViewAll = () => {
        if (viewAllHref) {
            router.push(viewAllHref);
        }
    };

    if (!books.length) {
        return null;
    }

    return (
        <section className={dt.spacing.pageSections}>
            <div className="flex items-center justify-between mb-6">
                <h2 className={`${dt.typography.sectionTitle} text-reading-text`}>
                    {title}
                </h2>
                {viewAllHref && (
                    <Button
                        variant="ghost"
                        onClick={handleViewAll}
                        className="text-reading-accent hover:bg-reading-accent/10"
                    >
                        Prikaži sve
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                )}
            </div>

            <Carousel
                opts={{
                    align: 'start',
                    loop: false,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {books.map((book) => (
                        <CarouselItem
                            key={book.id}
                            className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                        >
                            <Card
                                className={`${dt.components.bookCard} cursor-pointer group h-full rounded-xl overflow-hidden border border-white/10 shadow-md transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg`}
                                onClick={() => handleBookClick(book.id)}
                            >
                                <CardContent className="p-0 h-full flex flex-col">
                                    <div className="relative">
                                        {book.coverImageUrl ? (
                                            <img
                                                src={resolveApiFileUrl(book.coverImageUrl) ?? book.coverImageUrl}
                                                alt={book.title}
                                                className="w-full aspect-[2/3] object-cover rounded-t-xl"
                                            />
                                        ) : (
                                            <div className="w-full aspect-[2/3] flex items-center justify-center bg-library-azure/15 rounded-t-xl">
                                                <BookOpen className="h-16 w-16 text-library-copper/30" />
                                            </div>
                                        )}

                                        {book.popular && (
                                            <Badge className="absolute top-2 left-2 bg-orange-500/90 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
                                                🔥 Popularno
                                            </Badge>
                                        )}
                                        {book.featured && (
                                            <Badge className="absolute top-2 left-2 bg-reading-accent/90 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
                                                ⭐ Izdvojeno
                                            </Badge>
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Button
                                                size="sm"
                                                className="bg-white/90 text-reading-accent font-semibold shadow-md hover:bg-white"
                                            >
                                                Čitaj odmah
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 flex flex-col flex-1">
                                        <Badge variant="outline" className="text-xs mb-2">
                                            {book.category?.name || 'N/A'}
                                        </Badge>
                                        <h3 className="font-semibold text-reading-text text-sm line-clamp-2 leading-tight">
                                            {book.title}
                                        </h3>
                                        <p className="text-xs italic text-reading-text/70 mt-1">
                                            {book.author}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Restyled navigation buttons */}
                <CarouselPrevious className="hidden md:flex -left-6 bg-white/80 text-reading-accent rounded-full shadow hover:bg-white transition-colors" />
                <CarouselNext className="hidden md:flex -right-6 bg-white/80 text-reading-accent rounded-full shadow hover:bg-white transition-colors" />
            </Carousel>
        </section>
    );
};
