'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BookOpen,
    Users,
    BarChart3,
    Settings,
    Upload,
    Library,
    DollarSign,
    Shield,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
    {
        title: 'Podešavanja',
        href: '/admin/settings',
        icon: <Settings className="w-5 h-5" />,
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
        <>
            {/* Admin Header */}
            <div className="px-4 py-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-reading-accent/10 rounded-lg">
                        <Shield className="w-6 h-6 text-reading-accent" />
                    </div>
                    <div>
                        <h2 className={cn(dt.typography.cardTitle)}>Admin Panel</h2>
                        <p className={cn(dt.typography.muted)}>
                            {user?.firstName} {user?.lastName}
                        </p>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Navigation */}
            <ScrollArea className="flex-1 px-2 py-4">
                <nav className="space-y-1">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-reading-accent text-white"
                                        : "text-reading-text hover:bg-book-green-100"
                                )}
                            >
                                {item.icon}
                                <span className="font-medium">{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            <Separator />

            {/* Logout Button */}
            <div className="p-4">
                <Button
                    onClick={logout}
                    variant="ghost"
                    className="w-full justify-start gap-3 text-reading-text hover:bg-book-green-100"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Odjavi se</span>
                </Button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-reading-background">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col w-64 bg-reading-surface border-r border-reading-accent/10">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-64 p-0 bg-reading-surface">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 bg-reading-surface border-b border-reading-accent/10 px-4 lg:px-6">
                    <div className="h-full flex items-center justify-between">
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
                        <h1 className={cn(dt.typography.sectionTitle, "hidden lg:block")}>
                            {navItems.find(item => pathname.startsWith(item.href))?.title || 'Dashboard'}
                        </h1>

                        {/* User Info */}
                        <div className="flex items-center gap-4">
                            <span className={cn(dt.typography.muted)}>
                                {user?.role}
                            </span>
                            <div className="w-10 h-10 bg-reading-accent/10 rounded-full flex items-center justify-center">
                                <span className="text-reading-accent font-semibold">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    <div className={cn(dt.layouts.pageContainer)}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}