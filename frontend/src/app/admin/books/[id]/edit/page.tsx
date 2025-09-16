'use client';

import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { EditBookForm } from '@/components/admin/EditBookForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useBook } from '@/hooks/use-books';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
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
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="space-y-4">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (error || !book) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Greška pri učitavanju knjige. Knjiga možda ne postoji.
                        </AlertDescription>
                    </Alert>
                    <Button asChild variant="outline">
                        <Link href="/admin/books">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Nazad na listu
                        </Link>
                    </Button>
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
                        <h1 className={cn(dt.typography.pageTitle)}>Izmeni knjigu</h1>
                        <p className={cn(dt.typography.muted, "mt-1")}>
                            Izmena: {book.title}
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/admin/books">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Nazad na listu
                        </Link>
                    </Button>
                </div>

                {/* Edit Book Form */}
                <EditBookForm book={book} />
            </div>
        </AdminLayout>
    );
}