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
import { ChevronLeft, ChevronRight, Minus, Plus, Maximize2, ZoomIn, ZoomOut, Bookmark, BookmarkCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { api, tokenManager } from "@/lib/api-client";
import type { PdfMetadata } from "@/api/types/pdf.types";
import type { ReaderWatermark, SecureStreamDescriptor } from "@/types/reader";
import type { PdfRangeTransport } from "@/api/types/pdf.types";
import { useDownloadPrevention } from "@/hooks/useDownloadPrevention";
import { bookmarksApi } from "@/api/bookmarks";
import { AiChatPanel } from "@/components/ai-chat/AiChatPanel";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const MIN_SCALE = 0.75;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;

type PdfJsLib = typeof import("react-pdf")["pdfjs"];

// Debug logging helpers
const isBrowser = typeof window !== "undefined";
const DEBUG_READER = (isBrowser && window.localStorage?.getItem("DEBUG_READER") === "1")
    || process.env.NEXT_PUBLIC_DEBUG_READER === "1";
const readerLog = (...args: unknown[]) => {
    if (DEBUG_READER) {
        console.log("[ReaderView]", ...args);
    }
};


export interface ReaderViewProps {
    bookId: number;
    bookTitle?: string;
    stream?: SecureStreamDescriptor | { error: string } | null;
    watermark?: ReaderWatermark | null;
    fallbackPreview?: string | null;
    pageNumber?: number; // new - for controlled mode
    onPageChange?: (page: number) => void;
    className?: string;
    skipMetadata?: boolean; // Skip metadata fetch for public content (promo chapters)
    isPromoChapter?: boolean; // Hide bookmarks for promo chapters
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

const normalizeHeaders = (headers?: Record<string, string>) =>
    Object.entries(headers ?? {})
        .map(([key, value]) => [key.toLowerCase(), value] as const)
        .sort(([a], [b]) => a.localeCompare(b));

const createStreamSignature = (
    stream?: SecureStreamDescriptor | { error: string } | null
) => {
    if (!stream) {
        return "no-stream";
    }

    if ("error" in stream) {
        return `error:${stream.error ?? "unknown"}`;
    }

    const headerSignature = normalizeHeaders(stream.headers)
        .map(([key, value]) => `${key}:${value}`)
        .join("|");

    return [
        stream.url,
        stream.contentLength,
        stream.chunkSize,
        stream.expiresAt ?? "",
        headerSignature,
    ].join("::");
};

const ReaderViewComponent: React.FC<ReaderViewProps> = ({
                                                            bookId,
                                                            bookTitle,
                                                            stream,
                                                            watermark,
                                                            fallbackPreview,
                                                            pageNumber: controlledPageNumber,
                                                            onPageChange,
                                                            className,
                                                            skipMetadata = false,
                                                            isPromoChapter = false,
                                                        }) => {
    // Hybrid controlled/uncontrolled pattern
    const [numPages, setNumPages] = useState<number>(0);
    const [internalPageNumber, setInternalPageNumber] = useState<number>(1);
    const [pageInput, setPageInput] = useState<string>("1");

    // Use controlled value if provided, otherwise use internal state
    const pageNumber = controlledPageNumber ?? internalPageNumber;
    readerLog("render", { controlledPageNumber, internalPageNumber, pageNumber });

    // Log prop changes for debugging parent interactions
    const prevControlledPageRef = useRef(controlledPageNumber);
    if (prevControlledPageRef.current !== controlledPageNumber) {
        console.log("📥 Parent prop change:", prevControlledPageRef.current, "→", controlledPageNumber, "at", new Date().toISOString());
        prevControlledPageRef.current = controlledPageNumber;
    }
    const [isEditingInput, setIsEditingInput] = useState<boolean>(false);
    const [scale, setScale] = useState<number>(1.1);
    const [isDocumentLoading, setIsDocumentLoading] = useState<boolean>(true);

    // Enable download prevention security measures
    useDownloadPrevention(true);

    // FIX 2: Initialize loadError with a lazy initializer function
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
    const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
    const [isMetadataLoading, setIsMetadataLoading] = useState<boolean>(false);
    const [metadataError, setMetadataError] = useState<string | null>(null);
    const [pdfjsLib, setPdfjsLib] = useState<PdfJsLib | null>(null);

    const pdfRef = useRef<Parameters<OnDocumentLoadSuccess>[0] | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const hasTriedFallbackRef = useRef<boolean>(false);
    const metadataAbortControllerRef = useRef<AbortController | null>(null);
    const bookmarkLoadedForBookRef = useRef<number | null>(null);

    // FIX 3: Memoize streamSignature properly
    const streamSignature = useMemo(() => createStreamSignature(stream), [stream]);

    // FIX 4: Calculate streamStatus only in useMemo
    const streamStatus = useMemo(() => {
        if (!stream) {
            return {
                signature: "no-stream",
                errorMessage: "Trenutno nije moguće učitati bezbedan tok za ovu knjigu.",
                hasStream: false,
            } as const;
        }

        if ("error" in stream) {
            return {
                signature: streamSignature,
                errorMessage: stream.error || "Pristup knjizi je trenutno onemogućen.",
                hasStream: false,
            } as const;
        }

        return {
            signature: streamSignature,
            errorMessage: null,
            hasStream: true,
        } as const;
    }, [stream, streamSignature]);

    const { errorMessage: streamErrorMessage, hasStream: hasSecureStream } = streamStatus;

    // FIX 5: Remove duplicate refs and simplify secureStream calculation
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

    // Configure PDF.js worker on mount
    useEffect(() => {
        setIsClient(true);
        readerLog("mounted");

        const configurePdfWorker = async () => {
            const { pdfjs } = await import("react-pdf");
            pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.mjs`;
            setPdfjsLib(pdfjs);
        };

        configurePdfWorker().catch(console.error);
    }, []);

    const pdfSource: PdfSource = useMemo(() => {
        if (!secureStream) {
            return null;
        }
        return secureStream.url;
    }, [secureStream]);

    // Fetch PDF metadata prior to streaming (skip for public content like promo chapters)
    useEffect(() => {
        // Skip metadata fetch for public content (promo chapters)
        if (skipMetadata) {
            metadataAbortControllerRef.current?.abort();
            metadataAbortControllerRef.current = null;
            setMetadata(null);
            setMetadataError(null);
            setIsMetadataLoading(false);
            return;
        }

        if (!secureStream) {
            metadataAbortControllerRef.current?.abort();
            metadataAbortControllerRef.current = null;
            setMetadata(null);
            setMetadataError(null);
            setIsMetadataLoading(false);
            return;
        }

        const controller = new AbortController();
        metadataAbortControllerRef.current?.abort();
        metadataAbortControllerRef.current = controller;

        let isSubscribed = true;

        const fetchMetadata = async () => {
            try {
                setIsMetadataLoading(true);
                setMetadata(null);
                setMetadataError(null);
                setProgress(0);
                setIsDocumentLoading(true);
                readerLog("fetch metadata", { bookId, streamSignature });

                const response = await api.get<PdfMetadata>(`/api/reader/${bookId}/metadata`, {
                    signal: controller.signal,
                });

                if (!isSubscribed) {
                    return;
                }

                const nextMetadata = response.data;
                setMetadata(nextMetadata);
                readerLog("metadata received", {
                    totalSize: nextMetadata.totalSize,
                    initialChunkSize: nextMetadata.initialChunkSize,
                    recommendedChunkSize: nextMetadata.recommendedChunkSize,
                });

                if (nextMetadata.initialChunkSize && nextMetadata.totalSize) {
                    const loadedBytes = Number(nextMetadata.initialChunkSize);
                    const totalBytes = Number(nextMetadata.totalSize);
                    if (Number.isFinite(loadedBytes) && Number.isFinite(totalBytes) && totalBytes > 0) {
                        const initialProgress = Math.min(100, Math.max(0, Math.round((loadedBytes / totalBytes) * 100)));
                        setProgress(initialProgress);
                    }
                }
            } catch (error) {
                if (!isSubscribed || controller.signal.aborted) {
                    return;
                }
                console.error("Failed to load PDF metadata", error);
                readerLog("metadata error", error);
                const message = error instanceof Error
                    ? error.message
                    : "Došlo je do greške prilikom preuzimanja metapodataka.";
                setMetadataError(message);
            } finally {
                if (!isSubscribed) {
                    return;
                }
                setIsMetadataLoading(false);
            }
        };

        fetchMetadata().catch(console.error);

        return () => {
            isSubscribed = false;
            controller.abort();
        };
    }, [secureStream, bookId, streamSignature, skipMetadata]);

    const decodeBase64ToUint8Array = useCallback((base64: string) => {
        if (typeof window === "undefined") {
            return new Uint8Array();
        }
        const binaryString = window.atob(base64);
        const length = binaryString.length;
        const bytes = new Uint8Array(length);
        for (let index = 0; index < length; index += 1) {
            bytes[index] = binaryString.charCodeAt(index);
        }
        return bytes;
    }, []);

    const pdfRangeTransport = useMemo(() => {
        if (!pdfjsLib || !metadata || !secureStream) {
            return null;
        }

        const initialData = metadata.initialChunk ? decodeBase64ToUint8Array(metadata.initialChunk) : null;
        const totalSize = Number(metadata.totalSize);

        class MetadataRangeTransport extends pdfjsLib.PDFDataRangeTransport {
            private abortController = new AbortController();
            private loadedBytes = initialData?.length ?? 0;

            // LRU Cache for 3 pages only (roughly 6MB max for 2MB pages) - security measure
            private readonly maxCachedRanges = 3;
            private cachedRanges = new Map<string, { data: Uint8Array; lastAccessed: number }>();
            private inactivityTimer: NodeJS.Timeout | null = null;
            private periodicClearTimer: NodeJS.Timeout | null = null;
            private readonly INACTIVITY_TIMEOUT = 30000; // 30 seconds
            private readonly PERIODIC_CLEAR_INTERVAL = 120000; // 2 minutes

            private getCacheKey(begin: number, end: number): string {
                return `${begin}-${end}`;
            }

            private evictOldestCache(): void {
                if (this.cachedRanges.size >= this.maxCachedRanges) {
                    let oldestKey = '';
                    let oldestTime = Date.now();

                    for (const [key, value] of this.cachedRanges.entries()) {
                        if (value.lastAccessed < oldestTime) {
                            oldestTime = value.lastAccessed;
                            oldestKey = key;
                        }
                    }

                    if (oldestKey) {
                        this.cachedRanges.delete(oldestKey);
                        readerLog("cache evicted", { key: oldestKey, cacheSize: this.cachedRanges.size });
                    }
                }
            }

            private clearAllCache(): void {
                const size = this.cachedRanges.size;
                this.cachedRanges.clear();
                readerLog("cache cleared (all)", { previousSize: size });
                console.log("🗑️ PDF Cache: All cached pages cleared for security");
            }

            private resetInactivityTimer(): void {
                if (this.inactivityTimer) {
                    clearTimeout(this.inactivityTimer);
                }
                this.inactivityTimer = setTimeout(() => {
                    this.clearAllCache();
                    console.log("⏱️ PDF Cache: Cleared due to 30s inactivity");
                }, this.INACTIVITY_TIMEOUT);
            }

            private startPeriodicClear(): void {
                this.periodicClearTimer = setInterval(() => {
                    this.clearAllCache();
                    console.log("🔄 PDF Cache: Periodic 2-minute cache clear");
                }, this.PERIODIC_CLEAR_INTERVAL);
            }

            private stopTimers(): void {
                if (this.inactivityTimer) {
                    clearTimeout(this.inactivityTimer);
                    this.inactivityTimer = null;
                }
                if (this.periodicClearTimer) {
                    clearInterval(this.periodicClearTimer);
                    this.periodicClearTimer = null;
                }
            }

            override async requestDataRange(begin: number, end: number) {
                const requestedEnd = Number.isFinite(end) ? Math.max(begin, end - 1) : begin;
                const cacheKey = this.getCacheKey(begin, requestedEnd);

                // Reset inactivity timer on every request
                this.resetInactivityTimer();

                // Check cache first
                const cached = this.cachedRanges.get(cacheKey);
                if (cached) {
                    // Update last accessed time
                    cached.lastAccessed = Date.now();
                    this.onDataRange(begin, cached.data);
                    readerLog("cache hit", { key: cacheKey, cacheSize: this.cachedRanges.size });
                    return;
                }

                const headers: Record<string, string> = {
                    Range: `bytes=${begin}-${requestedEnd}`,
                    "X-Readify-Session": metadata!.sessionToken,
                    "X-Readify-Watermark": metadata!.watermarkSignature,
                    "X-Readify-Issued-At": metadata!.issuedAt,
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                };

                if (authorizedHeadersRecord) {
                    for (const [key, value] of Object.entries(authorizedHeadersRecord)) {
                        if (!(key in headers)) {
                            headers[key] = value;
                        }
                    }
                }

                try {
                    readerLog("cache miss - downloading", { key: cacheKey, cacheSize: this.cachedRanges.size });

                    const response = await api.get<ArrayBuffer>(`/api/reader/${bookId}/content`, {
                        responseType: "arraybuffer",
                        signal: this.abortController.signal,
                        headers,
                    });

                    const chunk = new Uint8Array(response.data);
                    this.loadedBytes += chunk.length;

                    // Evict oldest cache entry if needed
                    this.evictOldestCache();

                    // Store in cache
                    this.cachedRanges.set(cacheKey, {
                        data: chunk,
                        lastAccessed: Date.now()
                    });

                    this.onDataRange(begin, chunk);
                    this.onDataProgress(this.loadedBytes, totalSize);

                    readerLog("cache stored", { key: cacheKey, size: chunk.length, cacheSize: this.cachedRanges.size });
                } catch (error) {
                    if (this.abortController.signal.aborted) {
                        readerLog("range request aborted", { begin, end });
                        return;
                    }
                    console.error("Range request failed", error);
                    throw error;
                }
            }

            override abort(): void {
                if (!this.abortController.signal.aborted) {
                    this.abortController.abort();
                }
                // Stop all timers and clear cache on abort
                this.stopTimers();
                this.cachedRanges.clear();
                readerLog("cache cleared on abort", { cacheSize: this.cachedRanges.size });
            }
        }

        const transport = new MetadataRangeTransport(totalSize, initialData ?? null);
        transport.transportReady();

        // Start periodic cache clearing for security
        (transport as any).startPeriodicClear();

        readerLog("range transport ready", {
            totalSize,
            initialChunk: initialData?.length ?? 0,
            maxCachedRanges: 3,
            cacheEnabled: true,
            inactivityTimeout: "30s",
            periodicClear: "2min"
        });
        console.log("📚 PDF Cache: 3-page LRU cache with aggressive eviction enabled for book", bookId);
        return transport;
    }, [pdfjsLib, metadata, secureStream, authorizedHeadersRecord, decodeBase64ToUint8Array, bookId]);

    useEffect(() => {
        return () => {
            if (pdfRangeTransport) {
                pdfRangeTransport.abort();
            }
        };
    }, [pdfRangeTransport]);

    // Update loadError when stream changes
    useEffect(() => {
        if (!hasSecureStream) {
            setLoadError(streamErrorMessage || "Trenutno nije moguće učitati bezbedan tok za ovu knjigu.");
        } else if (!hasTriedFallbackRef.current) {
            setLoadError(null);
        }
        readerLog("stream change", { hasSecureStream, streamSignature });
    }, [hasSecureStream, streamErrorMessage, streamSignature]);

    // Reset states when book changes
    useEffect(() => {
        if (controlledPageNumber === undefined) {
            setInternalPageNumber(1);
        }
        setPageInput("1");
        setProgress(0);
        setIsDocumentLoading(true);
        setFallbackData(null);
        hasTriedFallbackRef.current = false;
        readerLog("reset for book", { bookId, controlled: controlledPageNumber !== undefined });
    }, [bookId, controlledPageNumber]);

    const onPageChangeRef = useRef(onPageChange);
    const lastEmittedPageRef = useRef(internalPageNumber);
    const lastSetScaleRef = useRef(scale);
    const lastPageChangeTimeRef = useRef<number>(0);
    const rapidChangeCountRef = useRef<number>(0);

    useEffect(() => {
        onPageChangeRef.current = onPageChange;
    }, [onPageChange]);

    // Track if we should emit onPageChange - debounced to prevent loops
    const emitPageChangeRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const textLayerAbortControllerRef = useRef<AbortController | undefined>(undefined);

    const debouncedEmitPageChange = useCallback((page: number) => {
        if (emitPageChangeRef.current) {
            clearTimeout(emitPageChangeRef.current);
        }
        emitPageChangeRef.current = setTimeout(() => {
            if (page !== lastEmittedPageRef.current) {
                lastEmittedPageRef.current = page;
                readerLog("emit onPageChange (debounced)", page);
                console.log("🔄 Would call parent onPageChange:", page, "at", new Date().toISOString());
                console.log("⏸️ TEMPORARILY DISABLED onPageChange to test loop source");
                // onPageChangeRef.current?.(page); // TEMPORARILY DISABLED
                console.log("✅ Skipped onPageChange call for page:", page);
            }
        }, 50); // 50ms debounce
    }, []);

    // Unified page setter for both controlled and uncontrolled modes
    const setPage = useCallback((next: number | ((prev: number) => number)) => {
        // Add call stack logging for debugging
        console.trace("🔍 setPage called from:", new Error().stack?.split('\n')[2]?.trim());

        // Rapid change detection guard
        const now = Date.now();
        if (lastPageChangeTimeRef.current && now - lastPageChangeTimeRef.current < 10) {
            rapidChangeCountRef.current += 1;
            if (rapidChangeCountRef.current > 10) {
                console.error("🚨 Maximum page change rate exceeded! Preventing infinite loop.");
                console.error("Call stack:", new Error().stack);
                readerLog("BLOCKED rapid page change", { count: rapidChangeCountRef.current });
                return;
            }
            readerLog("rapid page change detected", { count: rapidChangeCountRef.current, timeSince: now - lastPageChangeTimeRef.current });
        } else {
            rapidChangeCountRef.current = 0;
        }
        lastPageChangeTimeRef.current = now;

        if (controlledPageNumber !== undefined) {
            // ✅ Controlled mode → samo pozovi callback
            const nextPage = typeof next === "function" ? next(controlledPageNumber) : next;
            if (nextPage !== controlledPageNumber) {
                readerLog("setPage (controlled)", controlledPageNumber, "→", nextPage);
                console.log("⏸️ TEMPORARILY DISABLED controlled onPageChange");
                // onPageChangeRef.current?.(nextPage); // TEMPORARILY DISABLED
            }
        } else {
            // ✅ Uncontrolled mode → ažuriraj state i pozovi debounced callback
            setInternalPageNumber(prev => {
                const nextPage = typeof next === "function" ? (next as (p: number) => number)(prev) : next;
                if (nextPage !== prev) {
                    readerLog("setPage (uncontrolled)", prev, "→", nextPage);
                    console.log("🔄 setInternalPageNumber:", prev, "→", nextPage);
                    // Debounced callback to prevent rapid-fire loops
                    debouncedEmitPageChange(nextPage);
                }
                return nextPage;
            });
        }
    }, [controlledPageNumber, debouncedEmitPageChange]);

    useEffect(() => {
        if (!isEditingInput) {
            const newVal = String(pageNumber);
            if (pageInput !== newVal) {
                setPageInput(newVal);
                readerLog("sync pageInput from pageNumber", { pageNumber: newVal });
            }
        }
    }, [pageNumber, isEditingInput]);

    // Cleanup on unmount
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
            if (metadataAbortControllerRef.current) {
                metadataAbortControllerRef.current.abort();
                metadataAbortControllerRef.current = null;
            }
            if (emitPageChangeRef.current) {
                clearTimeout(emitPageChangeRef.current);
            }
            if (textLayerAbortControllerRef.current) {
                textLayerAbortControllerRef.current.abort();
                textLayerAbortControllerRef.current = undefined;
            }
            readerLog("unmounted");
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

        if (!pdfRangeTransport && authorizedHeadersRecord) {
            options.httpHeaders = authorizedHeadersRecord;
        }

        options.withCredentials = false;
        const totalSize = metadata?.totalSize ?? secureStream?.contentLength;
        if (totalSize) {
            options.length = totalSize;
        }
        const chunkSize = metadata?.recommendedChunkSize ?? secureStream?.chunkSize;
        if (chunkSize) {
            options.rangeChunkSize = chunkSize;
        }

        return Object.keys(options).length ? options : undefined;
    }, [secureStream, authorizedHeadersRecord, metadata, pdfRangeTransport]);

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

        if (document.numPages > 0) {
            setNumPages(document.numPages);
            readerLog("document loaded", { numPages: document.numPages, pageNumber, controlledPageNumber, internalPageNumber });
            const clamped = Math.min(pageNumber, document.numPages);

            if (controlledPageNumber !== undefined) {
                // ✅ Controlled mode → samo pozovi callback ako treba da se klampuje
                if (clamped !== controlledPageNumber) {
                    readerLog("handleDocumentLoadSuccess (controlled) clamp", controlledPageNumber, "→", clamped);
                    console.log("⏸️ TEMPORARILY DISABLED controlled clamp onPageChange");
                    // onPageChangeRef.current?.(clamped); // TEMPORARILY DISABLED
                }
            } else {
                // ✅ Uncontrolled mode → koristi setPage za unified handling
                if (clamped !== internalPageNumber) {
                    readerLog("handleDocumentLoadSuccess (uncontrolled) clamp", internalPageNumber, "→", clamped);
                    setPage(clamped);
                }
            }
        }

        setIsDocumentLoading(false);
        setLoadError(null);
    }, [pageNumber, controlledPageNumber, internalPageNumber, setPage]);

    const handleDocumentLoadError = useCallback(
        (error: Error) => {
            console.error("PDF load error", error);
            setIsDocumentLoading(false);

            if (!hasSecureStream || !secureStream) {
                setLoadError(
                    streamErrorMessage ||
                    error.message ||
                    "Došlo je do greške prilikom učitavanja dokumenta."
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
        [secureStream, hasSecureStream, streamErrorMessage]
    );

    const handleProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
        if (total > 0) {
            setProgress(Math.round((loaded / total) * 100));
        }
    }, []);


    const handlePrevious = useCallback(() => {
        readerLog("click previous");
        setPage(prev => {
            const nextPage = prev - 1;
            const clamped = numPages > 0
                ? Math.max(1, Math.min(nextPage, numPages))
                : Math.max(1, nextPage);
            return clamped;
        });
    }, [numPages, setPage]);

    const handleNext = useCallback(() => {
        readerLog("click next");
        setPage(prev => {
            const nextPage = prev + 1;
            const clamped = numPages > 0
                ? Math.max(1, Math.min(nextPage, numPages))
                : Math.max(1, nextPage);
            return clamped;
        });
    }, [numPages, setPage]);

    const handlePageInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPageInput(event.target.value);
        setIsEditingInput(true);
        readerLog("input change", { value: event.target.value });
    }, []);

    const handlePageInputBlur = useCallback(() => {
        setIsEditingInput(false);
        const parsed = Number(pageInput);
        if (!Number.isNaN(parsed)) {
            const clamped = Math.max(1, Math.min(parsed, numPages || parsed));
            setPage(clamped);
            readerLog("input blur apply", { parsed, clamped });
        } else {
            setPageInput(String(pageNumber));
            readerLog("input blur invalid, reset", { pageNumber });
        }
    }, [pageInput, numPages, setPage, pageNumber]);

    const handlePageInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
                readerLog("input enter -> blur");
            }
        },
        []
    );

    const handleZoomOut = useCallback(() => {
        setScale(prev => {
            const newScale = Math.max(MIN_SCALE, Number((prev - SCALE_STEP).toFixed(2)));
            lastSetScaleRef.current = newScale;
            return newScale;
        });
        readerLog("zoom out");
    }, []);

    const handleZoomIn = useCallback(() => {
        setScale(prev => {
            const newScale = Math.min(MAX_SCALE, Number((prev + SCALE_STEP).toFixed(2)));
            lastSetScaleRef.current = newScale;
            return newScale;
        });
        readerLog("zoom in");
    }, []);

    const handleResetZoom = useCallback(() => {
        const resetScale = 1.1;
        lastSetScaleRef.current = resetScale;
        setScale(resetScale);
        readerLog("zoom reset");
    }, []);

    // Improved handleSliderChange with ref-based approach to prevent loops
    const handleSliderChange = useCallback((value: number[]) => {
        if (value[0] !== undefined && value[0] !== null) {
            const newScale = Number(value[0].toFixed(2));
            if (Math.abs(lastSetScaleRef.current - newScale) > 0.01) {
                lastSetScaleRef.current = newScale;
                setScale(newScale);
                readerLog("slider change", { newScale });
            }
        }
    }, []); // Bez dependencies

    const documentFile = useMemo(() => {
        if (fallbackData) {
            return { data: fallbackData } satisfies DocumentProps["file"];
        }
        if (!secureStream) {
            return pdfSource;
        }

        if (pdfRangeTransport) {
            return { range: pdfRangeTransport } satisfies DocumentProps["file"];
        }

        if (metadataError) {
            return pdfSource;
        }

        if (!isMetadataLoading) {
            return pdfSource;
        }

        return null;
    }, [fallbackData, pdfSource, secureStream, pdfRangeTransport, metadataError, isMetadataLoading]);

    const shouldRenderDocument = documentFile && !loadError && isClient;

    // Add keyboard navigation effect
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target && (event.target as HTMLElement).tagName === 'INPUT') {
                return;
            }

            if (event.key === 'ArrowUp' && pageNumber > 1) {
                event.preventDefault();
                handlePrevious();
            } else if (event.key === 'ArrowDown' && pageNumber < numPages) {
                event.preventDefault();
                handleNext();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [pageNumber, numPages, handlePrevious, handleNext]);

    // Load bookmarked page ONCE on mount (init block - runs only once per bookId)
    useEffect(() => {
        // Skip bookmark loading for promo chapters
        if (isPromoChapter) {
            return;
        }

        // Only load bookmark once per bookId
        if (bookmarkLoadedForBookRef.current === bookId) {
            return;
        }

        if (!isClient || !bookId) {
            return;
        }

        bookmarkLoadedForBookRef.current = bookId;

        // Fire and forget - load bookmark page
        bookmarksApi.getBookmarkForBook(api, bookId)
            .then(response => {
                if (response.data?.pageNumber && response.data.pageNumber > 1) {
                    console.log("[Bookmark Init] Loading bookmarked page", response.data.pageNumber);
                    // Directly set internal page state (only in uncontrolled mode)
                    if (controlledPageNumber === undefined) {
                        setInternalPageNumber(response.data.pageNumber);
                        setPageInput(String(response.data.pageNumber));
                    }
                }
            })
            .catch(() => {
                // No bookmark or error - silently ignore, start from page 1
                console.log("[Bookmark Init] No bookmark found, starting from page 1");
            });
    }, [bookId, isClient, controlledPageNumber, isPromoChapter]);

    // Simple fire-and-forget bookmark save - no state management needed
    const handleSaveBookmark = () => {
        console.log("[Bookmark Save] Click handler fired - bookId:", bookId, "pageNumber:", pageNumber);

        // Fire and forget - just call the API (not using useCallback to avoid dependency issues)
        bookmarksApi.saveBookmark(api, {
            bookId,
            pageNumber,
        })
            .then(() => {
                console.log("[Bookmark Save] ✅ Success! Bookmark saved for book", bookId, "at page", pageNumber);
            })
            .catch(error => {
                console.error("[Bookmark Save] ❌ Failed to save bookmark:", error);
            });
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100">
            {/* Top bar */}
            <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-900 backdrop-blur-sm">
                <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div>
                            <p className="text-lg font-semibold uppercase tracking-[0.1em]">{bookTitle ?? "Bookotecha"}</p>
                        </div>
                    </div>

                    {/* Central controls */}
                    <div className="flex items-center gap-2">
                        <button
                            className="h-9 w-9 rounded-xl hover:bg-slate-900/60 disabled:opacity-50"
                            onClick={handlePrevious}
                            disabled={pageNumber <= 1 || !numPages}
                        >
                            <ChevronLeft className="mx-auto h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-sm">
                            <input
                                className="h-8 w-14 bg-transparent text-center outline-none"
                                value={pageInput}
                                onChange={handlePageInputChange}
                                onBlur={handlePageInputBlur}
                                onKeyDown={handlePageInputKeyDown}
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                            <span className="select-none text-slate-400">od</span>
                            <span className="w-10 text-right text-slate-300">{numPages || "?"}</span>
                        </div>

                        <button
                            className="h-9 w-9 rounded-xl hover:bg-slate-900/60 disabled:opacity-50"
                            onClick={handleNext}
                            disabled={numPages ? pageNumber >= numPages : true}
                        >
                            <ChevronRight className="mx-auto h-5 w-5" />
                        </button>

                        <div className="mx-2 h-6 w-px bg-slate-800" />

                        <button
                            className="h-9 w-9 rounded-xl hover:bg-slate-900/60"
                            onClick={handleZoomOut}
                            disabled={scale <= MIN_SCALE}
                        >
                            <ZoomOut className="mx-auto h-5 w-5" />
                        </button>

                        <div className="hidden items-center gap-2 md:flex">
                            <input
                                type="range"
                                min={MIN_SCALE}
                                max={MAX_SCALE}
                                step={0.05}
                                value={scale}
                                onChange={(e) => handleSliderChange([Number(e.target.value)])}
                                className="w-40 accent-slate-300"
                                aria-label="Zoom slider"
                            />
                            <select
                                value={Math.round(scale * 100)}
                                onChange={(e) => handleSliderChange([Number(e.target.value) / 100])}
                                className="h-8 rounded-xl border border-slate-800 bg-slate-900/70 px-2 text-sm"
                            >
                                {[75, 90, 100, 110, 125, 150, 200].map((z) => (
                                    <option key={z} value={z}>{z}%</option>
                                ))}
                            </select>
                            <button
                                className="h-9 w-9 rounded-xl hover:bg-slate-900/60"
                                onClick={handleZoomIn}
                                disabled={scale >= MAX_SCALE}
                            >
                                <ZoomIn className="mx-auto h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        <button className="h-9 w-9 rounded-xl hover:bg-slate-900/60">
                            <Maximize2 className="mx-auto h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Body grid */}
            <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-4 px-4 py-4">
                {/* Main viewer */}
                <main className="col-span-12 lg:col-span-9">
                    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-3 shadow-xl shadow-black/40">
                        <div className="flex items-center justify-end px-1 pb-2 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                {isDocumentLoading && !loadError && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <LoadingSpinner size="sm" />
                                        <span>Učitavanje… {progress ? `${progress}%` : ""}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PDF canvas container */}
                        <div className="relative flex min-h-[72vh] items-start justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                            {watermark && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="select-none text-center text-6xl font-black uppercase tracking-widest text-slate-100/10 opacity-40 [writing-mode:vertical-rl] sm:[writing-mode:horizontal-tb] sm:rotate-45">
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
                                    key={`${bookId}-${streamSignature}`}
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
                                        pageNumber={pageNumber}
                                        scale={scale}
                                        renderAnnotationLayer
                                        renderTextLayer
                                        loading={<LoadingSpinner size="lg" text="Priprema strane" />}
                                        className="my-8 rounded-lg bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55)]"
                                        onRenderTextLayerError={(error) => {
                                            if (error?.name === 'AbortException' || error?.message?.includes('TextLayer task cancelled')) {
                                                console.debug('🔄 TextLayer task cancelled (expected during page changes)');
                                                return;
                                            }
                                            console.warn('⚠️ TextLayer render error:', error);
                                        }}
                                    />
                                </Document>
                            ) : (
                                <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                                    {isFallbackLoading ? (
                                        <LoadingSpinner size="lg" text="Pripremamo alternativni prikaz…" />
                                    ) : (
                                        <>
                                            <p className="max-w-xl text-balance text-base text-slate-400">
                                                {loadError ?? "Došlo je do neočekivane greške prilikom učitavanja dokumenta."}
                                            </p>
                                            {fallbackPreview && (
                                                <div className="max-w-2xl rounded-lg border border-dashed border-slate-800 bg-slate-900/70 p-6 text-left text-sm text-slate-400">
                                                    <h2 className="mb-2 text-lg font-semibold text-slate-100">
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

                        {/* Bottom bar inside the card */}
                        <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="text-sm text-slate-400">
                                Strana <span className="font-medium text-slate-200">{pageNumber}</span> / {numPages || "?"}
                            </div>
                            <div className="flex-1">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                    <div
                                        className="h-full bg-slate-300"
                                        style={{ width: `${numPages ? (pageNumber / numPages) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Right sidebar: navigation and controls */}
                <aside className="col-span-12 lg:col-span-3">
                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40">
                        <div className="px-4 py-3 text-sm font-medium border-b border-slate-800/60">Navigacija</div>
                        <div className="p-3 space-y-4">
                            {/* Page navigation */}
                            <div className="space-y-2">
                                <button
                                    className="w-full rounded-xl border border-slate-800/60 bg-slate-900/60 p-3 text-left transition hover:border-slate-700 disabled:opacity-50"
                                    onClick={handlePrevious}
                                    disabled={pageNumber <= 1 || !numPages}
                                >
                                    <div className="flex items-center gap-2">
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="text-sm">Prethodna</span>
                                    </div>
                                    {pageNumber > 1 && (
                                        <div className="text-xs text-slate-400 mt-1">
                                            Strana {pageNumber - 1}
                                        </div>
                                    )}
                                </button>

                                <button
                                    className="w-full rounded-xl border border-slate-800/60 bg-slate-900/60 p-3 text-left transition hover:border-slate-700 disabled:opacity-50"
                                    onClick={handleNext}
                                    disabled={numPages ? pageNumber >= numPages : true}
                                >
                                    <div className="flex items-center gap-2">
                                        <ChevronRight className="h-4 w-4" />
                                        <span className="text-sm">Sledeća</span>
                                    </div>
                                    {pageNumber < numPages && (
                                        <div className="text-xs text-slate-400 mt-1">
                                            Strana {pageNumber + 1}
                                        </div>
                                    )}
                                </button>
                            </div>

                            {/* Bookmark button - hidden for promo chapters */}
                            {!isPromoChapter && (
                                <div className="space-y-2">
                                    <button
                                        className="w-full rounded-xl border border-slate-800/60 bg-slate-900/60 p-3 text-left transition hover:border-slate-700 disabled:opacity-50"
                                        onClick={handleSaveBookmark}
                                        disabled={!pageNumber}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Bookmark className="h-4 w-4 text-amber-400" />
                                            <span className="text-sm">Sačuvaj dokle sam stao</span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Strana {pageNumber}
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* Zoom controls */}
                            <div className="space-y-2">
                                <div className="text-xs text-slate-400 font-medium">Uvećanje</div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="flex-1 rounded-lg bg-slate-800/60 px-2 py-1 text-xs hover:bg-slate-800"
                                        onClick={handleZoomOut}
                                        disabled={scale <= MIN_SCALE}
                                    >
                                        <Minus className="mx-auto h-3 w-3" />
                                    </button>
                                    <span className="text-xs tabular-nums text-slate-300 min-w-[3rem] text-center">
                                        {Math.round(scale * 100)}%
                                    </span>
                                    <button
                                        className="flex-1 rounded-lg bg-slate-800/60 px-2 py-1 text-xs hover:bg-slate-800"
                                        onClick={handleZoomIn}
                                        disabled={scale >= MAX_SCALE}
                                    >
                                        <Plus className="mx-auto h-3 w-3" />
                                    </button>
                                </div>
                                <button
                                    className="w-full rounded-lg bg-slate-800/60 px-2 py-1 text-xs hover:bg-slate-800"
                                    onClick={handleResetZoom}
                                >
                                    Reset (110%)
                                </button>
                            </div>

                            {/* Keyboard shortcuts info */}
                            <div className="space-y-2">
                                <div className="text-xs text-slate-400 font-medium">Prečice</div>
                                <div className="space-y-1 text-xs text-slate-500">
                                    <div className="flex justify-between">
                                        <span>↑</span>
                                        <span>Prethodna strana</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>↓</span>
                                        <span>Sledeća strana</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* AI Chat Panel */}
            <AiChatPanel bookId={bookId} bookTitle={bookTitle} />
        </div>
    );
};

const ReaderView = memo(ReaderViewComponent);
ReaderView.displayName = "ReaderView";

export default ReaderView;