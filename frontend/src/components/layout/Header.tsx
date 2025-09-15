'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth, useMe } from '@/hooks/useAuth';
import { dt } from '@/lib/design-tokens';

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Browse', href: '/browse' },
    { name: 'Categories', href: '/categories' },
    { name: 'Pricing', href: '/pricing' },
];

export const Header = () => {
    const router = useRouter();
    const { isAuthenticated, logout } = useAuth();
    const { user, fullName } = useMe();

    const handleAuthAction = (action: 'login' | 'register') => {
        router.push(`/auth/${action}`);
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <header className={dt.components.nav}>
            <div className={dt.layouts.pageContainer}>
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <BookOpen className="w-8 h-8 text-reading-accent" />
                            <span className={`${dt.typography.cardTitle} text-reading-text`}>
                ReadBookHub
              </span>
                        </Link>

                        <nav className={dt.responsive.navDesktop}>
                            <div className="flex items-center gap-6">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`${dt.typography.body} ${dt.interactive.link} hover:text-reading-accent transition-colors`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span className="hidden sm:inline">{fullName}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                                        Dashboard
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push('/library')}>
                                        My Library
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push('/subscription')}>
                                        Subscription
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <div className="hidden sm:flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleAuthAction('login')}
                                        className={dt.interactive.buttonSecondary}
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        onClick={() => handleAuthAction('register')}
                                        className={dt.interactive.buttonPrimary}
                                    >
                                        Start Free Trial
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
                                        <span className={dt.typography.cardTitle}>ReadBookHub</span>
                                    </Link>

                                    <nav className="flex flex-col gap-4">
                                        {navigation.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={`${dt.typography.body} text-reading-text hover:text-reading-accent transition-colors py-2`}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </nav>

                                    {!isAuthenticated && (
                                        <div className="flex flex-col gap-3 pt-4 border-t border-reading-accent/10">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleAuthAction('login')}
                                                className="w-full"
                                            >
                                                Sign In
                                            </Button>
                                            <Button
                                                onClick={() => handleAuthAction('register')}
                                                className="w-full"
                                            >
                                                Start Free Trial
                                            </Button>
                                        </div>
                                    )}

                                    {isAuthenticated && (
                                        <div className="flex flex-col gap-3 pt-4 border-t border-reading-accent/10">
                                            <div className={`${dt.typography.small} text-reading-text/70 px-2`}>
                                                Welcome, {fullName}
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push('/dashboard')}
                                                className="w-full justify-start"
                                            >
                                                Dashboard
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push('/library')}
                                                className="w-full justify-start"
                                            >
                                                My Library
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleLogout}
                                                className="w-full justify-start text-red-600"
                                            >
                                                Sign Out
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
};