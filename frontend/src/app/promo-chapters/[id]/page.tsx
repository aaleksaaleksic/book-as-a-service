'use client';

import { useParams } from 'next/navigation';
import { useBook } from '@/hooks/use-books';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const ReaderView = dynamic(() => import('@/components/reader/ReaderView'), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
            <LoadingSpinner size="lg" text="Učitavanje čitača..." />
        </div>
    ),
});

export default function PromoChapterReaderPage() {
    const params = useParams();
    const bookId = parseInt(params.id as string);
    const { data: book, isLoading } = useBook(bookId);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <LoadingSpinner size="lg" text="Učitavanje knjige..." />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="text-center text-slate-100">
                    <p className="text-xl">Knjiga nije pronađena</p>
                </div>
            </div>
        );
    }

    // Use promo chapter URL directly - no metadata needed for public content
    const promoStream = {
        url: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/books/${bookId}/promo-chapter`,
        contentLength: 0,
        chunkSize: 1048576,
        headers: {},
    };

    return (
        <ReaderView
            bookId={bookId}
            bookTitle={`${book.title} - Promo Poglavlje`}
            stream={promoStream}
            watermark={{
                text: 'PROMO POGLAVLJE',
                signature: book.title,
            }}
            skipMetadata={true}
        />
    );
}
