"use client";

import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import dynamic from "next/dynamic";
import type { DocumentProps } from "react-pdf";
import type { OnDocumentLoadSuccess } from "react-pdf/dist/shared/types.js";

const Document = dynamic(() => import("react-pdf").then(mod => ({ default: mod.Document })), {
    ssr: false,
    loading: () => (
        <div className="flex h-full min-h-[60vh] items-center justify-center">
            <div className="text-center">Loading PDF viewer...</div>
        </div>
    ),
});

const Page = dynamic(() => import("react-pdf").then(mod => ({ default: mod.Page })), {
    ssr: false,
});
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { tokenManager } from "@/lib/api-client";
import type { ReaderWatermark, SecureStreamDescriptor } from "@/types/reader";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";


const MIN_SCALE = 0.75;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;

export interface ReaderViewProps {
    bookId: number;
    bookTitle?: string;
    stream?: SecureStreamDescriptor | { error: string } | null;
    watermark?: ReaderWatermark | null;
    fallbackPreview?: string | null;
    onPageChange?: (page: number) => void;
    className?: string;
}

type PdfSource = DocumentProps["file"] | null;

const createAuthorizedHeaders = (stream?: SecureStreamDescriptor | null) => {
    if (!stream) {
        return null;
    }

    const headers = new Headers(stream.headers ?? {});
    const token = tokenManager.getToken();

    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
};

const ReaderViewComponent: React.FC<ReaderViewProps> = ({
    bookId,
    bookTitle,
    stream,
    watermark,
    fallbackPreview,
    onPageChange,
    className,
}) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageInput, setPageInput] = useState<string>("1");
    const [scale, setScale] = useState<number>(1.1);
    const [isDocumentLoading, setIsDocumentLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string | null>(() => {
        if (!stream) {
            return "Trenutno nije moguće učitati bezbedan tok za ovu knjigu.";
        }
        if ("error" in stream) {
            return stream.error || "Pristup knjizi je trenutno onemogućen.";
        }
        return null;
    });
    const [progress, setProgress] = useState<number>(0);
    const [fallbackData, setFallbackData] = useState<Uint8Array | null>(null);
    const [isFallbackLoading, setIsFallbackLoading] = useState<boolean>(false);
    const [isClient, setIsClient] = useState<boolean>(false);

    const pdfRef = useRef<Parameters<OnDocumentLoadSuccess>[0] | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const hasTriedFallbackRef = useRef<boolean>(false);

    const secureStream = useMemo<SecureStreamDescriptor | null>(() => {
        if (!stream || "error" in stream) {
            return null;
        }
        return stream;
    }, [stream]);

    const authorizedHeaders = useMemo(() => {
        if (!secureStream) {
            return null;
        }
        return createAuthorizedHeaders(secureStream);
    }, [secureStream]);

    const authorizedHeadersRecord = useMemo(() => {
        if (!authorizedHeaders) {
            return undefined;
        }

        return Array.from(authorizedHeaders.entries()).reduce<Record<string, string>>(
            (acc, [key, value]) => {
                acc[key] = value;
                return acc;
            },
            {}
        );
    }, [authorizedHeaders]);

    useEffect(() => {
        setIsClient(true);

        // Configure PDF.js worker on client side only
        const configurePdfWorker = async () => {
            const { pdfjs } = await import("react-pdf");
            // Use CDN version that matches the react-pdf version
            pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.mjs`;
        };

        configurePdfWorker().catch(console.error);
    }, []);

    const pdfSource: PdfSource = useMemo(() => {
        if (!secureStream) {
            return null;
        }

        return secureStream.url;
    }, [secureStream]);

    useEffect(() => {
        setLoadError(prev => {
            if (!stream) {
                return "Trenutno nije moguće učitati bezbedan tok za ovu knjigu.";
            }
            if (stream && "error" in stream) {
                return stream.error || "Pristup knjizi je trenutno onemogućen.";
            }
            if (prev && !hasTriedFallbackRef.current) {
                return prev;
            }
            return null;
        });
        setFallbackData(null);
        hasTriedFallbackRef.current = false;
        setPageNumber(1);
        setPageInput("1");
        setProgress(0);
        setIsDocumentLoading(true);
    }, [bookId, stream]);

    useEffect(() => {
        setPageInput(String(pageNumber));
    }, [pageNumber]);

    const onPageChangeRef = useRef(onPageChange);

    useEffect(() => {
        onPageChangeRef.current = onPageChange;
    }, [onPageChange]);

    useEffect(() => {
        onPageChangeRef.current?.(pageNumber);
    }, [pageNumber]);

    useEffect(() => {
        return () => {
            if (pdfRef.current) {
                pdfRef.current.destroy().catch(() => {
                    // ignore cleanup errors
                });
                pdfRef.current = null;
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const baseDocumentOptions = useMemo(() => {
        const options: DocumentProps["options"] = {};
        const cMapUrl = process.env.NEXT_PUBLIC_PDF_CMAP_URL;
        const standardFontDataUrl = process.env.NEXT_PUBLIC_PDF_STANDARD_FONT_URL;
        const wasmUrl = process.env.NEXT_PUBLIC_PDF_WASM_URL;

        if (cMapUrl) {
            options.cMapUrl = cMapUrl;
            options.cMapPacked = true;
        }
        if (standardFontDataUrl) {
            options.standardFontDataUrl = standardFontDataUrl;
        }
        if (wasmUrl) {
            options.wasmUrl = wasmUrl;
        }

        return Object.keys(options).length ? options : undefined;
    }, []);

    const streamDocumentOptions = useMemo(() => {
        if (!secureStream) {
            return undefined;
        }

        const options: DocumentProps["options"] = {};

        if (authorizedHeadersRecord) {
            options.httpHeaders = authorizedHeadersRecord;
        }

        options.withCredentials = false;
        options.length = secureStream.contentLength;
        options.rangeChunkSize = secureStream.chunkSize;

        return Object.keys(options).length ? options : undefined;
    }, [secureStream, authorizedHeadersRecord]);

    const documentOptions = useMemo(() => {
        if (!baseDocumentOptions && !streamDocumentOptions) {
            return undefined;
        }

        return {
            ...(baseDocumentOptions ?? {}),
            ...(streamDocumentOptions ?? {}),
        } satisfies DocumentProps["options"];
    }, [baseDocumentOptions, streamDocumentOptions]);

    const handleDocumentLoadSuccess: OnDocumentLoadSuccess = useCallback((document) => {
        if (pdfRef.current && pdfRef.current !== document) {
            pdfRef.current.destroy().catch(() => undefined);
        }
        pdfRef.current = document;
        setNumPages(document.numPages);
        setPageNumber(current => Math.min(current, document.numPages));
        setIsDocumentLoading(false);
        setLoadError(null);
    }, []);

    const handleDocumentLoadError = useCallback(
        (error: Error) => {
            console.error("PDF load error", error);
            setIsDocumentLoading(false);
            if (!stream || "error" in stream) {
                setLoadError(
                    error.message || "Došlo je do greške prilikom učitavanja dokumenta."
                );
                return;
            }

            if (!hasTriedFallbackRef.current) {
                hasTriedFallbackRef.current = true;

                const tryFallback = async () => {
                    setIsFallbackLoading(true);
                    const controller = new AbortController();
                    abortControllerRef.current = controller;

                    try {
                        if (!secureStream) {
                            throw new Error("Nema dostupnog toka za preuzimanje dokumenta.");
                        }

                        const headers = createAuthorizedHeaders(secureStream);
                        const response = await fetch(secureStream.url, {
                            method: "GET",
                            headers: headers ?? undefined,
                            signal: controller.signal,
                            cache: "no-store",
                        });

                        if (!response.ok) {
                            throw new Error(
                                `Neuspešno preuzimanje dokumenta (${response.status}).`
                            );
                        }

                        const arrayBuffer = await response.arrayBuffer();
                        setFallbackData(new Uint8Array(arrayBuffer));
                        setLoadError(null);
                        setIsDocumentLoading(false);
                    } catch (fallbackError) {
                        console.error("Fallback PDF download failed", fallbackError);
                        setLoadError(
                            "Neuspešno učitavanje knjige. Proverite internet vezu i pokušajte ponovo."
                        );
                    } finally {
                        setIsFallbackLoading(false);
                        abortControllerRef.current = null;
                    }
                };

                void tryFallback();
            } else {
                setLoadError(
                    error.message || "Neuspešno učitavanje knjige. Pokušajte ponovo kasnije."
                );
            }
        },
        [stream, secureStream]
    );

    const handleProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
        if (total > 0) {
            setProgress(Math.round((loaded / total) * 100));
        }
    }, []);

    const goToPage = useCallback(
        (nextPage: number) => {
            setPageNumber(prev => {
                if (nextPage === prev) {
                    return prev;
                }
                const clamped = Math.max(1, Math.min(nextPage, numPages || nextPage));
                return clamped;
            });
        },
        [numPages]
    );

    const handlePrevious = useCallback(() => {
        goToPage(pageNumber - 1);
    }, [goToPage, pageNumber]);

    const handleNext = useCallback(() => {
        goToPage(pageNumber + 1);
    }, [goToPage, pageNumber]);

    const handlePageInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPageInput(event.target.value);
    }, []);

    const handlePageInputBlur = useCallback(() => {
        const parsed = Number(pageInput);
        if (!Number.isNaN(parsed)) {
            goToPage(parsed);
        } else {
            setPageInput(String(pageNumber));
        }
    }, [goToPage, pageInput, pageNumber]);

    const handlePageInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
            }
        },
        []
    );

    const handleZoomOut = useCallback(() => {
        setScale(prev => Math.max(MIN_SCALE, Number((prev - SCALE_STEP).toFixed(2))));
    }, []);

    const handleZoomIn = useCallback(() => {
        setScale(prev => Math.min(MAX_SCALE, Number((prev + SCALE_STEP).toFixed(2))));
    }, []);

    const handleResetZoom = useCallback(() => {
        setScale(1.1);
    }, []);

    const handleSliderChange = useCallback((value: number[]) => {
        if (value[0] !== undefined && value[0] !== null) {
            const newScale = Number(value[0].toFixed(2));
            setScale(prevScale => {
                // Use a more precise comparison to avoid infinite loops
                if (Math.abs(prevScale - newScale) < 0.001) {
                    return prevScale;
                }
                return newScale;
            });
        }
    }, []);

    const documentFile = useMemo(() => {
        if (fallbackData) {
            return { data: fallbackData } satisfies DocumentProps["file"];
        }
        return pdfSource;
    }, [fallbackData, pdfSource]);

    const shouldRenderDocument = documentFile && !loadError && isClient;

    return (
        <section
            className={cn(
                "flex h-full min-h-[calc(100vh-5rem)] flex-col gap-4 bg-reading-background/40 p-4",
                className
            )}
        >
            <header className="flex flex-col gap-4 rounded-lg border border-border bg-background/80 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase text-muted-foreground">Bezbedan prikaz</p>
                        <h1 className="text-xl font-semibold text-reading-text">
                            {bookTitle ?? "Digitalni čitač"}
                        </h1>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Strana {pageNumber}
                        {numPages ? ` / ${numPages}` : ""}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handlePrevious}
                            disabled={pageNumber <= 1 || !numPages}
                            aria-label="Prethodna strana"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <form
                            className="flex items-center gap-1"
                            onSubmit={event => {
                                event.preventDefault();
                                handlePageInputBlur();
                            }}
                        >
                            <Input
                                value={pageInput}
                                onChange={handlePageInputChange}
                                onBlur={handlePageInputBlur}
                                onKeyDown={handlePageInputKeyDown}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="h-9 w-16 text-center"
                                aria-label="Unesi broj strane"
                            />
                            <span className="text-sm text-muted-foreground">
                                od {numPages || "?"}
                            </span>
                        </form>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleNext}
                            disabled={numPages ? pageNumber >= numPages : true}
                            aria-label="Sledeća strana"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleZoomOut}
                            disabled={scale <= MIN_SCALE}
                            aria-label="Smanji zoom"
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2 px-2">
                            <Slider
                                value={[scale]}
                                onValueChange={handleSliderChange}
                                min={MIN_SCALE}
                                max={MAX_SCALE}
                                step={0.05}
                                className="w-36"
                                aria-label="Povećaj ili smanji prikaz"
                            />
                            <span className="w-12 text-right text-sm font-medium tabular-nums text-muted-foreground">
                                {Math.round(scale * 100)}%
                            </span>
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleZoomIn}
                            disabled={scale >= MAX_SCALE}
                            aria-label="Povećaj zoom"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleResetZoom}
                            aria-label="Resetuj zoom"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>

                    {isDocumentLoading && !loadError && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <LoadingSpinner size="sm" />
                            <span>Učitavanje… {progress ? `${progress}%` : ""}</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="relative flex-1 overflow-auto rounded-lg border border-border bg-muted/10 p-4">
                {watermark && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="select-none text-center text-6xl font-black uppercase tracking-widest text-reading-text/10 opacity-40 [writing-mode:vertical-rl] sm:[writing-mode:horizontal-tb] sm:rotate-45">
                            {watermark.text}
                            <div className="mt-4 text-base font-medium normal-case tracking-normal">
                                {watermark.signature}
                            </div>
                        </div>
                    </div>
                )}

                {!isClient ? (
                    <div className="flex h-full min-h-[60vh] items-center justify-center">
                        <LoadingSpinner size="lg" text="Inicijalizujemo čitač" />
                    </div>
                ) : shouldRenderDocument ? (
                    <Document
                        key={
                            fallbackData
                                ? `${bookId}-fallback`
                                : `${bookId}-${secureStream ? secureStream.url : "unknown"}`
                        }
                        file={documentFile}
                        options={documentOptions}
                        loading={
                            <div className="flex h-full min-h-[60vh] items-center justify-center">
                                <LoadingSpinner size="lg" text="Učitavanje dokumenta" />
                            </div>
                        }
                        onLoadSuccess={handleDocumentLoadSuccess}
                        onLoadError={handleDocumentLoadError}
                        onSourceError={handleDocumentLoadError}
                        onLoadProgress={handleProgress}
                        renderMode="canvas"
                        className="mx-auto flex flex-col items-center gap-4"
                    >
                        <Page
                            key={`${pageNumber}-${scale}`}
                            pageNumber={pageNumber}
                            scale={scale}
                            renderAnnotationLayer
                            renderTextLayer
                            loading={<LoadingSpinner size="lg" text="Priprema strane" />}
                            className="rounded-lg bg-white shadow-lg"
                        />
                    </Document>
                ) : (
                    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                        {isFallbackLoading ? (
                            <LoadingSpinner size="lg" text="Pripremamo alternativni prikaz…" />
                        ) : (
                            <>
                                <p className="max-w-xl text-balance text-base text-muted-foreground">
                                    {loadError ?? "Došlo je do neočekivane greške prilikom učitavanja dokumenta."}
                                </p>
                                {fallbackPreview && (
                                    <div className="max-w-2xl rounded-lg border border-dashed border-border bg-background/70 p-6 text-left text-sm text-muted-foreground">
                                        <h2 className="mb-2 text-lg font-semibold text-foreground">
                                            Kratak pregled sadržaja
                                        </h2>
                                        <p className="whitespace-pre-wrap leading-relaxed">{fallbackPreview}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

const ReaderView = memo(ReaderViewComponent);
ReaderView.displayName = "ReaderView";

export default ReaderView;
