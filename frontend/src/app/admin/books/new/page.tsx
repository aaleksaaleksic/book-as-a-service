'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { CreateBookForm } from '@/components/admin/CreateBookForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NewBookPage() {
    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={cn(dt.typography.pageTitle)}>Dodaj novu knjigu</h1>
                        <p className={cn(dt.typography.muted, "mt-1")}>
                            Unesite informacije o knjizi i uploadujte fajlove
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/admin/books">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Nazad na listu
                        </Link>
                    </Button>
                </div>

                {/* Create Book Form */}
                <CreateBookForm />
            </div>
        </AdminLayout>
    );
}