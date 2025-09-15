'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useAuth } from '@/hooks/useAuth';
import { dt } from '@/lib/design-tokens';

interface Book {
    id: number;
    title: string;
    author: string;
    coverImageUrl: string;
    category: string;
    rating: number;
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
                        className="text-reading-accent hover:bg-book-green-100"
                    >
                        Prikaži sve
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                )}
            </div>

            <Carousel
                opts={{
                    align: "start",
                    loop: false,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {books.map((book) => (
                        <CarouselItem key={book.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                            <Card
                                className={`${dt.components.bookCard} cursor-pointer group h-full`}
                                onClick={() => handleBookClick(book.id)}
                            >
                                <CardContent className="p-0 h-full flex flex-col">
                                    <div className="relative">
                                        <img
                                            src={book.coverImageUrl}
                                            alt={book.title}
                                            className="w-full h-48 sm:h-56 object-cover rounded-t-lg"
                                        />
                                        {book.popular && (
                                            <Badge className="absolute top-2 left-2 bg-orange-500 text-white text-xs">
                                                Popularno
                                            </Badge>
                                        )}
                                        {book.featured && (
                                            <Badge className="absolute top-2 left-2 bg-reading-accent text-white text-xs">
                                                Izdvojeno
                                            </Badge>
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Button
                                                size="sm"
                                                className="bg-white/90 text-reading-accent hover:bg-white"
                                            >
                                                Čitaj odmah
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3 flex-1 flex flex-col">
                                        <div className="flex-1">
                                            <Badge variant="outline" className="text-xs mb-2">
                                                {book.category}
                                            </Badge>
                                            <h3 className={`${dt.typography.body} font-semibold text-reading-text line-clamp-2 leading-tight`}>
                                                {book.title}
                                            </h3>
                                            <p className={`${dt.typography.small} text-reading-text/70 mt-1`}>
                                                {book.author}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 mt-auto">
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <span className={`${dt.typography.small} text-reading-text/60`}>
                                                {book.rating}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-12 bg-reading-surface border-reading-accent/20 hover:bg-book-green-100" />
                <CarouselNext className="hidden md:flex -right-12 bg-reading-surface border-reading-accent/20 hover:bg-book-green-100" />
            </Carousel>
        </section>
    );
};