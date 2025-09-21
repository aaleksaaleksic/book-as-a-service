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
import type { PDFDocumentProxy, RenderTask, PDFDocumentLoadingTask } from 'pdfjs-dist/types/src/display/api';
import type { SecureStreamDescriptor } from '@/types/reader';
import { API_CONFIG } from '@/utils/constants';
import { tokenManager } from '@/lib/api-client';

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
    const pdfLoadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
    const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null);
    const hasAttemptedLoadRef = useRef(false);
    const sessionAttemptRef = useRef(false);
    const isMountedRef = useRef(true);
    const sessionIdRef = useRef<number | null>(null);
    const maxVisitedPageRef = useRef(1);

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

    const {
        data,
        isLoading,
        error,
        refetch: refetchReadAccess,
    } = useBookReadAccess(bookId);
    const { mutate: startSessionMutate, isPending: isStartingSession } = useStartReadingSession();
    const { mutate: updateProgressMutate, isPending: isUpdatingProgress } = useUpdateReadingProgress();
    const { mutate: endSessionMutate } = useEndReadingSession();

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

    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
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
                }
            );

            if (!response.ok) {
                throw new Error(`Refresh request failed with status ${response.status}`);
            }

            const payload = await response.json();
            if (payload?.token && payload?.refreshToken) {
                tokenManager.setToken(payload.token);
                tokenManager.setRefreshToken(payload.refreshToken);
                return true;
            }
        } catch (error) {
            console.error('Failed to refresh authentication token for reader', error);
        }

        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:logout'));
        }
        return false;
    }, []);

    const attemptStartSession = useCallback(() => {
        if (!data?.canAccess || isStartingSession || sessionAttemptRef.current) {
            return;
        }

        sessionAttemptRef.current = true;
        if (isMountedRef.current) {
            setSessionError(null);
        }

        startSessionMutate(
            { bookId, deviceType: detectDeviceType() },
            {
                onSuccess: response => {
                    if (!isMountedRef.current) {
                        return;
                    }

                    if (response?.success && response.session?.id) {
                        sessionIdRef.current = response.session.id;
                        setSessionId(response.session.id);
                    }
                    sessionAttemptRef.current = false;
                },
                onError: err => {
                    console.error('Failed to start reading session', err);
                    if (isMountedRef.current) {
                        setSessionError('Nije moguće pokrenuti sesiju čitanja. Osvežite stranicu i pokušajte ponovo.');
                    }
                    sessionAttemptRef.current = false;
                },
                onSettled: () => {
                    sessionAttemptRef.current = false;
                },
            }
        );
    }, [bookId, data?.canAccess, detectDeviceType, isStartingSession, startSessionMutate]);

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

            let task: RenderTask | null = null;
            try {
                if (isMountedRef.current) {
                    setIsRendering(true);
                }
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale: zoom });
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                task = page.render({
                    canvasContext: context,
                    viewport,
                    intent: 'display',
                });
                renderTaskRef.current = task;
                await task.promise;
                if (watermarkLabel) {
                    context.save();
                    context.globalAlpha = 0.12;
                    context.fillStyle = '#1f2937';
                    context.translate(canvas.width / 2, canvas.height / 2);
                    context.rotate((-25 * Math.PI) / 180);
                    const fontSize = Math.max(24, canvas.width / 12);
                    context.font = `bold ${fontSize}px sans-serif`;
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText(watermarkLabel, 0, 0);
                    context.restore();
                }
                renderTaskRef.current = null;
                if (isMountedRef.current) {
                    setRenderError(null);
                }
            } catch (err) {
                if ((err as any)?.name === 'RenderingCancelledException') {
                    return;
                }
                console.error('Failed to render PDF page', err);
                if (isMountedRef.current) {
                    setRenderError('Nije moguće prikazati stranicu dokumenta.');
                }
            } finally {
                if (renderTaskRef.current && renderTaskRef.current === task) {
                    renderTaskRef.current = null;
                }
                if (isMountedRef.current) {
                    setIsRendering(false);
                }
            }
        },
        [watermarkLabel]
    );

    const getAuthToken = useCallback(() => {
        if (typeof window === 'undefined') {
            return null;
        }

        return tokenManager.getToken();
    }, []);

    const buildStreamingRequest = useCallback(
        (stream: SecureStreamDescriptor) => {
            const requestUrl = stream.url.startsWith('http')
                ? stream.url
                : new URL(stream.url, API_CONFIG.BASE_URL).toString();

            const headers: Record<string, string> = {
                Accept: 'application/pdf',
            };

            const normalizedHeaderMap = new Map<string, string>();

            if (stream.headers) {
                Object.entries(stream.headers).forEach(([key, value]) => {
                    if (typeof value === 'string') {
                        headers[key] = value;
                        normalizedHeaderMap.set(key.toLowerCase(), value);
                    }
                });
            }

            const authToken = getAuthToken();
            if (authToken && !headers.Authorization) {
                headers.Authorization = `Bearer ${authToken}`;
            }

            const sessionHeader =
                normalizedHeaderMap.get('x-readify-session') ??
                (headers['X-Readify-Session'] as string | undefined);
            if (sessionHeader) {
                headers['X-Readify-Session'] = sessionHeader;
            }

            const watermarkHeader =
                normalizedHeaderMap.get('x-readify-watermark') ??
                (headers['X-Readify-Watermark'] as string | undefined) ??
                watermarkSignature;
            if (watermarkHeader) {
                headers['X-Readify-Watermark'] = watermarkHeader;
            }

            const rangeChunkSize =
                typeof stream.chunkSize === 'number' && stream.chunkSize > 0
                    ? stream.chunkSize
                    : undefined;

            return { requestUrl, headers, rangeChunkSize };
        },
        [getAuthToken, watermarkSignature]
    );

    const refreshStreamingSession = useCallback(
        async (): Promise<SecureStreamDescriptor | null> => {
            if (!bookId) {
                return null;
            }

            try {
                const result = await refetchReadAccess({ throwOnError: false });
                const refreshedData = result.data;

                if (
                    refreshedData?.canAccess &&
                    refreshedData.stream &&
                    !('error' in refreshedData.stream)
                ) {
                    return refreshedData.stream as SecureStreamDescriptor;
                }
            } catch (err) {
                console.error('Failed to refresh streaming session metadata', err);
            }

            return null;
        },
        [bookId, refetchReadAccess]
    );

    const loadPdfDocument = useCallback(
        async (stream: SecureStreamDescriptor,
               signal?: AbortSignal,
               allowRetryOnUnauthorized = true) => {
            const pdfjs = await pdfjsLibPromise;
            if (isMountedRef.current) {
                setRenderError(null);
            }

            const { requestUrl, headers, rangeChunkSize } = buildStreamingRequest(stream);

            if (signal?.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }

            const loadingTask = pdfjs.getDocument({
                url: requestUrl,
                httpHeaders: headers,
                withCredentials: true,
                rangeChunkSize,
                disableAutoFetch: true,
                isEvalSupported: false,
                useWorkerFetch: true,
            });
            pdfLoadingTaskRef.current = loadingTask;

            const abortHandler = () => {
                loadingTask.destroy();
            };

            if (signal) {
                if (signal.aborted) {
                    loadingTask.destroy();
                    throw new DOMException('Aborted', 'AbortError');
                }
                signal.addEventListener('abort', abortHandler);
            }

            try {
                const document = await loadingTask.promise;

                if (signal?.aborted || !isMountedRef.current) {
                    loadingTask.destroy();
                    return;
                }

                if (pdfDocumentRef.current) {
                    await pdfDocumentRef.current.destroy().catch(() => undefined);
                }

                pdfDocumentRef.current = document;
                if (isMountedRef.current) {
                    setPdfDocument(document);
                    setTotalPages(document.numPages);
                    setCurrentPage(1);
                }

                const firstPage = await document.getPage(1);
                const viewport = firstPage.getViewport({ scale: 1 });
                const containerWidth = containerRef.current?.clientWidth ?? viewport.width;
                const autoScale = clamp((containerWidth - 32) / viewport.width, MIN_ZOOM, MAX_ZOOM);
                if (isMountedRef.current) {
                    setScale(autoScale);
                }
                await renderPage(1, document, autoScale);
            } catch (error) {
                if ((error as Error).name === 'AbortError') {
                    throw error;
                }
                loadingTask.destroy();
                if ((error as any)?.status === 401 && allowRetryOnUnauthorized) {
                    const refreshedStream = await refreshStreamingSession();
                    if (refreshedStream) {
                        return loadPdfDocument(refreshedStream, signal, false);
                    }

                    const refreshed = await refreshAccessToken();
                    if (refreshed) {
                        const streamAfterAuth =
                            (await refreshStreamingSession()) ?? stream;
                        return loadPdfDocument(streamAfterAuth, signal, false);
                    }
                    if (isMountedRef.current) {
                        setRenderError('Vaša sesija je istekla. Prijavite se ponovo kako biste nastavili čitanje.');
                    }
                    return;
                }
                throw error;
            } finally {
                if (signal) {
                    signal.removeEventListener('abort', abortHandler);
                }
                if (pdfLoadingTaskRef.current === loadingTask) {
                    pdfLoadingTaskRef.current = null;
                }
            }
        },
        [
            buildStreamingRequest,
            clamp,
            refreshAccessToken,
            refreshStreamingSession,
            renderPage,
        ]
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
                if (isMountedRef.current) {
                    setRenderError('Vaša sesija je istekla. Prijavite se ponovo kako biste nastavili čitanje.');
                }
                return;
            }
            if (isMountedRef.current) {
                setRenderError('Greška prilikom učitavanja dokumenta.');
            }
        });

        return () => {
            controller.abort();
        };
    }, [pdfDocument, data?.canAccess, data?.stream, loadPdfDocument, loadTrigger]);

    useEffect(() => {
        sessionAttemptRef.current = false;
        if (isMountedRef.current) {
            setSessionError(null);
        }
    }, [bookId, data?.canAccess]);

    useEffect(() => {
        hasAttemptedLoadRef.current = false;
        if (pdfLoadingTaskRef.current) {
            pdfLoadingTaskRef.current.destroy();
            pdfLoadingTaskRef.current = null;
        }
        if (pdfDocumentRef.current) {
            pdfDocumentRef.current.destroy().catch(() => undefined);
            pdfDocumentRef.current = null;
        }
        setPdfDocument(null);
        setRenderError(null);
        setCurrentPage(1);
        setTotalPages(0);
        const session = sessionIdRef.current;
        if (session) {
            endSessionMutate({ sessionId: session, pagesRead: maxVisitedPageRef.current });
        }
        sessionIdRef.current = null;
        setSessionId(null);
        setMaxVisitedPage(1);
        maxVisitedPageRef.current = 1;
        setLoadTrigger(prev => prev + 1);
    }, [bookId, endSessionMutate]);

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
            maxVisitedPageRef.current = currentPage;
        }
    }, [currentPage, maxVisitedPage]);

    useEffect(() => {
        if (!data?.canAccess || sessionId || isStartingSession) {
            return;
        }

        attemptStartSession();
    }, [attemptStartSession, data?.canAccess, isStartingSession, sessionId]);

    useEffect(() => {
        if (!sessionId || isUpdatingProgress) {
            return;
        }
        const timeout = window.setTimeout(() => {
            updateProgressMutate({ sessionId, currentPage });
        }, 600);

        return () => window.clearTimeout(timeout);
    }, [sessionId, currentPage, isUpdatingProgress, updateProgressMutate]);

    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    useEffect(() => {
        maxVisitedPageRef.current = maxVisitedPage;
    }, [maxVisitedPage]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;

            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
                renderTaskRef.current = null;
            }

            if (pdfLoadingTaskRef.current) {
                pdfLoadingTaskRef.current.destroy();
                pdfLoadingTaskRef.current = null;
            }

            if (pdfDocumentRef.current) {
                pdfDocumentRef.current.destroy().catch(() => undefined);
                pdfDocumentRef.current = null;
            }

            const session = sessionIdRef.current;
            if (session) {
                endSessionMutate({ sessionId: session, pagesRead: maxVisitedPageRef.current });
            }
        };
    }, [endSessionMutate]);

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
        if (pdfLoadingTaskRef.current) {
            pdfLoadingTaskRef.current.destroy();
            pdfLoadingTaskRef.current = null;
        }
        if (pdfDocumentRef.current) {
            pdfDocumentRef.current.destroy().catch(() => undefined);
            pdfDocumentRef.current = null;
        }
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
        if (isMountedRef.current) {
            setScale(computed);
        }
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
