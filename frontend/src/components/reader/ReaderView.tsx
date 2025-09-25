'use client';

import {
    type ChangeEvent,
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import {
    ArrowLeft,
    ArrowRight,
    Maximize2,
    Minus,
    Plus,
    ShieldAlert,
} from 'lucide-react';

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/useAuth';
import {
    useBookReadAccess,
    useEndReadingSession,
    useStartReadingSession,
    useUpdateReadingProgress,
} from '@/hooks/use-reader';
import type { SecureStreamDescriptor } from '@/types/reader';
import { API_CONFIG } from '@/utils/constants';
import { tokenManager } from '@/lib/api-client';

const PDFJS_VERSION = '4.10.38';
const PDF_ASSET_BASE = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/`;
const PDF_WORKER_SRC = `${PDF_ASSET_BASE}build/pdf.worker.min.js`;

if (pdfjs.GlobalWorkerOptions.workerSrc !== PDF_WORKER_SRC) {
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
}

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.4;

const DEVICE_BREAKPOINT_MOBILE = 640;
const DEVICE_BREAKPOINT_TABLET = 1024;

type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP';

interface PdfFileSource {
    url: string;
    httpHeaders?: Record<string, string>;
    withCredentials?: boolean;
}

interface PdfSourceState {
    file: PdfFileSource;
    options: Record<string, unknown>;
    signature: string;
}

interface ReaderViewProps {
    bookId: number;
}

const baseDocumentOptions = {
    cMapUrl: `${PDF_ASSET_BASE}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${PDF_ASSET_BASE}standard_fonts/`,
    wasmUrl: `${PDF_ASSET_BASE}pdf.wasm`,
    disableStream: false,
    disableAutoFetch: false,
    disableFontFace: false,
    useSystemFonts: false,
    isEvalSupported: true,
    maxImageSize: -1,
};

export function ReaderView({ bookId }: ReaderViewProps) {
    const { user } = useAuth();
    const router = useRouter();

    const containerRef = useRef<HTMLDivElement | null>(null);
    const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null);
    const isMountedRef = useRef(true);
    const sessionIdRef = useRef<number | null>(null);
    const maxVisitedPageRef = useRef(1);
    const lastStreamSignatureRef = useRef<string | null>(null);

    const [pdfSource, setPdfSource] = useState<PdfSourceState | null>(null);
    const [documentKey, setDocumentKey] = useState(0);
    const [isDocumentLoading, setIsDocumentLoading] = useState(false);
    const [documentProgress, setDocumentProgress] = useState(0);
    const [documentError, setDocumentError] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInputValue, setPageInputValue] = useState('1');
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1);
    const [isPageRendering, setIsPageRendering] = useState(false);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [maxVisitedPage, setMaxVisitedPage] = useState(1);

    const {
        data,
        isLoading,
        error,
        refetch: refetchReadAccess,
    } = useBookReadAccess(bookId);
    const { mutate: startSessionMutate, isPending: isStartingSession } = useStartReadingSession();
    const { mutate: updateProgressMutate } = useUpdateReadingProgress();
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

    const clamp = useCallback((value: number, min: number, max: number) => {
        return Math.min(max, Math.max(min, value));
    }, []);

    const detectDeviceType = useCallback((): DeviceType => {
        if (typeof window === 'undefined') {
            return 'DESKTOP';
        }
        const width = window.innerWidth;
        if (width <= DEVICE_BREAKPOINT_MOBILE) {
            return 'MOBILE';
        }
        if (width <= DEVICE_BREAKPOINT_TABLET) {
            return 'TABLET';
        }
        return 'DESKTOP';
    }, []);

    const buildStreamingRequest = useCallback(
        (stream: SecureStreamDescriptor) => {
            const headers: Record<string, string> = {
                Accept: 'application/pdf',
                ...(stream.headers ?? {}),
            };

            const token = tokenManager.getToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const requestUrl = stream.url.startsWith('http')
                ? stream.url
                : new URL(stream.url, API_CONFIG.BASE_URL).toString();

            let rangeChunkSize: number | undefined;
            const chunk = stream.chunkSize;
            if (typeof chunk === 'number' && Number.isFinite(chunk) && chunk > 0) {
                rangeChunkSize = chunk;
            }

            return { requestUrl, headers, rangeChunkSize };
        },
        []
    );

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
        } catch (err) {
            console.error('Failed to refresh authentication token for reader', err);
        }

        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:logout'));
        }
        return false;
    }, []);

    const ensureValidAccessToken = useCallback(async () => {
        const token = tokenManager.getToken();
        if (!token) {
            return true;
        }
        if (tokenManager.isTokenExpired(token)) {
            return refreshAccessToken();
        }
        return true;
    }, [refreshAccessToken]);

    const refreshStreamingSession = useCallback(async (): Promise<SecureStreamDescriptor | null> => {
        try {
            const result = await refetchReadAccess({ throwOnError: false });
            const refreshedData = result.data;
            const stream = refreshedData?.stream;

            if (
                refreshedData?.canAccess &&
                stream &&
                !('error' in stream)
            ) {
                return stream as SecureStreamDescriptor;
            }
        } catch (err) {
            console.error('Failed to refresh streaming session metadata', err);
        }
        return null;
    }, [refetchReadAccess]);

    const applyStream = useCallback(
        async (stream: SecureStreamDescriptor) => {
            if (!(await ensureValidAccessToken())) {
                if (isMountedRef.current) {
                    setDocumentError('Vaša sesija je istekla. Prijavite se ponovo kako biste nastavili čitanje.');
                }
                return;
            }

            const { requestUrl, headers, rangeChunkSize } = buildStreamingRequest(stream);
            const signature = `${requestUrl}|${stream.expiresAt ?? ''}|${stream.contentLength ?? ''}`;

            if (lastStreamSignatureRef.current === signature) {
                return;
            }

            lastStreamSignatureRef.current = signature;

            const source: PdfSourceState = {
                file: {
                    url: requestUrl,
                    httpHeaders: headers,
                    withCredentials: false,
                },
                options: {
                    ...baseDocumentOptions,
                    rangeChunkSize,
                },
                signature,
            };

            if (!isMountedRef.current) {
                return;
            }

            setPdfSource(source);
            setDocumentKey(prev => prev + 1);
            setIsDocumentLoading(true);
            setDocumentProgress(0);
            setDocumentError(null);
            setPageError(null);
            setNumPages(0);
            setCurrentPage(1);
            setPageInputValue('1');
            setMaxVisitedPage(1);
            maxVisitedPageRef.current = 1;
        },
        [buildStreamingRequest, ensureValidAccessToken]
    );

    const attemptStartSession = useCallback(() => {
        if (!data?.canAccess || sessionIdRef.current) {
            return;
        }

        setSessionError(null);

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
                },
                onError: err => {
                    console.error('Failed to start reading session', err);
                    if (isMountedRef.current) {
                        setSessionError('Nije moguće pokrenuti sesiju čitanja. Osvežite stranicu i pokušajte ponovo.');
                    }
                },
            }
        );
    }, [bookId, data?.canAccess, detectDeviceType, startSessionMutate]);

    const extractStatusCode = useCallback((err: unknown): number | null => {
        const source = err as { status?: number; code?: number; message?: string; target?: { status?: number } } | undefined;
        if (!source) {
            return null;
        }
        if (typeof source.status === 'number') {
            return source.status;
        }
        if (typeof source.code === 'number') {
            return source.code;
        }
        if (typeof source.target?.status === 'number') {
            return source.target.status;
        }
        if (typeof source.message === 'string') {
            const match = source.message.match(/(4\d\d)/);
            if (match) {
                return Number(match[1]);
            }
        }
        return null;
    }, []);

    const computeFitToWidth = useCallback(
        async (pageNumber: number, doc?: PDFDocumentProxy | null) => {
            const pdf = doc ?? pdfDocumentRef.current;
            if (!pdf) {
                return;
            }
            try {
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 1 });
                const containerWidth = containerRef.current?.clientWidth ?? viewport.width;
                const padding = 32;
                const availableWidth = Math.max(containerWidth - padding, 320);
                const computed = clamp(availableWidth / viewport.width, MIN_ZOOM, MAX_ZOOM);
                if (isMountedRef.current) {
                    setScale(computed);
                }
            } catch (err) {
                console.warn('Failed to compute fit to width', err);
            }
        },
        [clamp]
    );

    const handleDocumentLoadSuccess = useCallback(
        async (pdf: PDFDocumentProxy) => {
            if (pdfDocumentRef.current && pdfDocumentRef.current !== pdf) {
                try {
                    await pdfDocumentRef.current.destroy();
                } catch (err) {
                    console.warn('Error destroying previous PDF document', err);
                }
            }

            pdfDocumentRef.current = pdf;

            if (!isMountedRef.current) {
                return;
            }

            setIsDocumentLoading(false);
            setDocumentProgress(100);
            setDocumentError(null);
            setPageError(null);
            setNumPages(pdf.numPages);
            setCurrentPage(1);
            setPageInputValue('1');
            setIsPageRendering(true);
            setMaxVisitedPage(1);
            maxVisitedPageRef.current = 1;

            await computeFitToWidth(1, pdf);
        },
        [computeFitToWidth]
    );

    const handleDocumentError = useCallback(
        async (err: Error) => {
            console.error('PDF document load error', err);
            if (!isMountedRef.current) {
                return;
            }

            setIsDocumentLoading(false);
            setDocumentProgress(0);
            setNumPages(0);

            const statusCode = extractStatusCode(err);
            const message = err?.message ?? '';
            const name = err?.name ?? '';

            const isPdfCorrupted =
                name === 'InvalidPDFException' ||
                /invalid.*root.*reference|corrupted.*pdf|malformed.*pdf|invalid.*pdf.*structure/i.test(message) ||
                /pdf.*header.*not.*found|missing.*pdf.*header|invalid.*pdf.*version/i.test(message);

            if (isPdfCorrupted) {
                setDocumentError('Ovaj PDF fajl je oštećen ili ima neispravnu strukturu. Kontaktirajte administratora.');
                return;
            }

            const isUnauthorized =
                statusCode === 401 ||
                statusCode === 403 ||
                /401|403|unauthorized|forbidden/i.test(message);

            if (isUnauthorized) {
                const refreshed = await refreshAccessToken();
                const refreshedStream = (await refreshStreamingSession()) ?? null;

                if (refreshed && refreshedStream) {
                    lastStreamSignatureRef.current = null;
                    await applyStream(refreshedStream);
                    return;
                }

                if (refreshedStream) {
                    lastStreamSignatureRef.current = null;
                    await applyStream(refreshedStream);
                    return;
                }

                setDocumentError('Vaša sesija je istekla. Prijavite se ponovo kako biste nastavili čitanje.');
                return;
            }

            setDocumentError('Greška prilikom učitavanja dokumenta. Pokušajte ponovo.');
        },
        [applyStream, extractStatusCode, refreshAccessToken, refreshStreamingSession]
    );

    const handleDocumentProgress = useCallback((progress: { loaded: number; total: number }) => {
        if (!progress || typeof progress.total !== 'number' || progress.total <= 0) {
            return;
        }
        const percent = Math.min(100, Math.round((progress.loaded / progress.total) * 100));
        setDocumentProgress(percent);
    }, []);

    const handlePageRenderSuccess = useCallback(() => {
        if (!isMountedRef.current) {
            return;
        }
        setIsPageRendering(false);
        setPageError(null);
    }, []);

    const handlePageRenderError = useCallback((err: Error) => {
        console.error('PDF page render error', err);
        if (!isMountedRef.current) {
            return;
        }
        setIsPageRendering(false);
        setPageError('Stranica nije mogla da se prikaže. Pokušajte ponovo.');
    }, []);

    const handlePrevious = () => {
        setCurrentPage(prev => (prev > 1 ? prev - 1 : prev));
    };

    const handleNext = () => {
        setCurrentPage(prev => (prev < numPages ? prev + 1 : prev));
    };

    const handleZoom = (direction: 'in' | 'out') => {
        setScale(prev => {
            const next = direction === 'in' ? prev + ZOOM_STEP : prev - ZOOM_STEP;
            return clamp(next, MIN_ZOOM, MAX_ZOOM);
        });
    };

    const handleFitToWidth = () => {
        void computeFitToWidth(currentPage);
    };

    const handlePageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPageInputValue(event.target.value);
    };

    const handlePageInputSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const parsed = Number(pageInputValue);
        if (!Number.isFinite(parsed)) {
            setPageInputValue(String(currentPage));
            return;
        }
        const target = clamp(parsed, 1, numPages || 1);
        setCurrentPage(target);
    };

    const handleRetryLoad = () => {
        setDocumentError(null);
        setPageError(null);
        lastStreamSignatureRef.current = null;
        if (data?.stream && !('error' in data.stream)) {
            void applyStream(data.stream as SecureStreamDescriptor);
            return;
        }
        void refreshStreamingSession().then(stream => {
            if (stream) {
                void applyStream(stream);
            }
        });
    };

    const handleRetrySession = () => {
        sessionIdRef.current = null;
        setSessionId(null);
        attemptStartSession();
    };

    const handleBackToLibrary = () => {
        router.push('/dashboard');
    };

    useEffect(() => {
        if (!data?.canAccess || !data.stream || 'error' in data.stream) {
            return;
        }

        void applyStream(data.stream as SecureStreamDescriptor);
    }, [applyStream, data?.canAccess, data?.stream]);

    useEffect(() => {
        if (!data?.canAccess || sessionIdRef.current) {
            return;
        }
        attemptStartSession();
    }, [attemptStartSession, data?.canAccess]);

    useEffect(() => {
        if (!sessionId) {
            return;
        }
        const timeout = window.setTimeout(() => {
            updateProgressMutate({ sessionId, currentPage });
        }, 600);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [sessionId, currentPage, updateProgressMutate]);

    useEffect(() => {
        if (currentPage > maxVisitedPage) {
            setMaxVisitedPage(currentPage);
            maxVisitedPageRef.current = currentPage;
        }
    }, [currentPage, maxVisitedPage]);

    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    useEffect(() => {
        maxVisitedPageRef.current = maxVisitedPage;
    }, [maxVisitedPage]);

    useEffect(() => {
        setPageInputValue(String(currentPage));
        if (numPages) {
            setIsPageRendering(true);
        }
    }, [currentPage, numPages, scale]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            const session = sessionIdRef.current;
            if (session) {
                endSessionMutate({ sessionId: session, pagesRead: maxVisitedPageRef.current });
            }
            const cleanup = async () => {
                if (pdfDocumentRef.current) {
                    try {
                        await pdfDocumentRef.current.destroy();
                    } catch (err) {
                        console.warn('Error destroying PDF document on unmount', err);
                    }
                    pdfDocumentRef.current = null;
                }
            };
            void cleanup();
        };
    }, [endSessionMutate]);

    useEffect(() => {
        if (numPages && currentPage > numPages) {
            setCurrentPage(numPages);
        }
    }, [numPages, currentPage]);

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
                <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
                    <Input
                        value={pageInputValue}
                        onChange={handlePageInputChange}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="h-7 w-16 bg-transparent text-center text-sm"
                        aria-label="Skok na stranu"
                    />
                    <span className="whitespace-nowrap text-xs text-white/70">/ {numPages || '…'}</span>
                </form>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={currentPage >= numPages}
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

    const renderWatermark = () => (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <span
                className="select-none text-4xl font-bold uppercase tracking-[0.6em] text-white/10"
                style={{
                    transform: 'rotate(-24deg)',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                }}
            >
                {watermarkLabel}
            </span>
        </div>
    );

    const renderDocument = () => {
        if (!pdfSource) {
            return null;
        }

        return (
            <Document
                key={documentKey}
                file={pdfSource.file}
                options={pdfSource.options}
                loading={null}
                error={null}
                onLoadSuccess={handleDocumentLoadSuccess}
                onLoadError={handleDocumentError}
                onSourceError={handleDocumentError}
                onLoadProgress={handleDocumentProgress}
                className="flex justify-center"
                externalLinkTarget="_blank"
            >
                <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderAnnotationLayer
                    renderTextLayer
                    loading={null}
                    onRenderSuccess={handlePageRenderSuccess}
                    onRenderError={handlePageRenderError}
                    onLoadSuccess={(page: PDFPageProxy) => {
                        // Ensure annotation/text layers stay hydrated when page changes
                        if (!isMountedRef.current) {
                            return;
                        }
                        setPageError(null);
                        // When jumping to a page ensure the view is centered
                        const viewport = page.getViewport({ scale: 1 });
                        const container = containerRef.current;
                        if (container) {
                            const availableHeight = container.clientHeight;
                            const targetScrollTop = Math.max(0, (viewport.height * scale - availableHeight) / 2);
                            container.scrollTop = targetScrollTop;
                        }
                    }}
                />
            </Document>
        );
    };

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
                        <div className="relative flex w-full justify-center">
                            {renderDocument()}
                            {watermarkLabel && renderWatermark()}
                        </div>

                        {(isDocumentLoading || isPageRendering) && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                                <div className="flex flex-col items-center gap-2 text-white">
                                    <LoadingSpinner size="lg" />
                                    {isDocumentLoading && documentProgress > 0 && (
                                        <span className="text-xs text-white/80">Učitavanje… {documentProgress}%</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {(documentError || pageError) && !isDocumentLoading && !isPageRendering && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-4 rounded-xl bg-red-500/20 px-6 py-5 text-center text-sm text-red-100 shadow-lg">
                                    <span>{documentError ?? pageError}</span>
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
