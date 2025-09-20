import type { BookResponseDTO } from '@/api/types/books.types';

export interface SecureStreamDescriptor {
    url: string;
    contentLength: number;
    chunkSize: number;
    expiresAt?: string;
    headers?: Record<string, string>;
}

export interface ReaderWatermark {
    text: string;
    signature: string;
    issuedAt: string;
}

export interface BookReadAccessResponse {
    success: boolean;
    message: string;
    book: BookResponseDTO;
    canAccess: boolean;
    contentPreview?: string | null;
    stream?: SecureStreamDescriptor | { error: string };
    watermark?: ReaderWatermark;
}

export interface ReadingSessionPayload {
    bookId: number;
    deviceType?: string;
}

export interface ReadingProgressPayload {
    sessionId: number;
    currentPage: number;
}

export interface ReadingSessionEndPayload {
    sessionId: number;
    pagesRead?: number;
}

export interface ReadingSessionResponseDTO {
    id: number;
    sessionStart: string;
    sessionEnd?: string;
    durationMinutes?: number;
    pagesRead?: number;
    lastPagePosition?: number;
    deviceType?: string;
    sessionActive?: boolean;
    createdAt: string;
    bookId: number;
    bookTitle?: string;
    bookAuthor?: string;
    userId: number;
    userEmail?: string;
    userName?: string;
    totalMinutesRead?: number;
    isActiveSession?: boolean;
}

export interface ReadingSessionApiResponse {
    success: boolean;
    message: string;
    session: ReadingSessionResponseDTO;
}
