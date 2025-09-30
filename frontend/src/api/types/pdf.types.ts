// src/types/pdf.types.ts

/**
 * PDF Metadata response from backend
 * Contains everything needed to initialize PDF.js streaming
 */
export interface PdfMetadata {
  totalSize: number;
  initialChunk: string; // Base64-encoded
  initialChunkSize: number;
  sessionToken: string;
  watermarkSignature: string;
  issuedAt: string;
  recommendedChunkSize: number;
  title: string;
  pdfVersion: string;
}

/**
 * PDF.js requires this structure for custom range transport
 */
export interface PdfRangeTransport {
  length: number;
  initialData: Uint8Array;
  requestRange: (begin: number, end: number) => Promise<void>;
  abort: () => void;
}