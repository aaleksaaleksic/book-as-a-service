'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Component, ErrorInfo, ReactNode } from 'react';
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
import type {
    PDFDocumentProxy,
    RenderTask,
    PDFDocumentLoadingTask,
} from 'pdfjs-dist/types/src/display/api';
import type { SecureStreamDescriptor } from '@/types/reader';
import { API_CONFIG } from '@/utils/constants';
import { tokenManager } from '@/lib/api-client';

const pdfjsLibPromise: Promise<typeof import('pdfjs-dist/webpack.mjs')> = import(
    'pdfjs-dist/webpack.mjs'
).catch(error => {
    console.error('Failed to load PDF.js library:', error);
    throw new Error('PDF reader library failed to load. Please refresh the page and try again.');
});

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.4;

type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP';

interface ReaderViewProps {
    bookId: number;
}

interface PDFErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class PDFErrorBoundary extends Component<{ children: ReactNode; onError: (error: string) => void }, PDFErrorBoundaryState> {
    constructor(props: { children: ReactNode; onError: (error: string) => void }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): PDFErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('PDF Error Boundary caught an error:', error, errorInfo);

        const errorName = error?.name ?? '';
        const message = error?.message ?? '';

        // Check for PDF corruption errors
        const isPdfCorrupted =
            errorName === 'InvalidPDFException' ||
            /invalid.*root.*reference|corrupted.*pdf|malformed.*pdf|invalid.*pdf.*structure/i.test(message) ||
            /pdf.*header.*not.*found|missing.*pdf.*header|invalid.*pdf.*version/i.test(message);

        if (isPdfCorrupted) {
            this.props.onError('Ovaj PDF fajl je oštećen ili ima neispravnu strukturu. Kontaktirajte administratora.');
        } else {
            this.props.onError('Greška prilikom učitavanja dokumenta. Pokušajte ponovo.');
        }
    }

    componentDidUpdate(prevProps: { children: ReactNode; onError: (error: string) => void }) {
        if (prevProps.children !== this.props.children && this.state.hasError) {
            this.setState({ hasError: false, error: undefined });
        }
    }

    render() {
        if (this.state.hasError) {
            return null; // Let parent handle error display
        }

        return this.props.children;
    }
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
    const [pdfInitError, setPdfInitError] = useState<string | null>(null);

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
            console.log('renderPage called:', { pageNumber, zoom, canvasExists: !!canvasRef.current, hasRenderTask: !!renderTaskRef.current });

            if (!canvasRef.current) {
                console.log('No canvas reference found');
                return;
            }

            // Use ref to check rendering state to avoid dependency issues
            if (renderTaskRef.current) {
                console.log('Already rendering, skipping this render call');
                return;
            }

            const canvas = canvasRef.current;
            console.log('Canvas element:', canvas, 'dimensions:', canvas.width, 'x', canvas.height);

            const context = canvas.getContext('2d', { alpha: false });
            if (!context) {
                console.log('Failed to get 2D context');
                return;
            }
            console.log('Canvas context obtained:', context);

            if (renderTaskRef.current) {
                console.log('Cancelling previous render task');
                renderTaskRef.current.cancel();
            }

            let task: RenderTask | null = null;
            try {
                if (isMountedRef.current) {
                    console.log('Setting isRendering to true');
                    setIsRendering(true);
                }
                console.log('Getting page', pageNumber, 'from PDF');
                const page = await pdf.getPage(pageNumber);
                console.log('Page obtained:', page);

                const viewport = page.getViewport({ scale: zoom });
                console.log('Viewport created:', { width: viewport.width, height: viewport.height, scale: zoom });

                canvas.height = viewport.height;
                canvas.width = viewport.width;
                console.log('Canvas resized to:', canvas.width, 'x', canvas.height);

                console.log('Starting render task...');
                task = page.render({
                    canvasContext: context,
                    viewport,
                    intent: 'print', // Use print intent to avoid font loading issues
                    renderInteractiveForms: false,
                    optionalContentConfigPromise: null,
                });
                renderTaskRef.current = task;
                console.log('Render task created:', task);

                console.log('Waiting for render task to complete...');

                // Add timeout to detect hanging render tasks
                const renderPromise = task.promise;
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Render task timeout after 30 seconds')), 30000);
                });

                await Promise.race([renderPromise, timeoutPromise]);
                console.log('Render task completed successfully');

                if (watermarkLabel) {
                    console.log('Adding watermark:', watermarkLabel);
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
                    console.log('Watermark added');
                } else {
                    console.log('No watermark to add');
                }

                renderTaskRef.current = null;
                if (isMountedRef.current) {
                    setRenderError(null);
                    console.log('Setting isRendering to false');
                    setIsRendering(false);
                }
                console.log('renderPage completed successfully');
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
                    console.log('Finally block: Setting isRendering to false');
                    setIsRendering(false);
                }
            }
        },
        [watermarkLabel]
    );

    const buildStreamingRequest = useCallback(
        (stream: SecureStreamDescriptor) => {
            const headers: Record<string, string> = {
                Accept: 'application/pdf',
            };

            if (stream.headers && typeof stream.headers === 'object') {
                for (const [key, value] of Object.entries(stream.headers)) {
                    if (typeof value === 'string' && key) {
                        headers[key] = value;
                    }
                }
            }

            const token = tokenManager.getToken();
            let requestUrl =
                bookId > 0
                    ? `/api/reader/${bookId}/content`
                    : stream.url.startsWith('http')
                        ? stream.url
                        : new URL(stream.url, API_CONFIG.BASE_URL).toString();

            if (token) {
                headers.Authorization = `Bearer ${token}`;
                if (bookId > 0) {
                    headers['X-Readify-Auth'] = token;

                    // Add token as query parameter for local API routes
                    if (requestUrl.includes('/api/reader/')) {
                        const separator = requestUrl.includes('?') ? '&' : '?';
                        requestUrl = `${requestUrl}${separator}authToken=${encodeURIComponent(token)}`;
                    }
                }
            }

            const rangeChunkSize =
                typeof stream.chunkSize === 'number' && stream.chunkSize > 0
                    ? stream.chunkSize
                    : undefined;

            return { requestUrl, headers, rangeChunkSize };
        },
        [bookId]
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

    const loadPdfDocument = useCallback(
        async (
            stream: SecureStreamDescriptor,
            signal?: AbortSignal,
            allowRetryOnUnauthorized = true
        ) => {
            let pdfjs;
            try {
                pdfjs = await pdfjsLibPromise;
            } catch (error) {
                console.error('Failed to load PDF.js library:', error);
                if (isMountedRef.current) {
                    setRenderError('Greška prilikom učitavanja PDF čitača. Osvežite stranicu i pokušajte ponovo.');
                }
                return;
            }

            if (isMountedRef.current) {
                setRenderError(null);
            }

            if (!(await ensureValidAccessToken())) {
                if (isMountedRef.current) {
                    setRenderError('Vaša sesija je istekla. Prijavite se ponovo kako biste nastavili čitanje.');
                }
                return;
            }

            const { requestUrl, headers, rangeChunkSize } = buildStreamingRequest(stream);
            console.log('PDF loading request details:', { requestUrl, headers, rangeChunkSize });

            if (signal?.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }

            console.log('Fetching PDF data directly...');
            // Fetch the PDF data directly to avoid PDF.js network issues
            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: headers,
                credentials: 'include',
                signal: signal
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
            }

            console.log('PDF data fetched, converting to ArrayBuffer...');
            const pdfData = await response.arrayBuffer();
            console.log('PDF ArrayBuffer size:', pdfData.byteLength);

            if (signal?.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }

            console.log('Starting PDF.js document loading with ArrayBuffer...');
            const loadingTask = pdfjs.getDocument({
                data: pdfData, // Use raw data instead of URL
                disableAutoFetch: true,
                disableStream: false,
                disableRange: true, // Not needed since we have the full data
                isEvalSupported: false,
                useWorkerFetch: false,
                stopAtErrors: false,
                verbosity: 1,
                cMapUrl: undefined,
                standardFontDataUrl: undefined,
            });
            pdfLoadingTaskRef.current = loadingTask;
            console.log('PDF loading task created:', loadingTask);

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
                console.log('Waiting for PDF document to load...');
                const document = await loadingTask.promise;
                console.log('PDF document loaded successfully:', document);
                console.log('PDF document details:', {
                    numPages: document.numPages,
                    fingerprints: document.fingerprints,
                    encrypted: document.encrypted
                });

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
                    console.log('PDF state updated in React:', { totalPages: document.numPages });
                }

                console.log('Getting first page...');
                const firstPage = await document.getPage(1);
                console.log('First page loaded:', firstPage);

                const viewport = firstPage.getViewport({ scale: 1 });
                console.log('Viewport details:', { width: viewport.width, height: viewport.height });

                const containerWidth = containerRef.current?.clientWidth ?? viewport.width;
                const autoScale = clamp((containerWidth - 32) / viewport.width, MIN_ZOOM, MAX_ZOOM);
                console.log('Auto scale calculated:', autoScale, 'container width:', containerWidth);

                if (isMountedRef.current) {
                    setScale(autoScale);
                }

                console.log('Starting page render...');
                await renderPage(1, document, autoScale);
                console.log('Page render completed successfully');
            } catch (error) {
                if ((error as Error).name === 'AbortError') {
                    throw error;
                }

                const statusCode = typeof (error as any)?.status === 'number' ? (error as any).status : null;
                const message = (error as Error)?.message ?? '';
                const errorName = (error as Error)?.name ?? '';
                const UnexpectedResponseException = pdfjs.UnexpectedResponseException;

                // Check for PDF corruption errors
                const isPdfCorrupted =
                    errorName === 'InvalidPDFException' ||
                    /invalid.*root.*reference|corrupted.*pdf|malformed.*pdf|invalid.*pdf.*structure/i.test(message) ||
                    /pdf.*header.*not.*found|missing.*pdf.*header|invalid.*pdf.*version/i.test(message);

                const isUnauthorizedError =
                    statusCode === 401 ||
                    statusCode === 403 ||
                    (UnexpectedResponseException &&
                        error instanceof UnexpectedResponseException &&
                        ([401, 403] as const).includes((error as any).status)) ||
                    /401|403|unauthorized|forbidden/i.test(message);

                loadingTask.destroy();

                // Handle PDF corruption errors
                if (isPdfCorrupted) {
                    console.error('PDF file is corrupted or has invalid structure:', error);
                    if (isMountedRef.current) {
                        setRenderError('Ovaj PDF fajl je oštećen ili ima neispravnu strukturu. Kontaktirajte administratora.');
                    }
                    return;
                }

                if (isUnauthorizedError && allowRetryOnUnauthorized) {
                    const refreshedStream = await refreshStreamingSession();
                    if (refreshedStream) {
                        await loadPdfDocument(refreshedStream, signal, false);
                        return;
                    }

                    const refreshed = await refreshAccessToken();
                    if (refreshed) {
                        const streamAfterAuth =
                            (await refreshStreamingSession()) ?? stream;
                        await loadPdfDocument(streamAfterAuth, signal, false);
                        return;
                    }

                    if (isMountedRef.current) {
                        setRenderError('Vaša sesija je istekla. Prijavite se ponovo kako biste nastavili čitanje.');
                    }
                    return;
                }

                if (isUnauthorizedError) {
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
            ensureValidAccessToken,
            refreshAccessToken,
            refreshStreamingSession,
            renderPage,
        ]
    );

    useEffect(() => {
        console.log('PDF loading useEffect triggered:', {
            hasPdfDocument: !!pdfDocument,
            canAccess: data?.canAccess,
            hasStream: !!data?.stream,
            hasStreamError: data?.stream && 'error' in data.stream,
            hasAttempted: hasAttemptedLoadRef.current,
            loadTrigger
        });

        if (
            pdfDocument ||
            !data?.canAccess ||
            !data.stream ||
            'error' in data.stream ||
            hasAttemptedLoadRef.current
        ) {
            console.log('PDF loading useEffect skipped');
            return;
        }

        console.log('PDF loading useEffect executing...');
        const controller = new AbortController();

        hasAttemptedLoadRef.current = true;

        loadPdfDocument(data.stream as SecureStreamDescriptor, controller.signal).catch(err => {
            if ((err as Error).name === 'AbortError') {
                return;
            }
            console.error('Failed to load PDF document', err);

            const errorName = (err as Error)?.name ?? '';
            const message = (err as Error)?.message ?? '';

            // Check for PDF corruption errors
            const isPdfCorrupted =
                errorName === 'InvalidPDFException' ||
                /invalid.*root.*reference|corrupted.*pdf|malformed.*pdf|invalid.*pdf.*structure/i.test(message) ||
                /pdf.*header.*not.*found|missing.*pdf.*header|invalid.*pdf.*version/i.test(message);

            if (isPdfCorrupted) {
                if (isMountedRef.current) {
                    setRenderError('Ovaj PDF fajl je oštećen ili ima neispravnu strukturu. Kontaktirajte administratora.');
                }
                return;
            }

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
    }, [bookId]);

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
        console.log('Session start useEffect triggered:', {
            canAccess: data?.canAccess,
            sessionId,
            isStartingSession
        });

        if (!data?.canAccess || sessionId || isStartingSession) {
            console.log('Session start useEffect skipped');
            return;
        }

        console.log('Session start useEffect executing...');
        attemptStartSession();
    }, [attemptStartSession, data?.canAccess, isStartingSession, sessionId]);

    useEffect(() => {
        console.log('Progress update useEffect triggered:', {
            sessionId,
            currentPage,
            isUpdatingProgress
        });

        if (!sessionId) {
            console.log('Progress update useEffect skipped - no session');
            return;
        }

        // Don't update if already updating (but don't include isUpdatingProgress in deps to avoid loop)
        if (isUpdatingProgress) {
            console.log('Progress update useEffect skipped - already updating');
            return;
        }

        console.log('Progress update useEffect scheduling update...');
        const timeout = window.setTimeout(() => {
            console.log('Executing progress update:', { sessionId, currentPage });
            updateProgressMutate({ sessionId, currentPage });
        }, 600);

        return () => {
            console.log('Progress update useEffect cleanup');
            window.clearTimeout(timeout);
        };
    }, [sessionId, currentPage, updateProgressMutate]); // Removed isUpdatingProgress from deps

    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    useEffect(() => {
        maxVisitedPageRef.current = maxVisitedPage;
    }, [maxVisitedPage]);

    useEffect(() => {
        // Immediate check for PDF.js module errors
        const checkPDFJSErrors = async () => {
            try {
                console.log('Checking PDF.js module loading...');
                // Try to load PDF.js immediately to catch any initialization errors
                await pdfjsLibPromise;
                console.log('PDF.js module loaded successfully');
            } catch (error) {
                console.error('PDF.js module failed to load during initial check:', error);
                const errorName = (error as Error)?.name ?? '';
                const message = (error as Error)?.message ?? '';

                const isPdfCorrupted =
                    errorName === 'InvalidPDFException' ||
                    /invalid.*root.*reference|corrupted.*pdf|malformed.*pdf|invalid.*pdf.*structure/i.test(message);

                console.log('Initial PDF.js error - isPdfCorrupted:', isPdfCorrupted, 'errorName:', errorName);

                if (isPdfCorrupted) {
                    const errorMsg = 'Ovaj PDF fajl je oštećen ili ima neispravnu strukturu. Kontaktirajte administratora.';
                    console.log('Setting initial PDF corruption error:', errorMsg);
                    setPdfInitError(errorMsg);
                } else {
                    const errorMsg = 'Greška prilikom učitavanja PDF čitača. Osvežite stranicu i pokušajte ponovo.';
                    console.log('Setting initial PDF loading error:', errorMsg);
                    setPdfInitError(errorMsg);
                }
            }
        };

        checkPDFJSErrors();

        // Global error handler for unhandled PDF.js promise rejections
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = event.reason;
            const errorName = error?.name ?? '';
            const message = error?.message ?? '';

            console.log('Unhandled rejection detected:', { errorName, message, error });

            // Check if this is a PDF-related error
            if (errorName === 'InvalidPDFException' || /pdf/i.test(message)) {
                event.preventDefault(); // Prevent default browser handling

                const isPdfCorrupted =
                    errorName === 'InvalidPDFException' ||
                    /invalid.*root.*reference|corrupted.*pdf|malformed.*pdf|invalid.*pdf.*structure/i.test(message) ||
                    /pdf.*header.*not.*found|missing.*pdf.*header|invalid.*pdf.*version/i.test(message);

                console.error('Unhandled PDF promise rejection caught:', error);
                console.log('Setting error state - isPdfCorrupted:', isPdfCorrupted, 'isMounted:', isMountedRef.current);

                if (isMountedRef.current) {
                    if (isPdfCorrupted) {
                        const errorMsg = 'Ovaj PDF fajl je oštećen ili ima neispravnu strukturu. Kontaktirajte administratora.';
                        console.log('Setting PDF corruption error:', errorMsg);
                        setRenderError(errorMsg);
                        setPdfInitError(errorMsg);
                    } else {
                        const errorMsg = 'Greška prilikom učitavanja dokumenta. Pokušajte ponovo.';
                        console.log('Setting generic PDF error:', errorMsg);
                        setRenderError(errorMsg);
                        setPdfInitError(errorMsg);
                    }
                }
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
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
        setPdfInitError(null);
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
                        <PDFErrorBoundary onError={(error) => setRenderError(error)}>
                            <canvas
                                ref={canvasRef}
                                className="w-full rounded-xl bg-white shadow-2xl"
                                aria-label={`Strana ${currentPage} od ${totalPages}`}
                            />
                        </PDFErrorBoundary>
                        {isRendering && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                                <LoadingSpinner size="lg" />
                            </div>
                        )}
                        {(renderError || pdfInitError) && !isRendering && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-4 rounded-xl bg-red-500/20 px-6 py-5 text-center text-sm text-red-100 shadow-lg">
                                    <span>{renderError || pdfInitError}</span>
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
