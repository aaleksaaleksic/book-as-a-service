'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    BookOpen,
    ChevronDown,
    LogOut,
    Menu,
    Phone,
    Search,
    Settings,
    ShieldCheck,
    User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dt } from '@/lib/design-tokens';

interface NavigationItem {
    label: string;
    href: string;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
    { label: 'Početna', href: '/' },
    { label: 'Pretraži', href: '/browse' },
    { label: 'Cene', href: '/pricing' },
];

export const Navbar = () => {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
    const firstInitial = user?.firstName?.charAt(0) ?? '';
    const lastInitial = user?.lastName?.charAt(0) ?? '';
    const initials = `${firstInitial}${lastInitial}`.trim().toUpperCase()
        || (firstInitial || lastInitial || 'U').toUpperCase();
    const avatarSource = user?.avatarUrl?.trim() ?? '';
    const hasAvatar = Boolean(avatarSource);
    const needsPhoneVerification = Boolean(user && !user.phoneVerified);
    const phoneNumber = user?.phoneNumber?.trim() ?? '';

    const goToPhoneVerification = () => {
        router.push('/auth/phone-verification');
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        router.push('/');
    };

    const renderAvatar = (size: 'sm' | 'md' | 'lg' = 'sm') => {
        const dimension =
            size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-10 h-10' : 'w-9 h-9';
        const textSize = size === 'lg' ? 'text-lg' : 'text-sm';

        return (
            <div
                className={`relative ${dimension} rounded-full overflow-hidden flex items-center justify-center ${
                    hasAvatar
                        ? 'border border-reading-accent/20 bg-reading-surface'
                        : 'bg-reading-accent text-white'
                } ${hasAvatar ? '' : textSize}`}
                style={
                    hasAvatar
                        ? {
                              backgroundImage: `url(${avatarSource})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                          }
                        : undefined
                }
            >
                {!hasAvatar && <span className="font-semibold">{initials}</span>}
            </div>
        );
    };

    const navigation = NAVIGATION_ITEMS;

    return (
        <>
            <header className={dt.components.nav}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center gap-3 rounded-full border border-reading-accent/10 bg-reading-surface px-4 py-3 shadow-sm sm:px-6">
                        <div className="flex items-center gap-3">
                            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full lg:hidden"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-80">
                                    {isAuthenticated && user && (
                                        <div className="mb-6 space-y-4 rounded-2xl border border-reading-accent/10 bg-reading-surface p-4">
                                            <div className="flex items-center gap-3">
                                                {renderAvatar('lg')}
                                                <div>
                                                    <p className="font-medium text-reading-text">{fullName}</p>
                                                    <p className="text-xs text-reading-text/60">{user.email}</p>
                                                    {phoneNumber && (
                                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                                            <span className="text-xs text-reading-text/60">{phoneNumber}</span>
                                                            <Badge
                                                                variant="secondary"
                                                                className={`flex items-center gap-1 ${
                                                                    needsPhoneVerification
                                                                        ? 'border-yellow-200 bg-yellow-100 text-yellow-800'
                                                                        : 'border-green-200 bg-green-100 text-green-700'
                                                                }`}
                                                            >
                                                                {needsPhoneVerification ? (
                                                                    <>
                                                                        <AlertTriangle className="h-3 w-3" />
                                                                        <span>Potrebna verifikacija</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ShieldCheck className="h-3 w-3" />
                                                                        <span>Verifikovano</span>
                                                                    </>
                                                                )}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {needsPhoneVerification && (
                                                <div className="space-y-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                                                    <p className="text-xs text-yellow-800">
                                                        Verifikujte broj telefona kako biste otključali sve pogodnosti platforme.
                                                    </p>
                                                    <Button
                                                        onClick={goToPhoneVerification}
                                                        variant="outline"
                                                        className="w-full border-yellow-400 bg-yellow-400/10 text-yellow-800 transition-colors hover:bg-yellow-400/20"
                                                    >
                                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                                        Verifikuj telefon
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 rounded-full border border-reading-accent/10 bg-reading-background px-4 py-2">
                                            <Search className="h-4 w-4 text-reading-text/50" />
                                            <Input
                                                placeholder="Pretraži knjige"
                                                className="h-auto border-none bg-transparent p-0 text-sm focus-visible:ring-0"
                                            />
                                        </div>
                                    </div>

                                    <nav className="space-y-2">
                                        {navigation.map((item) => (
                                            <button
                                                key={item.href}
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    router.push(item.href);
                                                }}
                                                className="w-full rounded-xl px-4 py-2 text-left text-sm font-medium text-reading-text/80 transition-colors hover:bg-reading-accent/10 hover:text-reading-text"
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

                            <Link href="/" className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-reading-accent text-white shadow-md">
                                    <BookOpen className="h-5 w-5" />
                                </span>
                                <span className="text-lg font-semibold text-reading-text">
                                    ReadBookHub
                                </span>
                            </Link>
                        </div>

                        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
                            {navigation.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="text-sm font-medium text-reading-text/70 transition-colors hover:text-reading-text"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="ml-auto flex items-center gap-4">
                            <div className="hidden md:flex w-64 items-center gap-2 rounded-full border border-reading-accent/10 bg-reading-background px-4 py-2">
                                <Search className="h-4 w-4 text-reading-text/50" />
                                <Input
                                    placeholder="Pretraži knjige"
                                    className="h-auto border-none bg-transparent p-0 text-sm focus-visible:ring-0"
                                />
                            </div>

                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-24" />
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                </div>
                            ) : isAuthenticated && user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="flex items-center gap-2 rounded-full border border-transparent px-2 py-1.5 hover:border-reading-accent/20 hover:bg-reading-accent/10"
                                        >
                                            {renderAvatar('sm')}
                                            <span className="hidden text-sm font-medium text-reading-text sm:inline">{fullName}</span>
                                            <ChevronDown className="h-4 w-4 text-reading-text/60" />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="w-64">
                                        <div className="border-b px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {renderAvatar('md')}
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-reading-text">{fullName}</p>
                                                    <p className="truncate text-xs text-reading-text/60">{user.email}</p>
                                                    {phoneNumber && (
                                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                                            <span className="text-xs text-reading-text/60">
                                                                {phoneNumber}
                                                            </span>
                                                            <Badge
                                                                variant="secondary"
                                                                className={`flex items-center gap-1 ${
                                                                    needsPhoneVerification
                                                                        ? 'border-yellow-200 bg-yellow-100 text-yellow-800'
                                                                        : 'border-green-200 bg-green-100 text-green-700'
                                                                }`}
                                                            >
                                                                {needsPhoneVerification ? (
                                                                    <>
                                                                        <AlertTriangle className="h-3 w-3" />
                                                                        <span>Potrebna verifikacija</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ShieldCheck className="h-3 w-3" />
                                                                        <span>Verifikovano</span>
                                                                    </>
                                                                )}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {needsPhoneVerification && (
                                                <div
                                                    className="mt-3 cursor-pointer rounded-lg border border-yellow-200 bg-yellow-50 p-2.5 transition-colors hover:bg-yellow-100"
                                                    onClick={goToPhoneVerification}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-yellow-600" />
                                                        <span className="text-xs font-medium text-yellow-700">
                                                            Verifikuj broj telefona
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <DropdownMenuItem
                                            onClick={() => router.push('/profile')}
                                            className="cursor-pointer"
                                        >
                                            <User className="mr-2 h-4 w-4" />
                                            Moj profil
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
                            ) : (
                                <div className="hidden items-center gap-3 sm:flex">
                                    <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                                        Prijavi se
                                    </Button>
                                    <Button onClick={() => router.push('/auth/register')}>
                                        Kreiraj nalog
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {needsPhoneVerification && (
                <Alert
                    className="mx-auto mt-4 max-w-7xl cursor-pointer border-yellow-400 bg-yellow-50"
                    onClick={goToPhoneVerification}
                >
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="flex items-center justify-between text-yellow-800">
                        <span>
                            Molimo vas verifikujte broj telefona kako biste otključali sve funkcionalnosti.
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            className="ml-4 border-yellow-400 text-yellow-700"
                            onClick={(event) => {
                                event.stopPropagation();
                                goToPhoneVerification();
                            }}
                        >
                            Verifikuj sada
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
        </>
    );
};
