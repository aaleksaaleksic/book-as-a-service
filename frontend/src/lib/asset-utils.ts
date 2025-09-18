import { API_CONFIG } from '@/utils/constants';

const ENV_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim();

const DEFAULT_API_BASE_URL = ENV_API_BASE_URL && ENV_API_BASE_URL.length > 0
    ? ENV_API_BASE_URL
    : API_CONFIG.BASE_URL;

const API_BASE_URL = DEFAULT_API_BASE_URL.replace(/\/?$/, '');

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

const normalizePath = (path: string) => path.replace(/\\/g, '/');

export function resolveApiFileUrl(path?: string | null): string | null {
    if (!path) {
        return null;
    }

    const trimmedPath = normalizePath(path.trim());

    if (trimmedPath.length === 0) {
        return null;
    }

    if (ABSOLUTE_URL_REGEX.test(trimmedPath)) {
        return trimmedPath;
    }

    const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;

    if (!API_BASE_URL) {
        return normalizedPath;
    }

    try {
        return new URL(normalizedPath, API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`).toString();
    } catch (error) {
        console.warn('Failed to build file URL', { path: normalizedPath, baseUrl: API_BASE_URL, error });
        return `${API_BASE_URL}${normalizedPath}`;
    }
}

