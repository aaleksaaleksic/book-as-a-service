'use client';

import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { EditBookForm } from '@/components/admin/EditBookForm';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useBook } from '@/hooks/use-books';
import Link from 'next/link';

export default function EditBookPage() {
    const params = useParams();
    const router = useRouter();
    const bookId = Number(params.id);

    const { data: book, isLoading, error } = useBook(bookId);

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <div className="h-10 w-1/3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    <div className="space-y-4">
                        <div className="h-64 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-64 w-full bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (error || !book) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <p className="text-sm text-red-800">
                                Greška pri učitavanju knjige. Knjiga možda ne postoji.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/admin/books"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Nazad na listu
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Izmeni knjigu</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Izmena: {book.title}
                        </p>
                    </div>
                    <Link
                        href="/admin/books"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Nazad na listu
                    </Link>
                </div>

                {/* Edit Book Form */}
                <EditBookForm book={book} />
            </div>
        </AdminLayout>
    );
}