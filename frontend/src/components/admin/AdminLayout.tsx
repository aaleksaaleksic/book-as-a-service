'use client';

import { ReactNode, useState } from 'react';
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
    Menu,
    Tag,
    Building2,
    X,
    Mail
} from 'lucide-react';
import { PageLoader } from '@/components/ui/loading-spinner';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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
        title: 'Kategorije',
        href: '/admin/categories',
        icon: <Tag className="w-5 h-5" />,
        permission: 'CAN_CREATE_BOOKS',
    },
    {
        title: 'Izdavači',
        href: '/admin/publishers',
        icon: <Building2 className="w-5 h-5" />,
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

    const SidebarContent = ({ showCloseButton = false }: { showCloseButton?: boolean }) => (
        <div className="flex h-full flex-col bg-white">
            {/* Mobile Close Button */}
            {showCloseButton && (
                <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors duration-200"
                >
                    <X className="w-5 h-5" />
                    <span className="sr-only">Close menu</span>
                </button>
            )}

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 py-6">
                <nav className="space-y-1.5">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-sky-950 text-white shadow-md"
                                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                )}
                            >
                                <span className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-200",
                                    isActive
                                        ? "bg-sky-900 text-white"
                                        : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
                                )}>
                                    {item.icon}
                                </span>
                                <span className="flex-1">{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-200 mx-4" />

            {/* Logout Button */}
            <div className="px-5 pb-6 pt-5">
                <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center justify-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-red-700 font-medium text-sm transition-colors duration-200 hover:bg-red-100 hover:text-red-800"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Odjavi se</span>
                </button>
            </div>
        </div>
    );

    return (
        <AuthGuard
            requireAuth={true}
            roles={['ADMIN', 'MODERATOR']}
            fallback={
                <PageLoader text="Učitavamo administratorski panel..." />
            }
        >
            <div className="flex min-h-screen bg-gray-50">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex fixed top-0 left-0 z-40 w-64 h-screen border-r border-gray-200 shadow-lg">
                    <SidebarContent showCloseButton={false} />
                </aside>

                {/* Mobile Sidebar Overlay */}
                {mobileOpen && (
                    <div
                        className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden transition-opacity duration-300"
                        onClick={() => setMobileOpen(false)}
                    />
                )}

                {/* Mobile Sidebar */}
                <aside
                    className={cn(
                        "fixed top-0 left-0 z-50 w-64 h-screen transition-transform duration-300 transform lg:hidden",
                        mobileOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <SidebarContent showCloseButton={true} />
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col lg:ml-64">
                    {/* Top Bar */}
                    <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white shadow-sm">
                        <div className="flex h-full items-center justify-between px-4 lg:px-8">
                            {/* Mobile Menu Button */}
                            <button
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 lg:hidden"
                            >
                                <Menu className="w-5 h-5" />
                                <span className="sr-only">Open menu</span>
                            </button>

                            {/* Spacer for mobile */}
                            <div className="flex-1 lg:hidden" />

                            {/* Right Side - Mail Sender & User Info */}
                            <div className="flex items-center gap-3">
                                {/* Mail Sender */}
                                <Link
                                    href="/admin/mail-sender"
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                >
                                    <Mail className="w-4 h-4" />
                                    <span className="hidden sm:inline">Mail Sender</span>
                                </Link>

                                {/* Divider */}
                                <div className="hidden sm:block h-8 w-px bg-gray-300" />

                                {/* User Info */}
                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex flex-col text-right">
                                        <span className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</span>
                                        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{user?.role}</span>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-950 text-sm font-semibold text-white shadow-md">
                                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto p-4 lg:p-8">
                        <div className="mx-auto w-full max-w-full">
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}