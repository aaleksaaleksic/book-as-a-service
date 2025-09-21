'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useBookReadAccess } from '@/hooks/use-reader';
import { API_CONFIG } from '@/utils/constants';

interface ReaderViewProps {
    bookId: number;
}

function ReaderViewContent({ bookId }: ReaderViewProps) {
    const router = useRouter();

    const { data, isLoading, isRefetching, error, refetch } = useBookReadAccess(bookId);

    const book = data?.book;
    const parsedStreamData = useMemo(() => {
        const stream = data?.stream;

        if (!stream || 'error' in stream || !stream.url) {
            return null;
        }

        try {
            const url = new URL(stream.url, API_CONFIG.BASE_URL);
            return {
                sessionToken: url.searchParams.get('sessionToken') ?? undefined,
                watermark: url.searchParams.get('watermark') ?? undefined,
                issuedAt: url.searchParams.get('issuedAt') ?? undefined,
            };
        } catch (parseError) {
            console.error('Failed to parse secure stream URL', parseError);
            return null;
        }
    }, [data?.stream]);

    const streamError = useMemo(() => {
        const stream = data?.stream;
        if (!stream) {
            return null;
        }
        if ('error' in stream) {
            return stream.error;
        }
        if (!stream.url) {
            return 'PDF sadržaj trenutno nije dostupan.';
        }
        return null;
    }, [data?.stream]);

    const proxyStreamUrl = useMemo(() => {
        if (!parsedStreamData || !bookId) {
            return null;
        }

        const query = new URLSearchParams();

        if (parsedStreamData.sessionToken) {
            query.set('sessionToken', parsedStreamData.sessionToken);
        }

        if (parsedStreamData.watermark) {
            query.set('watermark', parsedStreamData.watermark);
        }

        if (parsedStreamData.issuedAt) {
            query.set('issuedAt', parsedStreamData.issuedAt);
        }

        const queryString = query.toString();
        return `/api/proxy/books/${bookId}/stream${queryString ? `?${queryString}` : ''}`;
    }, [bookId, parsedStreamData]);

    const watermarkLabel = useMemo(() => {
        if (data?.watermark?.text) {
            return data.watermark.text;
        }
        if (book?.title) {
            return `${book.title} • Readify`;
        }
        return null;
    }, [book?.title, data?.watermark?.text]);

    const handleBackToLibrary = () => {
        router.push('/dashboard');
    };

    const handleRetry = () => {
        refetch();
    };

    if (isLoading || isRefetching) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-reading-surface">
                <LoadingSpinner size="lg" variant="book" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-reading-surface px-6">
                <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/80">
                    <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-red-400" />
                    <h2 className="text-xl font-semibold">Nije moguće učitati knjigu</h2>
                    <p className="mt-2 text-sm opacity-80">
                        {(error as Error)?.message ?? 'Došlo je do greške. Pokušajte ponovo kasnije.'}
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button onClick={handleRetry} variant="secondary">
                            Pokušaj ponovo
                        </Button>
                        <Button onClick={handleBackToLibrary}>Povratak na biblioteku</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-reading-surface px-6">
                <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/80">
                    <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-yellow-300" />
                    <h2 className="text-xl font-semibold">Knjiga nije pronađena</h2>
                    <p className="mt-2 text-sm opacity-80">
                        Ova knjiga trenutno nije dostupna. Pokušajte ponovo kasnije.
                    </p>
                    <Button className="mt-6" onClick={handleBackToLibrary}>
                        Povratak na biblioteku
                    </Button>
                </div>
            </div>
        );
    }

    if (!data?.canAccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-reading-surface px-6">
                <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/80">
                    <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-yellow-300" />
                    <h2 className="text-xl font-semibold">Potrebna pretplata</h2>
                    <p className="mt-2 text-sm opacity-80">
                        Da biste čitali ovu knjigu potrebno je da imate aktivnu pretplatu.
                    </p>
                    <Button className="mt-6" onClick={handleBackToLibrary}>
                        Povratak na biblioteku
                    </Button>
                </div>
            </div>
        );
    }

    if (streamError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-reading-surface px-6">
                <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/80">
                    <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-yellow-300" />
                    <h2 className="text-xl font-semibold">PDF sadržaj nije dostupan</h2>
                    <p className="mt-2 text-sm opacity-80">{streamError}</p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button onClick={handleRetry} variant="secondary">
                            Pokušaj ponovo
                        </Button>
                        <Button onClick={handleBackToLibrary}>Povratak na biblioteku</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!proxyStreamUrl) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-reading-surface px-6">
                <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/80">
                    <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-yellow-300" />
                    <h2 className="text-xl font-semibold">PDF sadržaj nije dostupan</h2>
                    <p className="mt-2 text-sm opacity-80">
                        Ova knjiga trenutno nema postavljen PDF fajl. Pokušajte kasnije ili kontaktirajte podršku.
                    </p>
                    <Button className="mt-6" onClick={handleBackToLibrary}>
                        Povratak na biblioteku
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-reading-background text-reading-text">
            <header className="border-b border-white/10 bg-reading-surface/70 backdrop-blur-sm">
                <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBackToLibrary}
                            aria-label="Nazad na biblioteku"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-reading-text/60">Čitanje</p>
                            <h1 className="mt-1 text-2xl font-semibold text-white">{book.title}</h1>
                            <p className="text-sm text-white/60">{book.author}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto bg-reading-surface">
                <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
                    <div className="relative">
                        <iframe
                            key={proxyStreamUrl}
                            src={proxyStreamUrl}
                            className="h-[calc(100vh-220px)] w-full rounded-xl border border-white/10 bg-white shadow-2xl"
                            title={`PDF prikaz za ${book.title}`}
                        />
                        {watermarkLabel && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <span className="rotate-[-25deg] text-5xl font-semibold uppercase tracking-[0.4em] text-white/5">
                                    {watermarkLabel}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export function ReaderView({ bookId }: ReaderViewProps) {
    return (
        <AuthGuard>
            <ReaderViewContent bookId={bookId} />
        </AuthGuard>
    );
}

export default ReaderView;
