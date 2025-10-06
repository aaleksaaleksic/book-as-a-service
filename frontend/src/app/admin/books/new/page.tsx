'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { CreateBookForm } from '@/components/admin/CreateBookForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewBookPage() {
    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dodaj novu knjigu</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Unesite informacije o knjizi i uploadujte fajlove
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

                {/* Create Book Form */}
                <CreateBookForm />
            </div>
        </AdminLayout>
    );
}