
'use client';

import { SyntheticEvent, useState } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash,
    Eye,
    MoreVertical,
    BookOpen,
    Download,
    DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useBooks, useDeleteBook } from '@/hooks/use-books';
import { useCan } from '@/hooks/useAuth';
import { BookResponseDTO } from '@/api/types/books.types';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

const FALLBACK_COVER_IMAGE = '/book-placeholder.svg';

export default function AdminBooksPage() {
    const { can } = useCan();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'premium'>('all');

    // Fetch books sa filterima
    const { data: books, isLoading, error } = useBooks(
        typeFilter === 'all' ? undefined : typeFilter
    );
    const deleteBookMutation = useDeleteBook();

    // Filtriranje knjiga lokalno
    const filteredBooks = books?.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.isbn?.includes(searchQuery);

        const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;

        return matchesSearch && matchesCategory;
    }) || [];

    // Unique kategorije za filter
    const categories = Array.from(new Set(books?.map(b => b.category) || []));

    const handleDelete = async (id: number) => {
        if (confirm('Da li ste sigurni da želite obrisati ovu knjigu?')) {
            await deleteBookMutation.mutateAsync(id);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('sr-RS', {
            style: 'currency',
            currency: 'RSD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const resolveCoverUrl = (book: BookResponseDTO) => {
        const rawCoverUrl = book.coverImageUrl?.trim();

        if (!rawCoverUrl) {
            return null;
        }

        if (/^https?:\/\//i.test(rawCoverUrl)) {
            return rawCoverUrl;
        }

        const normalizedPath = rawCoverUrl.startsWith('/') ? rawCoverUrl : `/${rawCoverUrl}`;
        const candidateBases: string[] = [];

        if (process.env.NEXT_PUBLIC_API_URL) {
            candidateBases.push(process.env.NEXT_PUBLIC_API_URL);
        }

        if (typeof window !== 'undefined') {
            candidateBases.push(window.location.origin);
        }

        candidateBases.push('http://localhost:8080');

        for (const base of candidateBases) {
            try {
                const formattedBase = base.endsWith('/') ? base : `${base}/`;
                return new URL(normalizedPath, formattedBase).toString();
            } catch (error) {
                console.warn('Failed to resolve cover URL with base', base, error);
            }
        }

        return normalizedPath;
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className={cn(dt.typography.pageTitle)}>Upravljanje knjigama</h1>
                        <p className={cn(dt.typography.muted, "mt-1")}>
                            Ukupno {filteredBooks.length} knjiga
                        </p>
                    </div>

                    {can('CAN_CREATE_BOOKS') && (
                        <Button asChild className={cn(dt.interactive.buttonPrimary)}>
                            <Link href="/admin/books/new">
                                <Plus className="w-4 h-4 mr-2" />
                                Dodaj novu knjigu
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Pretraži po naslovu, autoru ili ISBN..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Category filter */}
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Kategorija" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Sve kategorije</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Type filter */}
                            <Select value={typeFilter} onValueChange={setTypeFilter as any}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Sve knjige</SelectItem>
                                    <SelectItem value="free">Besplatne</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Books Table */}
                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-6 space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : error ? (
                            <Alert variant="destructive" className="m-6">
                                <AlertDescription>
                                    Greška pri učitavanju knjiga. Pokušajte ponovo.
                                </AlertDescription>
                            </Alert>
                        ) : filteredBooks.length === 0 ? (
                            <div className="p-12 text-center">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 text-reading-accent/40" />
                                <p className={cn(dt.typography.muted)}>
                                    {searchQuery || categoryFilter !== 'all' || typeFilter !== 'all'
                                        ? 'Nema knjiga koje odgovaraju filterima'
                                        : 'Nema dodatih knjiga'}
                                </p>
                                {can('CAN_CREATE_BOOKS') && !searchQuery && categoryFilter === 'all' && (
                                    <Button asChild className="mt-4" variant="outline">
                                        <Link href="/admin/books/new">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Dodaj prvu knjigu
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cover</TableHead>
                                            <TableHead>Naslov</TableHead>
                                            <TableHead>Autor</TableHead>
                                            <TableHead>Kategorija</TableHead>
                                            <TableHead>Tip</TableHead>
                                            <TableHead>Cena</TableHead>
                                            <TableHead className="text-center">Čitanja</TableHead>
                                            <TableHead className="text-center">Ocena</TableHead>
                                            <TableHead className="text-right">Akcije</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBooks.map((book) => {
                                            const coverUrl = resolveCoverUrl(book);

                                            return (
                                                <TableRow key={book.id}>
                                                    {/* Cover */}
                                                    <TableCell>
                                                        {coverUrl ? (
                                                            <img
                                                                src={coverUrl}
                                                                alt={book.title}
                                                                className="w-12 h-16 object-cover rounded"
                                                                onError={(event: SyntheticEvent<HTMLImageElement>) => {
                                                                    event.currentTarget.onerror = null;
                                                                    event.currentTarget.src = FALLBACK_COVER_IMAGE;
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-16 bg-reading-accent/10 rounded flex items-center justify-center">
                                                                <BookOpen className="w-6 h-6 text-reading-accent/40" />
                                                            </div>
                                                        )}
                                                    </TableCell>

                                                {/* Naslov */}
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{book.title}</p>
                                                        <p className={cn(dt.typography.small, "text-muted-foreground")}>
                                                            ISBN: {book.isbn}
                                                        </p>
                                                    </div>
                                                </TableCell>

                                                {/* Autor */}
                                                <TableCell>{book.author}</TableCell>

                                                {/* Kategorija */}
                                                <TableCell>
                                                    <Badge variant="outline">{book.category}</Badge>
                                                </TableCell>

                                                {/* Tip */}
                                                <TableCell>
                                                    {book.isPremium ? (
                                                        <Badge className="bg-yellow-500">Premium</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Besplatna</Badge>
                                                    )}
                                                </TableCell>

                                                {/* Cena */}
                                                <TableCell>
                                                    {book.isPremium ? formatPrice(book.price) : '-'}
                                                </TableCell>

                                                {/* Čitanja */}
                                                <TableCell className="text-center">
                                                    {book.readCount || 0}
                                                </TableCell>

                                                {/* Ocena */}
                                                <TableCell className="text-center">
                                                    {book.averageRating > 0 ? (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <span>{book.averageRating.toFixed(1)}</span>
                                                            <span className="text-yellow-500">★</span>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>

                                                {/* Akcije */}
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Akcije</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/books/${book.id}`}>
                                                                    <Eye className="w-4 h-4 mr-2" />
                                                                    Pregledaj
                                                                </Link>
                                                            </DropdownMenuItem>

                                                            {can('CAN_UPDATE_BOOKS') && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/admin/books/${book.id}/edit`}>
                                                                        <Edit className="w-4 h-4 mr-2" />
                                                                        Izmeni
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}

                                                            {book.contentUrl && (
                                                                <DropdownMenuItem asChild>
                                                                    <a
                                                                        href={book.contentUrl.startsWith('http')
                                                                            ? book.contentUrl
                                                                            : `${process.env.NEXT_PUBLIC_API_URL}${book.contentUrl}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <Download className="w-4 h-4 mr-2" />
                                                                        Download PDF
                                                                    </a>
                                                                </DropdownMenuItem>
                                                            )}

                                                            {can('CAN_DELETE_BOOKS') && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDelete(book.id)}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash className="w-4 h-4 mr-2" />
                                                                        Obriši
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}