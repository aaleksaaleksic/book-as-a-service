// src/lib/pdfRangeTransport.ts

import axios, { AxiosInstance } from 'axios';
import { PdfMetadata, PdfRangeTransport } from '@/api/types/pdf.types';

/**
 * Custom Range Transport for PDF.js
 *
 * This class implements the transport layer for PDF.js streaming.
 * Instead of loading the entire PDF, it:
 * 1. Provides initial chunk (header + XRef) immediately
 * 2. Fetches additional chunks on-demand via Range requests
 * 3. Maintains streaming session authentication
 *
 * Architecture:
 * - PDF.js calls requestRange(start, end) when it needs data
 * - We make HTTP Range request with session credentials
 * - PDF.js assembles the document progressively
 */
export class SecurePdfRangeTransport implements PdfRangeTransport {
  public length: number;
  public initialData: Uint8Array;

  private bookId: number;
  private metadata: PdfMetadata;
  private apiClient: AxiosInstance;
  private abortController: AbortController;
  private onProgressCallback?: (loaded: number, total: number) => void;
  private loadedBytes: number = 0;
  private requestCount: number = 0;
  private startTime: number = Date.now();

  /**
   * @param bookId - Book identifier
   * @param metadata - Metadata from /api/reader/{id}/metadata endpoint
   * @param apiClient - Authenticated Axios instance
   * @param onProgress - Optional progress callback for UI updates
   */
  constructor(
    bookId: number,
    metadata: PdfMetadata,
    apiClient: AxiosInstance,
    onProgress?: (loaded: number, total: number) => void
  ) {
    this.bookId = bookId;
    this.metadata = metadata;
    this.apiClient = apiClient;
    this.abortController = new AbortController();
    this.onProgressCallback = onProgress;

    // Set total length for PDF.js
    this.length = metadata.totalSize;

    // Decode initial chunk (header + XRef)
    this.initialData = this.base64ToUint8Array(metadata.initialChunk);
    this.loadedBytes = this.initialData.length;

    console.log(`[PdfRangeTransport] Initialized for book ${bookId}`);
    console.log(`  Total size: ${this.formatBytes(this.length)}`);
    console.log(`  Initial chunk: ${this.formatBytes(this.initialData.length)}`);
    console.log(`  PDF version: ${metadata.pdfVersion}`);

    // Clear any existing PDF caches
    this.clearPdfCaches();
  }

  /**
   * PDF.js calls this when it needs a specific byte range
   *
   * We make an authenticated Range request and notify PDF.js via onDataRange
   * This is called multiple times as the user navigates the document
   */
  async requestRange(begin: number, end: number): Promise<void> {
    this.requestCount++;
    const requestTime = Date.now() - this.startTime;

    console.log(`[PdfRangeTransport] Range requested: ${begin}-${end} (${this.formatBytes(end - begin + 1)}) [${this.requestCount}/${(requestTime/1000).toFixed(1)}s]`);

    // Basic rate limiting on frontend (additional layer)
    if (this.requestCount > 100 || (requestTime > 0 && this.requestCount / (requestTime / 1000) > 10)) {
      console.warn('[PdfRangeTransport] High request rate detected - potential scraping attempt');
    }

    try {
      const response = await this.apiClient.get(
        `/api/reader/${this.bookId}/content`,
        {
          headers: {
            'Range': `bytes=${begin}-${end}`,
            'X-Readify-Session': this.metadata.sessionToken,
            'X-Readify-Watermark': this.metadata.watermarkSignature,
            'X-Readify-Issued-At': this.metadata.issuedAt,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          responseType: 'arraybuffer',
          signal: this.abortController.signal,
          onDownloadProgress: (progressEvent) => {
            if (this.onProgressCallback && progressEvent.total) {
              const chunkLoaded = progressEvent.loaded;
              this.loadedBytes += chunkLoaded;
              this.onProgressCallback(this.loadedBytes, this.length);
            }
          }
        }
      );

      const chunk = new Uint8Array(response.data);

      // Notify PDF.js that data has arrived
      // PDF.js worker listens for this event
      (this as any).onDataRange(begin, chunk);

      console.log(`[PdfRangeTransport] Range delivered: ${begin}-${end}`);

    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('[PdfRangeTransport] Request cancelled');
      } else {
        console.error('[PdfRangeTransport] Range request failed:', error);

        // Notify PDF.js of error
        if ((this as any).onDataRangeError) {
          (this as any).onDataRangeError(begin, error);
        }
      }
      throw error;
    }
  }

  /**
   * Called when PDF loading is cancelled (e.g., user navigates away)
   */
  abort(): void {
    console.log('[PdfRangeTransport] Aborting all requests');
    this.abortController.abort();

    // Clear caches when aborting
    this.clearPdfCaches();
  }

  /**
   * Helper: Convert Base64 to Uint8Array
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Helper: Format bytes for logging
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * Clear various browser caches that could store PDF data
   */
  private clearPdfCaches(): void {
    try {
      // Clear browser cache entries for this book
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('pdf') || name.includes('reader') || name.includes(this.bookId.toString())) {
              caches.delete(name);
            }
          });
        });
      }

      // Clear localStorage entries related to PDF
      Object.keys(localStorage).forEach(key => {
        if (key.includes('pdf') || key.includes('reader') || key.includes(this.bookId.toString())) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage entries
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('pdf') || key.includes('reader') || key.includes(this.bookId.toString())) {
          sessionStorage.removeItem(key);
        }
      });

      // Clear IndexedDB entries (PDF.js worker cache)
      if ('indexedDB' in window) {
        this.clearIndexedDBCache();
      }

      console.log('[PdfRangeTransport] Cleared browser caches');
    } catch (error) {
      console.warn('[PdfRangeTransport] Could not clear all caches:', error);
    }
  }

  /**
   * Clear IndexedDB cache (PDF.js worker storage)
   */
  private clearIndexedDBCache(): void {
    try {
      const deleteDB = (dbName: string) => {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => console.log(`[PdfRangeTransport] Deleted IndexedDB: ${dbName}`);
        deleteReq.onerror = () => console.warn(`[PdfRangeTransport] Failed to delete IndexedDB: ${dbName}`);
      };

      // Common PDF.js IndexedDB names
      ['pdfjs', 'mozilla-pdf-js', 'pdf-worker', `pdf-${this.bookId}`].forEach(deleteDB);
    } catch (error) {
      console.warn('[PdfRangeTransport] Could not clear IndexedDB:', error);
    }
  }
}

