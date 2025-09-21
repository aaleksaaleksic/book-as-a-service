import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { API_CONFIG, AUTH_CONFIG } from '@/utils/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEADER_WHITELIST = [
    'accept-ranges',
    'cache-control',
    'content-disposition',
    'content-length',
    'content-range',
    'content-type',
    'expires',
    'pragma',
    'permissions-policy',
    'referrer-policy',
    'x-content-type-options',
    'x-download-options',
    'x-frame-options',
    'x-readify-watermark',
];

function buildBackendUrl(bookId: string, request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const backendUrl = new URL(`/api/v1/files/books/${bookId}/content`, API_CONFIG.BASE_URL);

    const sessionToken = searchParams.get('sessionToken');
    const watermark = searchParams.get('watermark');
    const issuedAt = searchParams.get('issuedAt');

    if (sessionToken) {
        backendUrl.searchParams.set('sessionToken', sessionToken);
    }
    if (watermark) {
        backendUrl.searchParams.set('watermark', watermark);
    }
    if (issuedAt) {
        backendUrl.searchParams.set('issuedAt', issuedAt);
    }

    return backendUrl;
}

function collectForwardHeaders(request: NextRequest) {
    const headers: Record<string, string> = {};
    const { searchParams } = new URL(request.url);

    const sessionToken = searchParams.get('sessionToken');
    const watermark = searchParams.get('watermark');
    const issuedAt = searchParams.get('issuedAt');
    const rangeHeader = request.headers.get('range');

    const authToken = cookies().get(AUTH_CONFIG.TOKEN_KEY)?.value;

    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    if (rangeHeader) {
        headers.Range = rangeHeader;
    }

    if (sessionToken) {
        headers['X-Readify-Session'] = sessionToken;
    }

    if (watermark) {
        headers['X-Readify-Watermark'] = watermark;
    }

    if (issuedAt) {
        headers['X-Readify-Issued-At'] = issuedAt;
    }

    return { headers, authToken };
}

function copyResponseHeaders(backendResponse: Response) {
    const responseHeaders = new Headers();

    for (const headerName of HEADER_WHITELIST) {
        const value = backendResponse.headers.get(headerName);
        if (value) {
            responseHeaders.set(headerName, value);
        }
    }

    // Ensure the client can read custom headers from the streamed response
    const exposedHeaders = new Set(
        (backendResponse.headers.get('access-control-expose-headers') || '')
            .split(',')
            .map(header => header.trim())
            .filter(Boolean),
    );

    HEADER_WHITELIST.forEach(header => exposedHeaders.add(header));

    if (exposedHeaders.size > 0) {
        responseHeaders.set('Access-Control-Expose-Headers', Array.from(exposedHeaders).join(', '));
    }

    return responseHeaders;
}

export async function GET(request: NextRequest, { params }: { params: { bookId: string } }) {
    const bookId = params.bookId;

    if (!bookId) {
        return NextResponse.json(
            { success: false, message: 'Book identifier is required' },
            { status: 400 },
        );
    }

    const backendUrl = buildBackendUrl(bookId, request);
    const { headers, authToken } = collectForwardHeaders(request);

    if (!authToken) {
        return NextResponse.json(
            { success: false, message: 'Authentication required to access book content.' },
            { status: 401 },
        );
    }

    try {
        const backendResponse = await fetch(backendUrl, {
            method: 'GET',
            headers,
            redirect: 'manual',
        });

        const contentType = backendResponse.headers.get('content-type');

        if (!backendResponse.ok && contentType?.includes('application/json')) {
            const payload = await backendResponse.json().catch(() => null);
            return NextResponse.json(payload ?? { success: false }, { status: backendResponse.status });
        }

        return new NextResponse(backendResponse.body, {
            status: backendResponse.status,
            headers: copyResponseHeaders(backendResponse),
        });
    } catch (error) {
        console.error('Failed to proxy book stream request', error);
        return NextResponse.json(
            { success: false, message: 'Unable to stream book content at the moment.' },
            { status: 502 },
        );
    }
}
