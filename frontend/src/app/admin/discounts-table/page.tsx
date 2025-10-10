'use client';

import { useState } from 'react';
import { Receipt, Loader2, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAllDiscounts } from '@/hooks/use-discounts';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AdminDiscountsTablePage() {
    const { data, isLoading, error } = useAllDiscounts();
    const [filter, setFilter] = useState<'all' | 'valid' | 'used' | 'expired'>('all');

    const discounts = data?.discounts || [];

    // Apply filters
    const filteredDiscounts = discounts.filter((discount) => {
        if (filter === 'valid') return discount.isValid;
        if (filter === 'used') return discount.isUsed;
        if (filter === 'expired') return discount.isExpired && !discount.isUsed;
        return true; // 'all'
    });

    const getStatusBadge = (discount: any) => {
        if (discount.isUsed) {
            return (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Iskorišćen
                </Badge>
            );
        }
        if (discount.isExpired) {
            return (
                <Badge className="bg-red-100 text-red-800 border-red-300">
                    <XCircle className="w-3 h-3 mr-1" />
                    Istekao
                </Badge>
            );
        }
        return (
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                <Clock className="w-3 h-3 mr-1" />
                Aktivan
            </Badge>
        );
    };

    const getTypeBadge = (type: string) => {
        if (type === 'PUBLIC') {
            return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Javni</Badge>;
        }
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Admin</Badge>;
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-library-gold to-amber-500 shadow-lg">
                            <Receipt className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-sky-950">Svi kodovi za popust</h1>
                    </div>
                    <p className="text-sky-900/70">Pregled svih generisanih kodova za popust</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-6">
                    <Filter className="w-5 h-5 text-sky-700" />
                    <span className="text-sm font-semibold text-sky-950 mr-2">Filter:</span>
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            filter === 'all'
                                ? 'bg-library-gold text-sky-950'
                                : 'bg-white text-sky-700 border border-sky-200 hover:bg-sky-50'
                        )}
                    >
                        Svi ({discounts.length})
                    </button>
                    <button
                        onClick={() => setFilter('valid')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            filter === 'valid'
                                ? 'bg-library-gold text-sky-950'
                                : 'bg-white text-sky-700 border border-sky-200 hover:bg-sky-50'
                        )}
                    >
                        Aktivni ({discounts.filter((d) => d.isValid).length})
                    </button>
                    <button
                        onClick={() => setFilter('used')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            filter === 'used'
                                ? 'bg-library-gold text-sky-950'
                                : 'bg-white text-sky-700 border border-sky-200 hover:bg-sky-50'
                        )}
                    >
                        Iskorišćeni ({discounts.filter((d) => d.isUsed).length})
                    </button>
                    <button
                        onClick={() => setFilter('expired')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            filter === 'expired'
                                ? 'bg-library-gold text-sky-950'
                                : 'bg-white text-sky-700 border border-sky-200 hover:bg-sky-50'
                        )}
                    >
                        Istekli ({discounts.filter((d) => d.isExpired && !d.isUsed).length})
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-sky-200 shadow-lg overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-library-gold" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-20 text-red-600">
                            Greška pri učitavanju kodova za popust
                        </div>
                    ) : filteredDiscounts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-sky-700">
                            <Receipt className="w-12 h-12 mb-4 text-sky-300" />
                            <p className="text-lg font-medium">Nema pronađenih kodova</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-sky-50 border-b border-sky-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                            Kod
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                            Popust
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                            Tip
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                            Kreirao
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                            Kreiran
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                            Ističe
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                            Iskorišćen
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-sky-100">
                                    {filteredDiscounts.map((discount) => (
                                        <tr
                                            key={discount.id}
                                            className="hover:bg-sky-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono font-bold text-sky-950">
                                                    {discount.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-sky-700">{discount.email}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-green-700">
                                                    {discount.discountPercentage}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getTypeBadge(discount.type)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(discount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-sky-700">
                                                    {discount.createdBy}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-sky-700">
                                                    {discount.createdAt}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-sky-700">
                                                    {discount.expiresAt}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-sky-700">
                                                    {discount.usedAt || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Summary */}
                {!isLoading && !error && filteredDiscounts.length > 0 && (
                    <div className="mt-6 flex items-center justify-between text-sm text-sky-700">
                        <span>Prikazano {filteredDiscounts.length} od {discounts.length} kodova</span>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
