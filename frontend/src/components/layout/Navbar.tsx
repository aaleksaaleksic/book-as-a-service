'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import {
    AlertTriangle,
    BookOpen,
    LogOut,
    Menu,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface NavigationItem {
    label: string;
    href: string;
    auth?: boolean;
    admin?: boolean;
}

const PUBLIC_ITEMS: NavigationItem[] = [
    { label: 'Početna', href: '/' },
    { label: 'Biblioteka', href: '/browse' },
    { label: 'Promo Poglavlja', href: '/promo-chapters' },
    { label: 'Cene', href: '/pricing' },
];

const AUTH_ITEMS: NavigationItem[] = [
    { label: 'Moja Biblioteka', href: '/dashboard', auth: true },
    { label: 'Moj Profil', href: '/profile', auth: true },
    { label: 'Pretplata', href: '/subscription', auth: true },
];

const ADMIN_ITEMS: NavigationItem[] = [
    { label: 'Admin Panel', href: '/admin', admin: true },
];

export const Navbar = () => {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isAdmin = user?.permissions?.includes('CAN_CREATE_BOOKS');

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        router.push('/');
    };

    // Only show public navigation items in navbar (keep it clean)
    const navigation: NavigationItem[] = PUBLIC_ITEMS;

    return (
        <header className="w-full border-b border-white/10 bg-gradient-to-r from-library-gold via-amber-300 to-library-gold">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/logo.svg"
                        alt="Bookotecha Logo"
                        width={180}
                        height={40}
                        className="h-auto w-48 object-contain"
                        priority
                    />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden items-center gap-6 lg:flex">
                    {navigation.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-blue-950 transition-colors hover:text-white"
                        >
                            {item.label}
                        </Link>
                    ))}

                    {/* Admin Panel - Special styling to stand out */}
                    {isAuthenticated && isAdmin && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-1.5 rounded-full  bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-xl"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Admin Panel
                        </Link>
                    )}
                </nav>

                {/* Desktop actions */}
                <div className="hidden items-center gap-4 lg:flex">


                    {isAuthenticated && user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2 rounded-full border border-transparent px-2 py-1.5 text-white hover:border-white/10 hover:bg-white/10"
                                >
                                    {/* Avatar */}
                                    <div
                                        className={`relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center ${
                                            user?.avatarUrl
                                                ? 'border border-reading-accent/20 bg-reading-surface'
                                                : 'bg-sky-950 text-white'
                                        } text-sm`}
                                        style={
                                            user?.avatarUrl
                                                ? {
                                                      backgroundImage: `url(${user.avatarUrl})`,
                                                      backgroundSize: 'cover',
                                                      backgroundPosition: 'center',
                                                  }
                                                : undefined
                                        }
                                    >
                                        {!user?.avatarUrl && (
                                            <span className="font-semibold">
                                                {`${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.toUpperCase() ||
                                                    'U'}
                                            </span>
                                        )}
                                    </div>

                                    <span className="hidden text-sm font-medium text-sky-950 sm:inline">
                                        {`${user.firstName} ${user.lastName}`}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-64">
                                <div className="border-b px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar medium */}
                                        <div
                                            className={`relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${
                                                user?.avatarUrl
                                                    ? 'border border-reading-accent/20 bg-reading-surface'
                                                    : 'bg-reading-accent text-white'
                                            } text-sm`}
                                            style={
                                                user?.avatarUrl
                                                    ? {
                                                          backgroundImage: `url(${user.avatarUrl})`,
                                                          backgroundSize: 'cover',
                                                          backgroundPosition: 'center',
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {!user?.avatarUrl && (
                                                <span className="font-semibold">
                                                    {`${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.toUpperCase() ||
                                                        'U'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-reading-text">
                                                {`${user.firstName} ${user.lastName}`}
                                            </p>
                                            <p className="truncate text-xs text-reading-text/60">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <DropdownMenuItem
                                    onClick={() => router.push('/dashboard')}
                                    className="cursor-pointer"
                                >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Moja Biblioteka
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => router.push('/profile')}
                                    className="cursor-pointer"
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    Moj profil
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => router.push('/subscription')}
                                    className="cursor-pointer"
                                >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Pretplata
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => router.push('/settings')}
                                    className="cursor-pointer"
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Podešavanja
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Odjavi se
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : !isLoading ? (
                        <div className="flex items-center gap-3 text-blue-950">
                            <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                                Prijavi se
                            </Button>
                            <Button onClick={() => router.push('/auth/register')}>
                                Kreiraj nalog
                            </Button>
                        </div>
                    ) : null}
                </div>

                {/* Mobile menu */}
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full lg:hidden"
                        >
                            <Menu className="h-5 w-5 text-white" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 bg-reading-surface">
                        <nav className="mt-6 space-y-2">
                            {/* Public navigation */}
                            {navigation.map((item) => (
                                <button
                                    key={item.href}
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        router.push(item.href);
                                    }}
                                    className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-reading-text transition-colors hover:bg-reading-accent/10"
                                >
                                    {item.label}
                                </button>
                            ))}

                            {/* Authenticated user items */}
                            {isAuthenticated && (
                                <>
                                    <div className="my-4 border-t border-reading-accent/10" />

                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push('/dashboard');
                                        }}
                                        className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-reading-text transition-colors hover:bg-reading-accent/10"
                                    >
                                        📚 Moja Biblioteka
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push('/profile');
                                        }}
                                        className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-reading-text transition-colors hover:bg-reading-accent/10"
                                    >
                                        👤 Moj Profil
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push('/subscription');
                                        }}
                                        className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-reading-text transition-colors hover:bg-reading-accent/10"
                                    >
                                        ✨ Pretplata
                                    </button>

                                    {/* Admin Panel - Special styling */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                router.push('/admin');
                                            }}
                                            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-left text-sm font-semibold text-white shadow-md transition-all hover:from-amber-600 hover:to-orange-600"
                                        >
                                            🛡️ Admin Panel
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push('/settings');
                                        }}
                                        className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-reading-text transition-colors hover:bg-reading-accent/10"
                                    >
                                        ⚙️ Podešavanja
                                    </button>

                                    <div className="my-4 border-t border-reading-accent/10" />

                                    <button
                                        onClick={() => {
                                            handleLogout();
                                        }}
                                        className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                    >
                                        🚪 Odjavi se
                                    </button>
                                </>
                            )}
                        </nav>

                        {!isAuthenticated && !isLoading && (
                            <div className="mt-8 space-y-3">
                                <Button
                                    className="w-full"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        router.push('/auth/login');
                                    }}
                                >
                                    Prijavi se
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        router.push('/auth/register');
                                    }}
                                >
                                    Kreiraj nalog
                                </Button>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
};
