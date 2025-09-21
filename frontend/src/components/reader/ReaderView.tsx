'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Minus, Plus, Maximize2, ShieldAlert } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/useAuth';
import {
    useBookReadAccess,
    useStartReadingSession,
    useUpdateReadingProgress,
    useEndReadingSession,
} from '@/hooks/use-reader';
import { tokenManager } from '@/lib/api-client';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist/types/src/display/api';
import type { SecureStreamDescriptor } from '@/types/reader';
import { API_CONFIG } from '@/utils/constants';

let pdfWorkerSrc: string | null = null;

const pdfjsLibPromise = import('pdfjs-dist').then(pdfjs => {
    if (typeof window !== 'undefined') {
        if (!pdfWorkerSrc) {
            pdfWorkerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        }
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
    }
    return pdfjs;
});

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.4;

type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP';

interface ReaderViewProps {
    bookId: number;
}

export function ReaderView({ bookId }: ReaderViewProps) {
    const { user } = useAuth();
    const router = useRouter();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const renderTaskRef = useRef<RenderTask | null>(null);
    const hasAttemptedLoadRef = useRef(false);
    const sessionAttemptRef = useRef(false);

    const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.1);
    const [isRendering, setIsRendering] = useState(false);
    const [renderError, setRenderError] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [loadTrigger, setLoadTrigger] = useState(0);

    const [sessionId, setSessionId] = useState<number | null>(null);
    const [maxVisitedPage, setMaxVisitedPage] = useState(1);

    const { data, isLoading, error } = useBookReadAccess(bookId);
    const startSession = useStartReadingSession();
    const updateProgress = useUpdateReadingProgress();
    const endSession = useEndReadingSession();
    const isStartingSession = startSession.isPending;

    const watermarkLabel = useMemo(() => {
        if (data?.watermark?.text) {
            return data.watermark.text;
        }
        if (user?.email) {
            return `${user.email} • Readify`;
        }
        return 'Readify Secure Reader';
    }, [data?.watermark?.text, user?.email]);

    const watermarkSignature = data?.watermark?.signature;

    const clamp = useCallback((value: number, min: number, max: number) => {
        return Math.min(max, Math.max(min, value));
    }, []);

    const detectDeviceType = useCallback((): DeviceType => {
        if (typeof window === 'undefined') {
            return 'DESKTOP';
        }
        const width = window.innerWidth;
        if (width <= 640) {
            return 'MOBILE';
        }
        if (width <= 1024) {
            return 'TABLET';
        }
        return 'DESKTOP';
    }, []);

    const attemptStartSession = useCallback(() => {
        if (!data?.canAccess || isStartingSession) {
            return;
        }

        sessionAttemptRef.current = true;
        setSessionError(null);

        startSession.mutate(
            { bookId, deviceType: detectDeviceType() },
            {
                onSuccess: response => {
                    if (response?.success && response.session?.id) {
                        setSessionId(response.session.id);
                    }
                    sessionAttemptRef.current = false;
                },
                onError: err => {
                    console.error('Failed to start reading session', err);
                    setSessionError('Nije moguće pokrenuti sesiju čitanja. Osvežite stranicu i pokušajte ponovo.');
                },
            }
        );
    }, [bookId, data?.canAccess, detectDeviceType, isStartingSession, startSession]);

    const renderPage = useCallback(
        async (pageNumber: number, pdf: PDFDocumentProxy, zoom: number) => {
            if (!canvasRef.current) {
                return;
            }

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d', { alpha: false });
            if (!context) {
                return;
            }

            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }

            try {
                setIsRendering(true);
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale: zoom });
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const task = page.render({
                    canvasContext: context,
                    viewport,
                    intent: 'display',
                });
                renderTaskRef.current = task;
                await task.promise;
                renderTaskRef.current = null;
                setRenderError(null);
            } catch (err) {
                if ((err as any)?.name === 'RenderingCancelledException') {
                    return;
                }
                console.error('Failed to render PDF page', err);
                setRenderError('Nije moguće prikazati stranicu dokumenta.');
            } finally {
                setIsRendering(false);
            }
        },
        []
    );

    const refreshAuthToken = useCallback(async () => {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) {
            return false;
        }

        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH}/refresh`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            if (!data?.token || !data?.refreshToken) {
                return false;
            }

            tokenManager.setToken(data.token);
            tokenManager.setRefreshToken(data.refreshToken);
            return true;
        } catch (error) {
            console.error('Failed to refresh auth token', error);
            return false;
        }
    }, []);

    const fetchChunkWithAuth = useCallback(
        async (requestUrl: string, baseHeaders: HeadersInit, signal?: AbortSignal) => {
            const attemptFetch = async (retry: boolean): Promise<ArrayBuffer> => {
                if (signal?.aborted) {
                    throw new DOMException('Aborted', 'AbortError');
                }

                const headers = new Headers(baseHeaders);
                const token = tokenManager.getToken();
                if (token) {
                    headers.set('Authorization', `Bearer ${token}`);
                }

                const response = await fetch(requestUrl, {
                    method: 'GET',
                    headers,
                    credentials: 'include',
                    signal,
                });

                if (response.status === 401 && retry) {
                    const refreshed = await refreshAuthToken();
                    if (refreshed && !signal?.aborted) {
                        return attemptFetch(false);
                    }

                    const error = new Error('Failed to fetch PDF: 401');
                    (error as any).status = 401;
                    throw error;
                }

                if (!response.ok) {
                    const error = new Error(`Failed to fetch PDF: ${response.status}`);
                    (error as any).status = response.status;
                    throw error;
                }

                return await response.arrayBuffer();
            };

            return attemptFetch(true);
        },
        [refreshAuthToken]
    );

    const downloadPdfInChunks = useCallback(
        async (stream: SecureStreamDescriptor, signal?: AbortSignal) => {
            const requestUrl = stream.url.startsWith('http')
                ? stream.url
                : new URL(stream.url, API_CONFIG.BASE_URL).toString();

            const baseHeaders: Record<string, string> = {
                Accept: 'application/pdf',
            };

            if (stream.headers) {
                Object.entries(stream.headers).forEach(([key, value]) => {
                    baseHeaders[key] = value;
                });
            }

            if (watermarkSignature) {
                baseHeaders['X-Readify-Watermark'] = watermarkSignature;
            }

            const totalLength =
                typeof stream.contentLength === 'number' && stream.contentLength > 0
                    ? stream.contentLength
                    : null;
            const chunkSize =
                typeof stream.chunkSize === 'number' && stream.chunkSize > 0
                    ? stream.chunkSize
                    : 262144; // 256 KiB default

            if (!totalLength) {
                const buffer = await fetchChunkWithAuth(requestUrl, baseHeaders, signal);
                return new Uint8Array(buffer);
            }

            const pdfBytes = new Uint8Array(totalLength);
            let downloaded = 0;

            while (downloaded < totalLength) {
                if (signal?.aborted) {
                    throw new DOMException('Aborted', 'AbortError');
                }

                const rangeStart = downloaded;
                const rangeEnd = Math.min(rangeStart + chunkSize - 1, totalLength - 1);
                const headers = new Headers(baseHeaders);
                headers.set('Range', `bytes=${rangeStart}-${rangeEnd}`);

                const chunkBuffer = await fetchChunkWithAuth(requestUrl, headers, signal);
                const chunkBytes = new Uint8Array(chunkBuffer);
                pdfBytes.set(chunkBytes, rangeStart);
                downloaded += chunkBytes.byteLength;

                if (chunkBytes.byteLength === 0) {
                    const error = new Error('Failed to fetch PDF: received empty chunk');
                    (error as any).status = 500;
                    throw error;
                }
            }

            if (downloaded < totalLength) {
                const error = new Error(
                    `Failed to fetch PDF: incomplete download (${downloaded}/${totalLength} bytes)`
                );
                (error as any).status = 500;
                throw error;
            }

            return pdfBytes;
        },
        [fetchChunkWithAuth, watermarkSignature]
    );

    const loadPdfDocument = useCallback(
        async (stream: SecureStreamDescriptor, signal?: AbortSignal) => {
            const pdfjs = await pdfjsLibPromise;
            setRenderError(null);

            const pdfBytes = await downloadPdfInChunks(stream, signal);

            if (signal?.aborted) {
                return;
            }

            const loadingTask = pdfjs.getDocument({
                data: pdfBytes,
                isEvalSupported: false,
                useWorkerFetch: false,
            });

            try {
                const document = await loadingTask.promise;

                if (signal?.aborted) {
                    loadingTask.destroy();
                    return;
                }

                setPdfDocument(document);
                setTotalPages(document.numPages);
                setCurrentPage(1);

                const firstPage = await document.getPage(1);
                const viewport = firstPage.getViewport({ scale: 1 });
                const containerWidth = containerRef.current?.clientWidth ?? viewport.width;
                const autoScale = clamp((containerWidth - 32) / viewport.width, MIN_ZOOM, MAX_ZOOM);
                setScale(autoScale);
                await renderPage(1, document, autoScale);
            } catch (error) {
                if (signal?.aborted) {
                    throw new DOMException('Aborted', 'AbortError');
                }

                throw error;
            }
        },
        [clamp, downloadPdfInChunks, renderPage]
    );

    useEffect(() => {
        if (
            pdfDocument ||
            !data?.canAccess ||
            !data.stream ||
            'error' in data.stream ||
            hasAttemptedLoadRef.current
        ) {
            return;
        }

        const controller = new AbortController();

        hasAttemptedLoadRef.current = true;

        loadPdfDocument(data.stream as SecureStreamDescriptor, controller.signal).catch(err => {
            if ((err as Error).name === 'AbortError') {
                return;
            }
            console.error('Failed to load PDF document', err);
            if ((err as any)?.status === 401) {
                setRenderError('Vaša sesija je istekla. Prijavite se ponovo kako biste nastavili čitanje.');
                return;
            }
            setRenderError('Greška prilikom učitavanja dokumenta.');
        });

        return () => {
            controller.abort();
        };
    }, [pdfDocument, data?.canAccess, data?.stream, loadPdfDocument, loadTrigger]);

    useEffect(() => {
        sessionAttemptRef.current = false;
        setSessionError(null);
    }, [bookId, data?.canAccess]);

    useEffect(() => {
        hasAttemptedLoadRef.current = false;
        setPdfDocument(null);
        setRenderError(null);
        setCurrentPage(1);
        setTotalPages(0);
        setSessionId(null);
        setMaxVisitedPage(1);
        setLoadTrigger(prev => prev + 1);
    }, [bookId]);

    useEffect(() => {
        if (!pdfDocument) {
            return;
        }
        renderPage(currentPage, pdfDocument, scale).catch(err => {
            console.error('Render loop error', err);
        });
    }, [pdfDocument, currentPage, scale, renderPage]);

    useEffect(() => {
        if (currentPage > maxVisitedPage) {
            setMaxVisitedPage(currentPage);
        }
    }, [currentPage, maxVisitedPage]);

    useEffect(() => {
        if (!data?.canAccess || sessionId || isStartingSession || sessionAttemptRef.current) {
            return;
        }

        attemptStartSession();
    }, [attemptStartSession, data?.canAccess, isStartingSession, sessionId]);

    useEffect(() => {
        if (!sessionId || updateProgress.isPending) {
            return;
        }
        const timeout = window.setTimeout(() => {
            updateProgress.mutate({ sessionId, currentPage });
        }, 600);

        return () => window.clearTimeout(timeout);
    }, [sessionId, currentPage, updateProgress]);

    useEffect(() => {
        return () => {
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
            if (pdfDocument) {
                pdfDocument.destroy();
            }
            if (sessionId) {
                endSession.mutate({ sessionId, pagesRead: maxVisitedPage });
            }
        };
    }, [pdfDocument, sessionId, maxVisitedPage, endSession]);

    const handlePrevious = () => {
        setCurrentPage(prev => (prev > 1 ? prev - 1 : prev));
    };

    const handleNext = () => {
        setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev));
    };

    const handleZoom = (direction: 'in' | 'out') => {
        setScale(prev => {
            const next = direction === 'in' ? prev + ZOOM_STEP : prev - ZOOM_STEP;
            return clamp(next, MIN_ZOOM, MAX_ZOOM);
        });
    };

    const handleRetryLoad = () => {
        if (isRendering) {
            return;
        }
        hasAttemptedLoadRef.current = false;
        setRenderError(null);
        setPdfDocument(null);
        setLoadTrigger(prev => prev + 1);
    };

    const handleRetrySession = () => {
        if (isStartingSession) {
            return;
        }
        sessionAttemptRef.current = false;
        attemptStartSession();
    };

    const handleFitToWidth = async () => {
        if (!pdfDocument) {
            return;
        }
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = containerRef.current?.clientWidth ?? viewport.width;
        const computed = clamp((containerWidth - 32) / viewport.width, MIN_ZOOM, MAX_ZOOM);
        setScale(computed);
    };

    const handleBackToLibrary = () => {
        router.push('/dashboard');
    };

    const renderControls = () => (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBackToLibrary} aria-label="Nazad na biblioteku">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    aria-label="Prethodna strana"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[110px] text-center">
                    Strana {currentPage} / {totalPages || '…'}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={currentPage >= totalPages}
                    aria-label="Sledeća strana"
                >
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="ml-4 flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleZoom('out')}
                    aria-label="Umanji"
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[60px] text-center text-sm">{Math.round(scale * 100)}%</span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleZoom('in')}
                    aria-label="Uvećaj"
                >
                    <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleFitToWidth} aria-label="Prilagodi širinu">
                    <Maximize2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    const renderBody = () => {
        if (isLoading) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-reading-surface">
                    <LoadingSpinner size="lg" variant="book" />
                </div>
            );
        }

        if (error || !data) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-reading-surface px-6">
                    <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/80">
                        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-red-400" />
                        <h2 className="text-xl font-semibold">Nije moguće učitati knjigu</h2>
                        <p className="mt-2 text-sm opacity-80">
                            {error ? 'Proverite mrežnu konekciju i pokušajte ponovo.' : 'Knjiga trenutno nije dostupna.'}
                        </p>
                        <Button className="mt-6" onClick={handleBackToLibrary}>
                            Povratak na biblioteku
                        </Button>
                    </div>
                </div>
            );
        }

        if (!data.success || !data.canAccess) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-reading-surface px-6">
                    <div className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/80">
                        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
                        <h2 className="text-2xl font-semibold">Potrebna je aktivna pretplata</h2>
                        <p className="mt-2 text-sm opacity-80">
                            Da biste otvorili premium knjige potrebno je da aktivirate pretplatu.
                        </p>
                        <Button className="mt-6" onClick={() => router.push('/subscription')}>
                            Pregled pretplata
                        </Button>
                    </div>
                </div>
            );
        }

        const book = data.book;

        return (
            <div className="flex min-h-screen flex-col bg-reading-background text-reading-text">
                <header className="border-b border-white/10 bg-reading-surface/70 backdrop-blur-sm">
                    <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
                        <div className="max-w-xl">
                            <p className="text-xs uppercase tracking-[0.3em] text-reading-text/60">Sigurno čitanje</p>
                            <h1 className="mt-1 text-2xl font-semibold text-white">{book.title}</h1>
                            <p className="text-sm text-white/60">{book.author}</p>
                        </div>
                        {renderControls()}
                    </div>
                </header>

                {sessionError && (
                    <div className="bg-red-500/20 px-6 py-3 text-center text-sm text-red-100">
                        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
                            <span>{sessionError}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRetrySession}
                                disabled={isStartingSession}
                            >
                                Pokušaj ponovo
                            </Button>
                        </div>
                    </div>
                )}

                <main className="flex-1 overflow-auto">
                    <div
                        ref={containerRef}
                        className="relative mx-auto flex max-w-4xl justify-center px-4 py-10"
                        onContextMenu={event => event.preventDefault()}
                    >
                        <canvas
                            ref={canvasRef}
                            className="w-full rounded-xl bg-white shadow-2xl"
                            aria-label={`Strana ${currentPage} od ${totalPages}`}
                        />
                        {isRendering && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                                <LoadingSpinner size="lg" />
                            </div>
                        )}
                        {renderError && !isRendering && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-4 rounded-xl bg-red-500/20 px-6 py-5 text-center text-sm text-red-100 shadow-lg">
                                    <span>{renderError}</span>
                                    <Button variant="secondary" size="sm" onClick={handleRetryLoad}>
                                        Pokušaj ponovo
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <span
                                className="select-none text-4xl font-bold uppercase tracking-[0.5em] text-white/5"
                                style={{ transform: 'rotate(-25deg)' }}
                            >
                                {watermarkLabel}
                            </span>
                        </div>
                    </div>
                </main>
            </div>
        );
    };

    return (
        <AuthGuard requireAuth requireSubscription requireActiveSubscription>
            {renderBody()}
        </AuthGuard>
    );
}

export default ReaderView;
