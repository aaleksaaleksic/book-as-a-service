'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PromoRateLimitDialog } from '@/components/promo/PromoRateLimitDialog';
import { tokenManager } from '@/lib/api-client';

const ReaderView = dynamic(() => import('@/components/reader/ReaderView'), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
            <LoadingSpinner size="lg" text="Učitavanje čitača..." />
        </div>
    ),
});

interface RateLimitStatus {
    authenticated: boolean;
    limitReached: boolean;
    currentCount: number;
    maxCount: number;
    remainingCount: number;
}

export default function PromoChapterReaderPage() {
    const params = useParams();
    const bookId = parseInt(params.id as string);
    const [book, setBook] = useState<any>(null);
    const [isLoadingBook, setIsLoadingBook] = useState(true);
    const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
    const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
    const [isCheckingRateLimit, setIsCheckingRateLimit] = useState(true);

    // Check if user is authenticated
    const isAuthenticated = !!tokenManager.getToken();

    // Fetch book data without authentication (public endpoint)
    useEffect(() => {
        const fetchBook = async () => {
            try {
                setIsLoadingBook(true);
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/books/${bookId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    console.error('Failed to fetch book');
                    setIsLoadingBook(false);
                    return;
                }

                const data = await response.json();
                setBook(data);
            } catch (error) {
                console.error('Failed to fetch book:', error);
            } finally {
                setIsLoadingBook(false);
            }
        };

        if (bookId) {
            fetchBook();
        }
    }, [bookId]);

    // Check rate limit on mount (only for anonymous users)
    useEffect(() => {
        const checkRateLimit = async () => {
            // Skip rate limit check for authenticated users
            if (isAuthenticated) {
                setIsCheckingRateLimit(false);
                return;
            }

            try {
                setIsCheckingRateLimit(true);
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/books/promo-chapters/rate-limit-status`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    console.error('Failed to check rate limit status');
                    setIsCheckingRateLimit(false);
                    return;
                }

                const data = await response.json();
                setRateLimitStatus(data);

                // Show dialog if limit is reached
                if (data.limitReached) {
                    setShowRateLimitDialog(true);
                }
            } catch (error) {
                console.error('Failed to check rate limit:', error);
                // On error, allow access (fail open for better UX)
            } finally {
                setIsCheckingRateLimit(false);
            }
        };

        checkRateLimit();
    }, [isAuthenticated]);

    if (isCheckingRateLimit) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <LoadingSpinner size="lg" text="Provera dostupnosti..." />
            </div>
        );
    }

    // If rate limit is reached, show the dialog and don't render the reader
    if (rateLimitStatus?.limitReached && !isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <PromoRateLimitDialog
                    open={showRateLimitDialog}
                    onOpenChange={setShowRateLimitDialog}
                    currentCount={rateLimitStatus.currentCount}
                    maxCount={rateLimitStatus.maxCount}
                />
                <div className="text-center text-slate-100">
                    <p className="text-xl">Dnevni limit za promo poglavlja dostignut</p>
                    <p className="mt-4 text-slate-400">Kreirajte besplatan nalog da nastavite</p>
                </div>
            </div>
        );
    }

    if (isLoadingBook) {
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
            isPromoChapter={true}
        />
    );
}
