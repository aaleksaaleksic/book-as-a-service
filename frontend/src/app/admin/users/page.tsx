'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Users,
    Search,
    X,
    MoreVertical,
    Eye,
    UserX,
    Crown,
    CheckCircle2,
    PhoneCall,
    ChevronLeft,
    ChevronRight,
    UserCheck,
    Trash,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminUsers, useAdminSubscriptions, useCancelSubscription, useDeactivateUser, useActivateUser, useDeleteUser } from '@/hooks/use-admin';
import { useCan } from '@/hooks/useAuth';
import { format } from 'date-fns';
import type { AdminUser, AdminSubscription } from '@/types/admin';
import { useMemo } from 'react';

const formatDate = (value?: string) => {
    if (!value) return '-';
    try {
        return format(new Date(value), 'dd.MM.yyyy.');
    } catch (error) {
        return value;
    }
};

const formatNumber = (value: number) => new Intl.NumberFormat('sr-RS').format(value);

export default function AdminUsersPage() {
    const { can } = useCan();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;

    const { data: usersData, isLoading: usersLoading, error: usersError } = useAdminUsers(
        currentPage,
        pageSize,
        'lastName',
        'asc'
    );
    const { data: subscriptionsData } = useAdminSubscriptions();
    const cancelSubscription = useCancelSubscription();
    const deactivateUser = useDeactivateUser();
    const activateUser = useActivateUser();
    const deleteUser = useDeleteUser();

    const subscriptionMap = useMemo(() => {
        const map = new Map<number, AdminSubscription>();
        subscriptionsData?.subscriptions.forEach((subscription) => {
            if (subscription?.userId == null) return;

            const existing = map.get(subscription.userId);

            if (!existing) {
                map.set(subscription.userId, subscription);
                return;
            }

            const existingTimestamp = existing.createdAt ? new Date(existing.createdAt).getTime() : 0;
            const currentTimestamp = subscription.createdAt ? new Date(subscription.createdAt).getTime() : 0;

            if (currentTimestamp >= existingTimestamp) {
                map.set(subscription.userId, subscription);
            }
        });
        return map;
    }, [subscriptionsData?.subscriptions]);

    const users = usersData?.users || [];
    const totalPages = usersData?.totalPages || 0;
    const totalItems = usersData?.totalItems || 0;

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && user.hasActiveSubscription) ||
            (statusFilter === 'inactive' && !user.hasActiveSubscription);

        return matchesSearch && matchesStatus;
    });

    const handleCancelSubscription = async (subscriptionId: number) => {
        if (confirm('Da li ste sigurni da želite otkazati pretplatu ovog korisnika?')) {
            await cancelSubscription.mutateAsync(subscriptionId);
        }
    };

    const handleDeactivateUser = async (userId: number) => {
        if (confirm('Da li ste sigurni da želite deaktivirati ovog korisnika?')) {
            await deactivateUser.mutateAsync(userId);
        }
    };

    const handleActivateUser = async (userId: number) => {
        if (confirm('Da li ste sigurni da želite aktivirati ovog korisnika?')) {
            await activateUser.mutateAsync(userId);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (confirm('Da li ste sigurni da želite TRAJNO OBRISATI ovog korisnika? Ova akcija se ne može poništiti!')) {
            await deleteUser.mutateAsync(userId);
        }
    };

    const getSubscriptionBadge = (user: AdminUser) => {
        const subscription = subscriptionMap.get(user.id);

        // First check if user has active subscription from user object
        if (user.hasActiveSubscription) {
            // If we have subscription details, show more specific info
            if (subscription) {
                if (subscription.status === 'TRIAL' || subscription.isTrial) {
                    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Probna</span>;
                }
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktivna</span>;
            }
            // Fallback to generic "Aktivna" if we don't have subscription details
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktivna</span>;
        }

        // User doesn't have active subscription
        if (!subscription) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Bez pretplate</span>;
        }

        // Show specific inactive states if subscription exists
        if (subscription.status === 'CANCELED' || subscription.isCanceled) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Otkazana</span>;
        }

        if (subscription.status === 'EXPIRED' || subscription.isExpired) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Istekla</span>;
        }

        // Fallback
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{subscription.statusDescription || subscription.status || 'Bez pretplate'}</span>;
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Upravljanje korisnicima</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Ukupno {formatNumber(totalItems)} korisnika
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Pretraži po imenu ili email adresi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none placeholder:text-gray-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 text-sm text-sky-950 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none"
                        >
                            <option value="all">Svi korisnici</option>
                            <option value="active">Sa aktivnom pretplatom</option>
                            <option value="inactive">Bez pretplate</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    {usersLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : usersError ? (
                        <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-6">
                            <p className="text-sm text-red-800">
                                Greška pri učitavanju korisnika. Pokušajte ponovo.
                            </p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-600 mb-4">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Nema korisnika koji odgovaraju filterima'
                                    : 'Nema registrovanih korisnika'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Ime</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Telefon</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Pretplata</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Član od</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Poslednja aktivnost</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Akcije</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredUsers.map((user, index) => {
                                            const subscription = subscriptionMap.get(user.id);
                                            const isLastRow = index === filteredUsers.length - 1;

                                            return (
                                                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                    {/* Name */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {user.fullName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email}
                                                                </p>
                                                                {user.isAdmin && (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                        <Crown className="w-3 h-3" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 uppercase tracking-wider">{user.role}</p>
                                                        </div>
                                                    </td>

                                                    {/* Email */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm text-gray-700">{user.email}</p>
                                                            {user.emailVerified && (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" title="Email verifikovan" />
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Phone */}
                                                    <td className="px-4 py-3">
                                                        {user.phoneNumber ? (
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm text-gray-700">{user.phoneNumber}</p>
                                                                {user.phoneVerified && (
                                                                    <PhoneCall className="w-4 h-4 text-sky-600" title="Telefon verifikovan" />
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-3">
                                                        {user.active !== false ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Aktivan
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Neaktivan
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Subscription */}
                                                    <td className="px-4 py-3">
                                                        {getSubscriptionBadge(user)}
                                                    </td>

                                                    {/* Created At */}
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm text-gray-700">{formatDate(user.createdAt)}</p>
                                                    </td>

                                                    {/* Last Login */}
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm text-gray-700">{formatDate(user.lastLoginAt)}</p>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-3 text-right relative">
                                                        <div className="relative inline-block text-left">
                                                            <button
                                                                onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                                                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>

                                                            {openDropdownId === user.id && (
                                                                <>
                                                                    <div
                                                                        className="fixed inset-0 z-10"
                                                                        onClick={() => setOpenDropdownId(null)}
                                                                    />
                                                                    <div className={`absolute right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto ${isLastRow ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                                                                        <div className="py-1">
                                                                            <div className="px-4 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                                                Akcije
                                                                            </div>

                                                                            <Link
                                                                                href={`/admin/users/${user.id}`}
                                                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                                                onClick={() => setOpenDropdownId(null)}
                                                                            >
                                                                                <Eye className="w-4 h-4 mr-2" />
                                                                                Pregledaj
                                                                            </Link>

                                                                            {can('CAN_DELETE_USERS') && (
                                                                                <>
                                                                                    <div className="border-t border-gray-200 my-1" />
                                                                                    {user.active !== false ? (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setOpenDropdownId(null);
                                                                                                handleDeactivateUser(user.id);
                                                                                            }}
                                                                                            className="w-full flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors duration-150"
                                                                                        >
                                                                                            <UserX className="w-4 h-4 mr-2" />
                                                                                            Deaktiviraj korisnika
                                                                                        </button>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setOpenDropdownId(null);
                                                                                                handleActivateUser(user.id);
                                                                                            }}
                                                                                            className="w-full flex items-center px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors duration-150"
                                                                                        >
                                                                                            <UserCheck className="w-4 h-4 mr-2" />
                                                                                            Aktiviraj korisnika
                                                                                        </button>
                                                                                    )}
                                                                                </>
                                                                            )}

                                                                            {subscription && can('CAN_CANCEL_SUBSCRIPTION') && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setOpenDropdownId(null);
                                                                                        handleCancelSubscription(subscription.id);
                                                                                    }}
                                                                                    className="w-full flex items-center px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors duration-150"
                                                                                >
                                                                                    <UserX className="w-4 h-4 mr-2" />
                                                                                    Otkazi pretplatu
                                                                                </button>
                                                                            )}

                                                                            {can('CAN_DELETE_USERS') && (
                                                                                <>
                                                                                    <div className="border-t border-gray-200 my-1" />
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setOpenDropdownId(null);
                                                                                            handleDeleteUser(user.id);
                                                                                        }}
                                                                                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                                                                                    >
                                                                                        <Trash className="w-4 h-4 mr-2" />
                                                                                        Obriši korisnika
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                            disabled={currentPage === 0}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Prethodna
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                            disabled={currentPage >= totalPages - 1}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Sledeća
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Prikazano <span className="font-medium">{currentPage * pageSize + 1}</span> do{' '}
                                                <span className="font-medium">{Math.min((currentPage + 1) * pageSize, totalItems)}</span> od{' '}
                                                <span className="font-medium">{totalItems}</span> rezultata
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button
                                                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                                    disabled={currentPage === 0}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="sr-only">Prethodna</span>
                                                    <ChevronLeft className="h-5 w-5" />
                                                </button>
                                                {[...Array(totalPages)].map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentPage(idx)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            idx === currentPage
                                                                ? 'z-10 bg-sky-950 border-sky-950 text-white'
                                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {idx + 1}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                                    disabled={currentPage >= totalPages - 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="sr-only">Sledeća</span>
                                                    <ChevronRight className="h-5 w-5" />
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
