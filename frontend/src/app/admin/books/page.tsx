'use client';

import { SyntheticEvent, useState } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    Edit,
    Trash,
    Eye,
    MoreVertical,
    BookOpen,
    X,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useBooks, useDeleteBook } from '@/hooks/use-books';
import { useCan } from '@/hooks/useAuth';
import { BookResponseDTO } from '@/api/types/books.types';
import { resolveApiFileUrl } from '@/lib/asset-utils';

const FALLBACK_COVER_IMAGE = '/book-placeholder.svg';

export default function AdminBooksPage() {
    const { can } = useCan();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'premium'>('all');
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const { data: books, isLoading, error } = useBooks(
        typeFilter === 'all' ? undefined : typeFilter
    );
    const deleteBookMutation = useDeleteBook();

    const filteredBooks = books?.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.isbn?.includes(searchQuery);

        const matchesCategory = categoryFilter === 'all' || book.category?.name === categoryFilter;

        return matchesSearch && matchesCategory;
    }) || [];

    const categories = Array.from(new Set(books?.map(b => b.category?.name).filter(Boolean) || []));

    const handleDelete = async (id: number) => {
        if (confirm('Da li ste sigurni da želite obrisati ovu knjigu?')) {
            await deleteBookMutation.mutateAsync(id);
        }
    };

    const resolveCoverUrl = (book: BookResponseDTO) => resolveApiFileUrl(book.coverImageUrl);

    const formatNumber = (value: number) => new Intl.NumberFormat('sr-RS').format(value);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Upravljanje knjigama</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Ukupno {formatNumber(filteredBooks.length)} knjiga
                        </p>
                    </div>

                    {can('CAN_CREATE_BOOKS') && (
                        <Link
                            href="/admin/books/new"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-sky-950 rounded-lg hover:bg-sky-900 transition-colors duration-200"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Dodaj novu knjigu
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Pretraži po naslovu, autoru ili ISBN..."
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

                        {/* Category filter */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 text-sm text-sky-950 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none"
                        >
                            <option value="all">Sve kategorije</option>
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>

                        {/* Type filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="px-4 py-2 text-sm text-sky-950 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none"
                        >
                            <option value="all">Sve knjige</option>
                            <option value="free">Besplatne</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                </div>

                {/* Books Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-6">
                            <p className="text-sm text-red-800">
                                Greška pri učitavanju knjiga. Pokušajte ponovo.
                            </p>
                        </div>
                    ) : filteredBooks.length === 0 ? (
                        <div className="p-12 text-center">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-600 mb-4">
                                {searchQuery || categoryFilter !== 'all' || typeFilter !== 'all'
                                    ? 'Nema knjiga koje odgovaraju filterima'
                                    : 'Nema dodatih knjiga'}
                            </p>
                            {can('CAN_CREATE_BOOKS') && !searchQuery && categoryFilter === 'all' && (
                                <Link
                                    href="/admin/books/new"
                                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-sky-950 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Dodaj prvu knjigu
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Naslovna</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Naslov</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Autor</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ISBN</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Kategorija</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Izdavač</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Stranice</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Godina</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Jezik</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tip</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Čitanja</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Akcije</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredBooks.map((book) => {
                                        const coverUrl = resolveCoverUrl(book);

                                        return (
                                            <tr key={book.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                {/* Cover */}
                                                <td className="px-4 py-3">
                                                    {coverUrl ? (
                                                        <img
                                                            src={coverUrl}
                                                            alt={book.title}
                                                            className="w-12 h-16 object-cover rounded shadow-sm"
                                                            onError={(event: SyntheticEvent<HTMLImageElement>) => {
                                                                event.currentTarget.onerror = null;
                                                                event.currentTarget.src = FALLBACK_COVER_IMAGE;
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center">
                                                            <BookOpen className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Title */}
                                                <td className="px-4 py-3">
                                                    <div className="max-w-xs">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                                                    </div>
                                                </td>

                                                {/* Author */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">{book.author}</p>
                                                </td>

                                                {/* ISBN */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-600 font-mono">{book.isbn || '-'}</p>
                                                </td>

                                                {/* Category */}
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {book.category?.name || 'N/A'}
                                                    </span>
                                                </td>

                                                {/* Publisher */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">{book.publisher?.name || '-'}</p>
                                                </td>

                                                {/* Pages */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">{book.pages}</p>
                                                </td>

                                                {/* Publication Year */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">{book.publicationYear || '-'}</p>
                                                </td>

                                                {/* Language */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700 uppercase">{book.language}</p>
                                                </td>

                                                {/* Type */}
                                                <td className="px-4 py-3">
                                                    {book.isPremium ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            Premium
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Besplatna
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3">
                                                    {book.isAvailable ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Dostupna
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            Nedostupna
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Read Count */}
                                                <td className="px-4 py-3 text-center">
                                                    <p className="text-sm font-medium text-gray-900">{formatNumber(book.readCount || 0)}</p>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3 text-right relative">
                                                    <div className="relative inline-block text-left">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === book.id ? null : book.id)}
                                                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {openDropdownId === book.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() => setOpenDropdownId(null)}
                                                                />
                                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                                                    <div className="py-1">
                                                                        <div className="px-4 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                                            Akcije
                                                                        </div>

                                                                        <Link
                                                                            href={`/admin/books/${book.id}`}
                                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                                            onClick={() => setOpenDropdownId(null)}
                                                                        >
                                                                            <Eye className="w-4 h-4 mr-2" />
                                                                            Pregledaj
                                                                        </Link>

                                                                        {can('CAN_UPDATE_BOOKS') && (
                                                                            <Link
                                                                                href={`/admin/books/${book.id}/edit`}
                                                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                                                onClick={() => setOpenDropdownId(null)}
                                                                            >
                                                                                <Edit className="w-4 h-4 mr-2" />
                                                                                Izmeni
                                                                            </Link>
                                                                        )}

                                                                        {can('CAN_DELETE_BOOKS') && (
                                                                            <>
                                                                                <div className="border-t border-gray-200 my-1" />
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setOpenDropdownId(null);
                                                                                        handleDelete(book.id);
                                                                                    }}
                                                                                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                                                                                >
                                                                                    <Trash className="w-4 h-4 mr-2" />
                                                                                    Obriši
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
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
