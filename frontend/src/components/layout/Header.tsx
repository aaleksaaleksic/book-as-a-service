'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Menu, User, Search, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { dt } from '@/lib/design-tokens';

interface NavigationItem {
    label: string;
    href: string;
}

export const Header = () => {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigation: NavigationItem[] = [
        { label: 'Početna', href: '/' },
        { label: 'Pretraži', href: '/browse' },
        { label: 'Kategorije', href: '/categories' },
        { label: 'Cene', href: '/pricing' },
    ];

    const handleAuthAction = (action: 'login' | 'register') => {
        setIsMenuOpen(false);
        router.push(`/auth/${action}`);
    };

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        router.push('/');
    };

    const fullName = user ? `${user.firstName} ${user.lastName}` : '';

    return (
        <header className={dt.components.nav}>
            <div className={dt.layouts.pageContainer}>
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <BookOpen className="w-8 h-8 text-reading-accent" />
                        <span className={`${dt.typography.cardTitle} text-reading-text`}>
                            ReadBookHub
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className={`${dt.responsive.navDesktop} items-center gap-8`}>
                        {navigation.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${dt.typography.body} text-reading-text/70 hover:text-reading-accent transition-colors`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Auth Actions */}
                    <div className={`${dt.responsive.navDesktop} items-center gap-4`}>
                        {isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon">
                                    <Search className="w-4 h-4" />
                                </Button>

                                <div className={`${dt.typography.small} text-reading-text/70 px-2`}>
                                    Dobrodošli, {fullName}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.push('/settings')}
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleLogout}
                                    className="text-red-600"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="hidden sm:flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleAuthAction('login')}
                                        className={dt.interactive.buttonSecondary}
                                    >
                                        Prijavi se
                                    </Button>
                                    <Button
                                        onClick={() => handleAuthAction('register')}
                                        className={dt.interactive.buttonPrimary}
                                    >
                                        Počni besplatno
                                    </Button>
                                </div>
                            </>
                        )}

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className={dt.responsive.navMobile}>
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-80">
                                <div className="flex flex-col gap-6 pt-6">
                                    <Link href="/" className="flex items-center gap-2">
                                        <BookOpen className="w-6 h-6 text-reading-accent" />
                                        <span className={dt.typography.cardTitle}>ČitamKnjige</span>
                                    </Link>

                                    <nav className="flex flex-col gap-4">
                                        {navigation.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className={`${dt.typography.body} text-reading-text/70 hover:text-reading-accent transition-colors`}
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </nav>

                                    <div className="border-t border-reading-accent/10 pt-6">
                                        {isAuthenticated ? (
                                            <div className="space-y-4">
                                                <div className={`${dt.typography.small} text-reading-text/70 px-2`}>
                                                    Dobrodošli, {fullName}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => router.push('/dashboard')}
                                                    className="w-full justify-start"
                                                >
                                                    Kontrolna tabla
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => router.push('/library')}
                                                    className="w-full justify-start"
                                                >
                                                    Moja biblioteka
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleLogout}
                                                    className="w-full justify-start text-red-600"
                                                >
                                                    Odjavi se
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <Button
                                                    onClick={() => handleAuthAction('login')}
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    Prijavi se
                                                </Button>
                                                <Button
                                                    onClick={() => handleAuthAction('register')}
                                                    className="w-full bg-reading-accent hover:bg-reading-accent/90"
                                                >
                                                    Počni besplatno
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
};