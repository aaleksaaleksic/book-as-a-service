'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BookOpen,
    Users,
    BarChart3,
    Upload,
    DollarSign,
    Shield,
    LogOut,
    Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { dt } from '@/lib/design-tokens';
import { useState } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
}

interface NavItem {
    title: string;
    href: string;
    icon: ReactNode;
    permission?: string;
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: <BarChart3 className="w-5 h-5" />,
    },
    {
        title: 'Knjige',
        href: '/admin/books',
        icon: <BookOpen className="w-5 h-5" />,
        permission: 'CAN_READ_BOOKS',
    },
    {
        title: 'Dodaj knjigu',
        href: '/admin/books/new',
        icon: <Upload className="w-5 h-5" />,
        permission: 'CAN_CREATE_BOOKS',
    },
    {
        title: 'Korisnici',
        href: '/admin/users',
        icon: <Users className="w-5 h-5" />,
        permission: 'CAN_READ_USERS',
    },
    {
        title: 'Plaćanja',
        href: '/admin/payments',
        icon: <DollarSign className="w-5 h-5" />,
        permission: 'CAN_MANAGE_PAYMENTS',
    },
    {
        title: 'Analitika',
        href: '/admin/analytics',
        icon: <BarChart3 className="w-5 h-5" />,
        permission: 'CAN_VIEW_ANALYTICS',
    },
];

export function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const { user, logout, hasPermission } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const filteredNavItems = navItems.filter(item =>
        !item.permission || hasPermission(item.permission as any)
    );

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            {/* Admin Header */}
            <div className="px-5 pb-6 pt-8">
                <div className="flex items-center gap-3 rounded-2xl bg-reading-accent/10 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-reading-accent text-white shadow">
                        <Shield className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-reading-text">Admin panel</h2>
                        <p className="text-sm text-reading-text/70">
                            {user?.firstName} {user?.lastName}
                        </p>
                    </div>
                </div>
            </div>

            <Separator className="border-reading-accent/10" />

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-6">
                <nav className="space-y-2">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all", 
                                    "hover:bg-reading-accent/10 hover:text-reading-text",
                                    isActive
                                        ? "bg-reading-accent text-white shadow"
                                        : "text-reading-text/80"
                                )}
                            >
                                <span className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-lg border border-transparent",
                                    isActive
                                        ? "bg-white/20"
                                        : "bg-reading-accent/5 text-reading-text/70 group-hover:border-reading-accent/30"
                                )}>
                                    {item.icon}
                                </span>
                                <span className="font-semibold tracking-wide">{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            <Separator className="border-reading-accent/10" />

            {/* Logout Button */}
            <div className="px-5 pb-8 pt-6">
                <Button
                    onClick={logout}
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-xl bg-reading-accent/5 px-4 py-3 text-reading-text transition-colors hover:bg-reading-accent/15"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold">Odjavi se</span>
                </Button>
            </div>
        </div>
    );

    return (
        <AuthGuard
            requireAuth={true}
            roles={['ADMIN', 'MODERATOR']}
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner size="lg" />
                </div>
            }
        >
            <div className="flex min-h-screen bg-reading-surface text-reading-text">
                {/* Desktop Sidebar */}
                <aside className="hidden w-72 flex-col border-r border-reading-accent/10 bg-white/90 shadow-xl backdrop-blur lg:flex">
                    <SidebarContent />
                </aside>

                {/* Mobile Sidebar */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetContent side="left" className="w-72 border-none bg-white/95 p-0 shadow-xl">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Top Bar */}
                    <header className="h-20 border-b border-reading-accent/10 bg-white/80 px-4 shadow-sm backdrop-blur lg:px-8">
                        <div className="flex h-full items-center justify-between">
                            {/* Mobile Menu Button */}
                            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="lg:hidden"
                                    >
                                        <Menu className="w-5 h-5" />
                                    </Button>
                                </SheetTrigger>
                            </Sheet>

                            {/* Page Title */}
                            <div className="hidden flex-col gap-1 lg:flex">
                                <span className="text-xs uppercase tracking-[0.2em] text-reading-text/60">Readify admin</span>
                                <h1 className={cn(dt.typography.sectionTitle)}>
                                    {navItems.find(item => pathname.startsWith(item.href))?.title || 'Dashboard'}
                                </h1>
                            </div>

                            {/* User Info */}
                            <div className="flex items-center gap-4">
                                <div className="hidden flex-col text-right text-sm text-reading-text/70 sm:flex">
                                    <span className="font-semibold text-reading-text">{user?.firstName} {user?.lastName}</span>
                                    <span className="text-xs uppercase tracking-widest text-reading-text/60">{user?.role}</span>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-reading-accent/15 text-lg font-semibold text-reading-accent shadow-inner">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto px-4 pb-10 pt-6 lg:px-8 lg:pt-8">
                        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
                            <div className="w-full rounded-3xl border border-reading-accent/10 bg-white/85 p-6 shadow-sm backdrop-blur">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}