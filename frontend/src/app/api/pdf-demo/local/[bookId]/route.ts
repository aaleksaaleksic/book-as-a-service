import { NextRequest } from 'next/server';
import { API_CONFIG } from '@/utils/constants';

const FORWARDED_RESPONSE_HEADERS = new Set([
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
    'cache-control',
    'content-disposition',
]);

const buildBackendUrl = (bookId: string) => {
    const normalizedId = Number.parseInt(bookId, 10);

    if (Number.isNaN(normalizedId) || normalizedId <= 0) {
        throw new Error('Invalid book id');
    }

    return `${API_CONFIG.BASE_URL}/api/v1/files/demo/local/${normalizedId}`;
};

const copyHeaders = (source: Headers): Headers => {
    const headers = new Headers();

    source.forEach((value, key) => {
        if (FORWARDED_RESPONSE_HEADERS.has(key.toLowerCase())) {
            headers.set(key, value);
        }
    });

    return headers;
};

const proxyRequest = async (method: 'GET' | 'HEAD', request: NextRequest, bookId: string) => {
    let backendUrl: string;

    try {
        backendUrl = buildBackendUrl(bookId);
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Neispravan ID knjige u zahtevu.',
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const headers = new Headers();
    headers.set('Accept', 'application/pdf');

    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
        headers.set('Range', rangeHeader);
    }

    const backendResponse = await fetch(backendUrl, {
        method,
        headers,
        cache: 'no-store',
        redirect: 'manual',
    });

    const responseHeaders = copyHeaders(backendResponse.headers);

    if (backendResponse.headers.has('content-length')) {
        responseHeaders.set('Content-Length', backendResponse.headers.get('content-length') as string);
    }

    if (backendResponse.headers.has('content-range')) {
        responseHeaders.set('Content-Range', backendResponse.headers.get('content-range') as string);
    }

    if (!responseHeaders.has('Content-Type')) {
        const fallbackType = backendResponse.headers.get('content-type') ?? 'application/pdf';
        responseHeaders.set('Content-Type', fallbackType);
    }

    if (method === 'HEAD') {
        return new Response(null, {
            status: backendResponse.status,
            headers: responseHeaders,
        });
    }

    const body = backendResponse.body;

    if (!body) {
        const text = await backendResponse.text();
        return new Response(text, {
            status: backendResponse.status,
            headers: responseHeaders,
        });
    }

    return new Response(body, {
        status: backendResponse.status,
        headers: responseHeaders,
    });
};

export async function GET(request: NextRequest, { params }: { params: { bookId: string } }) {
    return proxyRequest('GET', request, params.bookId);
}

export async function HEAD(request: NextRequest, { params }: { params: { bookId: string } }) {
    return proxyRequest('HEAD', request, params.bookId);
}
