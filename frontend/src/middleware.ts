import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = {
    '/admin': ['ADMIN', 'MODERATOR'],
    '/admin/books': ['ADMIN', 'MODERATOR'],
    '/admin/books/new': ['ADMIN', 'MODERATOR'],
    '/admin/books/[id]/edit': ['ADMIN', 'MODERATOR'],
    '/admin/users': ['ADMIN'],
    '/admin/payments': ['ADMIN'],
    '/admin/analytics': ['ADMIN', 'MODERATOR'],
    '/library': ['USER', 'ADMIN', 'MODERATOR'],
    '/reader': ['USER', 'ADMIN', 'MODERATOR'],
    '/reader/[id]': ['USER', 'ADMIN', 'MODERATOR'],
    '/subscription': ['USER', 'ADMIN', 'MODERATOR'],
};

const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/browse',
    '/books/[id]',
    '/about',
    '/contact',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtectedRoute = Object.keys(protectedRoutes).some(route => {
        const routePattern = route.replace(/\[.*?\]/g, '.*');
        const regex = new RegExp(`^${routePattern}$`);
        return regex.test(pathname);
    });

    if (!isProtectedRoute) {
        return NextResponse.next();
    }


    const token = request.cookies.get('readbookhub_auth_token');

    if (!token) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Ovde bi trebalo dekodirati JWT i proveriti role
    // Ali pošto ne možemo dekodirati JWT na middleware nivou bez secret-a,
    // ova provera će se raditi na klijentskoj strani kroz AuthGuard komponentu

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Uključi sve rute osim statičkih fajlova i API ruta
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
};