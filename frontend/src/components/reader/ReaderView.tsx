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
import { api, tokenManager } from '@/lib/api-client';

import { AxiosError } from 'axios';
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
    const skipInitialLoadResetRef = useRef(true);
    const lastStreamKeyRef = useRef<string | null>(null);
    const lastCanAccessRef = useRef<boolean | null>(null);

    const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.1);
    const [isRendering, setIsRendering] = useState(false);
    const [renderError, setRenderError] = useState<string | null>(null);

    const [sessionId, setSessionId] = useState<number | null>(null);
    const [maxVisitedPage, setMaxVisitedPage] = useState(1);

    const { data, isLoading, error } = useBookReadAccess(bookId);
    const startSession = useStartReadingSession();
    const updateProgress = useUpdateReadingProgress();
    const endSession = useEndReadingSession();

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

    const detectDeviceType = (): DeviceType => {
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
    };

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

    const loadPdfDocument = useCallback(
        async (stream: SecureStreamDescriptor, signal?: AbortSignal) => {
            const pdfjs = await pdfjsLibPromise;

            const headers: Record<string, string> = {};
            setRenderError(null);
            const token = tokenManager.getToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            if (stream.headers) {
                Object.entries(stream.headers).forEach(([key, value]) => {
                    headers[key] = value;
                });
            }
            if (watermarkSignature) {
                headers['X-Readify-Watermark'] = watermarkSignature;
            }

            try {
                const requestUrl = stream.url.startsWith('http')
                    ? stream.url
                    : new URL(stream.url, API_CONFIG.BASE_URL).toString();

                const response = await api.get<ArrayBuffer>(requestUrl, {

                    responseType: 'arraybuffer',
                    headers,
                    withCredentials: true,
                    signal,
                });

                if (signal?.aborted) {
                    return;
                }

                const pdfArrayBuffer = response.data;
                const loadingTask = pdfjs.getDocument({
                    data: pdfArrayBuffer,
                    isEvalSupported: false,
                    useWorkerFetch: false,
                });

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
                if ((error as AxiosError)?.code === 'ERR_CANCELED' || signal?.aborted) {
                    return;
                }

                if (error instanceof AxiosError) {
                    const status = error.response?.status;
                    const axiosError = new Error(`Failed to fetch PDF: ${status ?? 'unknown'}`);
                    (axiosError as any).status = status;
                    throw axiosError;
                }

                throw error;
            }
        },
        [clamp, renderPage, watermarkSignature]
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
    }, [pdfDocument, data?.canAccess, data?.stream, loadPdfDocument]);

    useEffect(() => {
        if (skipInitialLoadResetRef.current) {
            skipInitialLoadResetRef.current = false;
            return;
        }

        const stream = data?.stream;
        const streamKey =
            stream && typeof stream === 'object' && !('error' in stream)
                ? [stream.url, stream.expiresAt ?? '', JSON.stringify(stream.headers ?? {})].join('|')
                : stream && typeof stream === 'object' && 'error' in stream
                  ? 'error'
                  : null;
        const canAccessValue = typeof data?.canAccess === 'boolean' ? data.canAccess : null;

        const hasStreamChanged = streamKey !== lastStreamKeyRef.current;
        const hasAccessChanged = canAccessValue !== lastCanAccessRef.current;

        if (hasStreamChanged || hasAccessChanged) {
            lastStreamKeyRef.current = streamKey;
            lastCanAccessRef.current = canAccessValue;
            hasAttemptedLoadRef.current = false;
        }
    }, [data?.stream, data?.canAccess]);

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
        if (!data?.canAccess || sessionId || startSession.isPending) {
            return;
        }

        startSession.mutate(
            { bookId, deviceType: detectDeviceType() },
            {
                onSuccess: response => {
                    if (response?.success && response.session?.id) {
                        setSessionId(response.session.id);
                    }
                },
            }
        );
    }, [bookId, data?.canAccess, sessionId, startSession]);

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
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="rounded-xl bg-red-500/20 px-6 py-3 text-sm text-red-100 shadow-lg">
                                    {renderError}
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
