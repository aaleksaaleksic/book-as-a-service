import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_CONFIG, AUTH_CONFIG } from '@/utils/constants';
import type { BookReadAccessResponse, SecureStreamDescriptor } from '@/types/reader';

const descriptorCache = new Map<string, CacheEntry>();

const CACHE_TTL_BUFFER_MS = 5_000;
const MAX_CACHE_ENTRIES = 100;

interface CacheEntry {
    descriptor: SecureStreamDescriptor;
    expiresAt?: number;
    lastAccess: number;
}

class ProxyError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

const normalizeStreamUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return new URL(url, API_CONFIG.BASE_URL).toString();
};

const getCacheKey = (bookId: number, token: string) => `${bookId}:${token}`;

const parseExpiration = (descriptor: SecureStreamDescriptor): number | undefined => {
    if (!descriptor.expiresAt) {
        return undefined;
    }

    const expiresAt = Date.parse(descriptor.expiresAt);
    if (Number.isNaN(expiresAt)) {
        return undefined;
    }

    return expiresAt;
};

const isEntryValid = (entry?: CacheEntry | null) => {
    if (!entry) {
        return false;
    }

    if (!entry.expiresAt) {
        return true;
    }

    return entry.expiresAt - CACHE_TTL_BUFFER_MS > Date.now();
};

const pruneCache = () => {
    if (descriptorCache.size <= MAX_CACHE_ENTRIES) {
        return;
    }

    const entries = Array.from(descriptorCache.entries()).sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    const excess = descriptorCache.size - MAX_CACHE_ENTRIES;
    for (let i = 0; i < excess; i += 1) {
        const [key] = entries[i] ?? [];
        if (key) {
            descriptorCache.delete(key);
        }
    }
};

const setCacheEntry = (key: string, descriptor: SecureStreamDescriptor) => {
    pruneCache();
    descriptorCache.set(key, {
        descriptor,
        expiresAt: parseExpiration(descriptor),
        lastAccess: Date.now(),
    });
};

const getCachedDescriptor = (key: string): SecureStreamDescriptor | null => {
    const entry = descriptorCache.get(key);
    if (!entry) {
        return null;
    }
    if (!isEntryValid(entry)) {
        descriptorCache.delete(key);
        return null;
    }
    entry.lastAccess = Date.now();
    return entry.descriptor;
};

const fetchStreamDescriptor = async (bookId: number, token: string): Promise<SecureStreamDescriptor> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/books/${bookId}/read`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Readify-Auth': token,
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new ProxyError('Failed to fetch streaming metadata', response.status);
    }

    const payload = (await response.json()) as BookReadAccessResponse;

    if (!payload?.canAccess || !payload.stream || typeof payload.stream !== 'object') {
        throw new ProxyError('Streaming session unavailable for this book', 403);
    }

    if ('error' in payload.stream) {
        throw new ProxyError('PDF source unavailable', 503);
    }

    const stream = payload.stream as SecureStreamDescriptor;

    const headers: Record<string, string> = {};
    if (stream.headers && typeof stream.headers === 'object') {
        for (const [key, value] of Object.entries(stream.headers)) {
            if (typeof value === 'string' && key) {
                headers[key] = value;
            }
        }
    }

    const contentLength = Number(stream.contentLength);
    const chunkSize = Number(stream.chunkSize);

    return {
        url: stream.url ?? `${API_CONFIG.BASE_URL}/api/reader/${bookId}/content`,
        contentLength: Number.isFinite(contentLength) && contentLength > 0 ? contentLength : 0,
        chunkSize: Number.isFinite(chunkSize) && chunkSize > 0 ? chunkSize : 2097152,
        expiresAt: stream.expiresAt,
        headers,
    } satisfies SecureStreamDescriptor;
};

const getDescriptor = async (
    bookId: number,
    token: string,
    forceRefresh = false
): Promise<SecureStreamDescriptor> => {
    const cacheKey = getCacheKey(bookId, token);

    if (!forceRefresh) {
        const cached = getCachedDescriptor(cacheKey);
        if (cached) {
            return cached;
        }
    }

    const descriptor = await fetchStreamDescriptor(bookId, token);
    setCacheEntry(cacheKey, descriptor);
    return descriptor;
};

const createBackendHeaders = (
    descriptor: SecureStreamDescriptor,
    request: NextRequest,
    token: string
): Headers => {
    const headers = new Headers();
    headers.set('Accept', 'application/pdf');

    const forbidden = new Set(['host', 'connection', 'content-length']);

    if (descriptor.headers) {
        Object.entries(descriptor.headers).forEach(([key, value]) => {
            if (typeof value !== 'string') {
                return;
            }
            const lowerKey = key.toLowerCase();
            if (forbidden.has(lowerKey)) {
                return;
            }
            headers.set(key, value);
        });
    }

    if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const range = request.headers.get('range');
    if (range) {
        headers.set('Range', range);
    }

    const ifRange = request.headers.get('if-range');
    if (ifRange) {
        headers.set('If-Range', ifRange);
    }

    const referer = request.headers.get('referer');
    if (referer) {
        headers.set('Referer', referer);
    }

    return headers;
};

const forwardResponse = async (response: Response, method: 'GET' | 'HEAD') => {
    const headers = new Headers();
    const allowedHeaders = new Set([
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'content-disposition',
        'cache-control',
        'last-modified',
        'etag',
        'content-encoding',
        'x-readify-session',
        'x-readify-watermark',
        'x-readify-issued-at',
    ]);

    response.headers.forEach((value, key) => {
        if (allowedHeaders.has(key.toLowerCase())) {
            headers.set(key, value);
        }
    });

    headers.set('Cache-Control', 'no-store');

    if (method === 'HEAD') {
        return new NextResponse(null, {
            status: response.status,
            headers,
        });
    }

    return new NextResponse(response.body, {
        status: response.status,
        headers,
    });
};

const normalizeAuthToken = (rawToken?: string | null): string | null => {
    if (!rawToken) {
        return null;
    }

    const trimmed = rawToken.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.toLowerCase().startsWith('bearer ')) {
        const withoutPrefix = trimmed.slice(7).trim();
        return withoutPrefix ? withoutPrefix : null;
    }

    return trimmed;
};

const extractTokenFromSearchParams = (request: NextRequest): string | null => {
    const tryNormalize = (value: string | null) => normalizeAuthToken(value);

    const paramCandidates = [
        request.nextUrl.searchParams.get('authToken'),
        request.nextUrl.searchParams.get('token'),
        request.nextUrl.searchParams.get('auth_token'),
    ];

    for (const candidate of paramCandidates) {
        const normalised = tryNormalize(candidate);
        if (normalised) {
            return normalised;
        }
    }

    try {
        const fallbackParams = new URL(request.url).searchParams;
        for (const key of ['authToken', 'token', 'auth_token']) {
            const value = tryNormalize(fallbackParams.get(key));
            if (value) {
                return value;
            }
        }
    } catch {
        // noop – malformed URL should not break token extraction
    }

    return null;
};

const extractAuthToken = async (request: NextRequest): Promise<string | null> => {
    const explicitHeaderToken = normalizeAuthToken(request.headers.get('x-readify-auth'));
    if (explicitHeaderToken) {
        return explicitHeaderToken;
    }

    const headerToken = normalizeAuthToken(request.headers.get('authorization'));
    if (headerToken) {
        return headerToken;
    }

    const queryToken = extractTokenFromSearchParams(request);
    if (queryToken) {
        return queryToken;
    }

    let cookieToken = normalizeAuthToken(request.cookies.get(AUTH_CONFIG.TOKEN_KEY)?.value ?? null);

    if (!cookieToken) {
        const cookieStore = await cookies();
        cookieToken = normalizeAuthToken(cookieStore.get(AUTH_CONFIG.TOKEN_KEY)?.value ?? null);
    }

    if (cookieToken) {
        return cookieToken;
    }

    return null;
};

const proxyPdfRequest = async (
    request: NextRequest,
    bookId: number,
    method: 'GET' | 'HEAD'
): Promise<NextResponse> => {
    const token = await extractAuthToken(request);

    if (!token) {
        throw new ProxyError('Authentication required', 401);
    }

    let descriptor = await getDescriptor(bookId, token);

    if (method === 'HEAD' && descriptor.contentLength > 0) {
        const headers = new Headers();
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Cache-Control', 'no-store');
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Length', descriptor.contentLength.toString());
        headers.set('Content-Range', `bytes 0-0/${descriptor.contentLength}`);

        if (descriptor.headers) {
            Object.entries(descriptor.headers).forEach(([key, value]) => {
                if (typeof value === 'string' && key.toLowerCase().startsWith('x-readify-')) {
                    headers.set(key, value);
                }
            });
        }

        return new NextResponse(null, { status: 200, headers });
    }

    const backendMethod: 'GET' | 'HEAD' = method === 'HEAD' ? 'GET' : method;

    const proxyFetch = async (targetDescriptor: SecureStreamDescriptor) => {
        const headers = createBackendHeaders(targetDescriptor, request, token);
        const backendResponse = await fetch(normalizeStreamUrl(targetDescriptor.url), {
            method: backendMethod,
            headers,
            cache: 'no-store',
            redirect: 'manual',
            signal: request.signal,
        });
        return backendResponse;
    };

    let backendResponse = await proxyFetch(descriptor);

    if (backendResponse.status === 401 || backendResponse.status === 403) {
        descriptor = await getDescriptor(bookId, token, true);
        backendResponse = await proxyFetch(descriptor);
    }

    if (backendResponse.status === 401 || backendResponse.status === 403) {
        throw new ProxyError('Streaming session unauthorized', backendResponse.status);
    }

    return forwardResponse(backendResponse, method);
};

const handleRequest = async (
    request: NextRequest,
    params: { bookId: string },
    method: 'GET' | 'HEAD'
): Promise<NextResponse> => {
    const bookId = Number(params.bookId);

    if (!Number.isFinite(bookId) || bookId <= 0) {
        return NextResponse.json(
            { error: 'Invalid book identifier.' },
            { status: 400 }
        );
    }

    try {
        return await proxyPdfRequest(request, bookId, method);
    } catch (error) {
        if (error instanceof ProxyError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Failed to proxy PDF request', error);
        return NextResponse.json(
            { error: 'Unexpected error while streaming the requested document.' },
            { status: 500 }
        );
    }
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ bookId: string }> }
) {
    const params = await context.params;
    return handleRequest(request, params, 'GET');
}

export async function HEAD(
    request: NextRequest,
    context: { params: Promise<{ bookId: string }> }
) {
    const params = await context.params;
    return handleRequest(request, params, 'HEAD');
}
