"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useBooks } from '@/hooks/use-books';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function DashboardPage() {
    const { data: books, isLoading } = useBooks();

    return (
        <div className="min-h-screen bg-reading-background text-reading-text">
            <div className="mx-auto max-w-5xl px-6 py-10">
                <header className="mb-10 border-b border-white/10 pb-6">
                    <p className="text-xs uppercase tracking-[0.35em] text-reading-text/50">Dobrodošli nazad</p>
                    <h1 className="mt-2 text-3xl font-semibold text-white">Vaša digitalna biblioteka</h1>
                    <p className="mt-2 max-w-2xl text-sm text-reading-text/70">
                        Nastavite čitanje tamo gde ste stali ili otkrijte nove naslove iz naše premium kolekcije. Klikom na
                        "Čitaj" otvara se sigurni čitač koji štiti vaše PDF dokumente.
                    </p>
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <LoadingSpinner size="lg" variant="book" text="Učitavanje knjiga" />
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {(books ?? []).slice(0, 6).map(book => (
                            <Card key={book.id} className="border-white/10 bg-white/5 backdrop-blur">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                                        <BookOpen className="h-5 w-5 text-reading-accent" />
                                        {book.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-reading-text/80">
                                    <p className="font-medium text-white/70">Autor: {book.author}</p>
                                    <p className="line-clamp-3 text-sm text-reading-text/70">{book.description}</p>
                                    <div className="flex items-center justify-between text-xs text-reading-text/60">
                                        <span>{book.pages} strana</span>
                                        <span>{book.isPremium ? 'Premium' : 'Besplatna'}</span>
                                    </div>
                                    <Button asChild className="w-full">
                                        <Link href={`/reader/${book.id}`}>Čitaj</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
