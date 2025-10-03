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

    const navigation: NavigationItem[] = [
        ...PUBLIC_ITEMS,
        ...(isAuthenticated ? AUTH_ITEMS : []),
        ...(isAuthenticated && isAdmin ? ADMIN_ITEMS : []),
    ];

    return (
        <header className="w-full border-b border-white/10 bg-gradient-to-r from-reading-accent/90 to-reading-surface/80 backdrop-blur-lg">
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
                </nav>

                {/* Desktop actions */}
                <div className="hidden items-center gap-4 lg:flex">
                    <div className="flex w-64 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
                        <Search className="h-4 w-4 text-blue-950" />
                        <Input
                            placeholder="Pretraži knjige"
                            className="h-auto border-none bg-transparent p-0 text-sm text-blue-950 placeholder:text-blue-950 focus-visible:ring-0"
                        />
                    </div>

                    {isAuthenticated && user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-white hover:bg-white/10"
                                >
                                    <User className="h-4 w-4" />
                                    <span className="hidden text-sm sm:inline">{user.firstName}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => router.push('/settings')}>
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
