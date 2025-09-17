'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    BookOpen,
    Menu,
    User,
    Search,
    Settings,
    LogOut,
    AlertTriangle,
    Phone,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        router.push('/');
    };

    const fullName = user ? `${user.firstName} ${user.lastName}` : '';
    const initials = user ?
        `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
        : 'U';

    const needsPhoneVerification = user && !user.phoneVerified;

    return (
        <>
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
                            {isAuthenticated && user ? (
                                <>
                                    {/* Phone Verification Warning Badge */}
                                    {needsPhoneVerification && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                                            onClick={() => router.push('/settings/phone-verification')}
                                        >
                                            <AlertTriangle className="w-3 h-3 mr-2" />
                                            Verifikuj telefon
                                        </Button>
                                    )}

                                    {/* User Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="flex items-center gap-2 p-1.5 hover:bg-book-green-50"
                                            >
                                                {/* Avatar sa inicijalima */}
                                                <div className="w-9 h-9 bg-reading-accent text-white rounded-full flex items-center justify-center font-medium">
                                                    {initials}
                                                </div>
                                                <span className="font-medium text-reading-text">
                                                    {fullName}
                                                </span>
                                                <ChevronDown className="w-4 h-4 text-reading-text/60" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end" className="w-64">
                                            {/* User Info Header */}
                                            <div className="px-4 py-3 border-b">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-reading-accent text-white rounded-full flex items-center justify-center font-medium">
                                                        {initials}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-reading-text">
                                                            {fullName}
                                                        </p>
                                                        <p className="text-xs text-reading-text/60 truncate">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Phone Verification Alert in Dropdown */}
                                                {needsPhoneVerification && (
                                                    <div
                                                        className="mt-3 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                                                        onClick={() => {
                                                            router.push('/settings/phone-verification');
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="w-4 h-4 text-yellow-600" />
                                                            <span className="text-xs text-yellow-700 font-medium">
                                                                Verifikuj broj telefona
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Menu Items */}
                                            <DropdownMenuItem
                                                onClick={() => router.push('/profile')}
                                                className="cursor-pointer"
                                            >
                                                <User className="w-4 h-4 mr-2" />
                                                Moj profil
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={() => router.push('/settings')}
                                                className="cursor-pointer"
                                            >
                                                <Settings className="w-4 h-4 mr-2" />
                                                Podešavanja
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem
                                                onClick={handleLogout}
                                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                            >
                                                <LogOut className="w-4 h-4 mr-2" />
                                                Odjavi se
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                                        Prijavi se
                                    </Button>
                                    <Button onClick={() => router.push('/auth/register')}>
                                        Kreiraj nalog
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu */}
                        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="sm" className={dt.responsive.navMobile}>
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72">
                                {/* Mobile menu content - isti sadržaj kao gore */}
                                {isAuthenticated && user && (
                                    <div className="mb-6 pb-6 border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-reading-accent text-white rounded-full flex items-center justify-center font-medium">
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="font-medium text-reading-text">
                                                    {fullName}
                                                </p>
                                                <p className="text-xs text-reading-text/60">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <nav className="space-y-2">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block px-3 py-2 rounded-lg hover:bg-book-green-50 transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            {/* Global Phone Verification Alert */}
            {needsPhoneVerification && (
                <Alert
                    className="mx-auto max-w-7xl mt-4 border-yellow-400 bg-yellow-50 cursor-pointer"
                    onClick={() => router.push('/settings/phone-verification')}
                >
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="flex items-center justify-between text-yellow-800">
                        <span>
                            Molimo vas verifikujte broj telefona kako biste otključali sve funkcionalnosti.
                        </span>
                        <Button size="sm" variant="outline" className="ml-4 border-yellow-400 text-yellow-700">
                            Verifikuj sada
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
        </>
    );
};