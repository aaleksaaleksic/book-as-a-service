// Putanja: book-as-service/frontend/src/components/admin/EditBookForm.tsx

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    Save,
    AlertCircle,
    Upload,
    Image,
    FileText,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useUpdateBook, useUploadBookFiles } from '@/hooks/use-books';
import { BOOK_CATEGORIES, POPULAR_CATEGORIES } from '@/utils/book-categories';
import { BookResponseDTO } from '@/api/types/books.types';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { resolveApiFileUrl } from '@/lib/asset-utils';

// Validation schema za edit (sva polja su opciona jer šaljemo samo promenjene)
const editBookSchema = z.object({
    title: z.string()
        .min(1, 'Naslov je obavezan')
        .max(255, 'Naslov ne može biti duži od 255 karaktera')
        .optional(),
    author: z.string()
        .min(1, 'Autor je obavezan')
        .max(255, 'Autor ne može biti duži od 255 karaktera')
        .optional(),
    description: z.string()
        .min(10, 'Opis mora imati najmanje 10 karaktera')
        .max(2000, 'Opis ne može biti duži od 2000 karaktera')
        .optional(),
    category: z.string().optional(),
    pages: z.number()
        .min(1, 'Broj strana mora biti pozitivan')
        .max(10000, 'Broj strana ne može biti veći od 10000')
        .optional(),
    language: z.string().optional(),
    publicationYear: z.number()
        .min(1000, 'Godina izdanja nije validna')
        .max(new Date().getFullYear() + 1, 'Godina izdanja ne može biti u budućnosti')
        .optional()
        .nullable(),
    isPremium: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
    // Novi fajlovi su opcioni pri edit-u
    newPdfFile: z.instanceof(File)
        .refine(file => file.type === 'application/pdf', 'Fajl mora biti PDF')
        .optional(),
    newCoverFile: z.instanceof(File)
        .refine(file => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
            'Cover mora biti JPG ili PNG slika')
        .optional(),
    newPromoChapterFile: z.instanceof(File)
        .refine(file => file.type === 'application/pdf', 'Promo poglavlje mora biti PDF')
        .optional(),
});

type EditBookFormData = z.infer<typeof editBookSchema>;

interface EditBookFormProps {
    book: BookResponseDTO;
}

export function EditBookForm({ book }: EditBookFormProps) {
    const router = useRouter();
    const updateBookMutation = useUpdateBook();
    const uploadFilesMutation = useUploadBookFiles();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty },
        setValue,
        watch,
        reset
    } = useForm<EditBookFormData>({
        resolver: zodResolver(editBookSchema),
        defaultValues: {
            title: book.title,
            author: book.author,
            description: book.description,
            category: book.category,
            pages: book.pages,
            language: book.language || 'Serbian',
            publicationYear: book.publicationYear,
            isPremium: book.isPremium,
            isAvailable: book.isAvailable,
        }
    });

    const popularCategorySet = new Set<string>([...POPULAR_CATEGORIES]);
    const otherCategories = BOOK_CATEGORIES.filter(category => !popularCategorySet.has(category));

    // Track changes
    useEffect(() => {
        setHasChanges(isDirty);
    }, [isDirty]);

    // Handle cover image preview
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('newCoverFile', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            setHasChanges(true);
        }
    };

    // Handle PDF file selection
    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('newPdfFile', file);
            setHasChanges(true);
        }
    };

    // Handle promo chapter file selection
    const handlePromoChapterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('newPromoChapterFile', file);
            setHasChanges(true);
        }
    };

    // Submit form
    const onSubmit = async (data: EditBookFormData) => {
        try {
            // Pripremi samo promenjene podatke
            const changedData: any = {};

            // Poredi sa originalnim podacima
            if (data.title !== book.title) changedData.title = data.title;
            if (data.author !== book.author) changedData.author = data.author;
            if (data.description !== book.description) changedData.description = data.description;
            if (data.category !== book.category) changedData.category = data.category;
            if (data.pages !== book.pages) changedData.pages = data.pages;
            if (data.language !== book.language) changedData.language = data.language;
            if (data.publicationYear !== book.publicationYear) changedData.publicationYear = data.publicationYear;
            if (data.isPremium !== book.isPremium) changedData.isPremium = data.isPremium;
            if (data.isAvailable !== book.isAvailable) changedData.isAvailable = data.isAvailable;

            // Ažuriraj osnovne podatke ako ima promena
            if (Object.keys(changedData).length > 0) {
                await updateBookMutation.mutateAsync({
                    id: book.id,
                    data: changedData
                });
            }

            // Upload novih fajlova ako postoje
            if (data.newPdfFile || data.newCoverFile || data.newPromoChapterFile) {
                await uploadFilesMutation.mutateAsync({
                    bookId: book.id,
                    ...(data.newPdfFile ? { pdfFile: data.newPdfFile } : {}),
                    ...(data.newCoverFile ? { coverFile: data.newCoverFile } : {}),
                    ...(data.newPromoChapterFile ? { promoChapterFile: data.newPromoChapterFile } : {}),
                });
            }

            router.push('/admin/books');
        } catch (error) {
            console.error('Error updating book:', error);
        }
    };

    const getCoverUrl = () => {
        if (previewUrl) return previewUrl;
        return resolveApiFileUrl(book.coverImageUrl);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Status badge */}
            <div className="flex gap-2">
                {book.isPremium && (
                    <Badge className="bg-yellow-500">Premium</Badge>
                )}
                {!book.isAvailable && (
                    <Badge variant="destructive">Nedostupna</Badge>
                )}
                <Badge variant="outline">ID: {book.id}</Badge>
            </div>

            {/* Osnovne informacije */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Osnovne informacije
                    </CardTitle>
                    <CardDescription>
                        Izmeni osnovne podatke o knjizi
                    </CardDescription>
                </CardHeader>
                <CardContent className={cn(dt.spacing.formFields)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Naslov */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Naslov</Label>
                            <Input
                                id="title"
                                {...register('title')}
                                placeholder="npr. Atomske navike"
                                className={errors.title ? 'border-red-500' : ''}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Autor */}
                        <div className="space-y-2">
                            <Label htmlFor="author">Autor</Label>
                            <Input
                                id="author"
                                {...register('author')}
                                placeholder="npr. James Clear"
                                className={errors.author ? 'border-red-500' : ''}
                            />
                            {errors.author && (
                                <p className="text-sm text-red-500">{errors.author.message}</p>
                            )}
                        </div>

                        {/* Kategorija */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Kategorija</Label>
                            <Select
                                value={watch('category') || undefined}
                                onValueChange={(value) => {
                                    setValue('category', value, { shouldDirty: true });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-96">
                                    {/* Popularne kategorije */}
                                    <div className="px-2 py-1.5">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                                            Popularne kategorije
                                        </p>
                                        {[...popularCategorySet].map(category => (
                                            <SelectItem key={`popular-${category}`} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </div>
                                    <Separator />
                                    {/* Sve kategorije */}
                                    <div className="px-2 py-1.5">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                                            Sve kategorije
                                        </p>
                                        {otherCategories.map(category => (
                                            <SelectItem key={`all-${category}`} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </div>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Broj strana */}
                        <div className="space-y-2">
                            <Label htmlFor="pages">Broj strana</Label>
                            <Input
                                id="pages"
                                type="number"
                                {...register('pages', { valueAsNumber: true })}
                                className={errors.pages ? 'border-red-500' : ''}
                            />
                            {errors.pages && (
                                <p className="text-sm text-red-500">{errors.pages.message}</p>
                            )}
                        </div>

                        {/* Jezik */}
                        <div className="space-y-2">
                            <Label htmlFor="language">Jezik</Label>
                            <Select
                                defaultValue={book.language || 'Serbian'}
                                onValueChange={(value) => setValue('language', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Serbian">Srpski</SelectItem>
                                    <SelectItem value="English">Engleski</SelectItem>
                                    <SelectItem value="German">Nemački</SelectItem>
                                    <SelectItem value="French">Francuski</SelectItem>
                                    <SelectItem value="Spanish">Španski</SelectItem>
                                    <SelectItem value="Russian">Ruski</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Godina izdanja */}
                        <div className="space-y-2">
                            <Label htmlFor="publicationYear">Godina izdanja</Label>
                            <Input
                                id="publicationYear"
                                type="number"
                                {...register('publicationYear', {
                                    valueAsNumber: true,
                                    setValueAs: v => v === "" ? null : parseInt(v)
                                })}
                                className={errors.publicationYear ? 'border-red-500' : ''}
                            />
                            {errors.publicationYear && (
                                <p className="text-sm text-red-500">{errors.publicationYear.message}</p>
                            )}
                        </div>

                        {/* ISBN (readonly) */}
                        <div className="space-y-2">
                            <Label>ISBN</Label>
                            <Input
                                value={book.isbn}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                    </div>

                    {/* Opis */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Opis</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            rows={4}
                            className={errors.description ? 'border-red-500' : ''}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Switches */}
                    <div className="space-y-4">
                        {/* Premium toggle */}
                        <div className="flex items-center justify-between p-4 bg-book-green-50 rounded-lg">
                            <div className="space-y-1">
                                <Label htmlFor="isPremium" className="text-base">
                                    Premium knjiga
                                </Label>
                                <p className={cn(dt.typography.muted)}>
                                    Premium knjige zahtevaju pretplatu za čitanje
                                </p>
                            </div>
                            <Switch
                                id="isPremium"
                                checked={watch('isPremium')}
                                onCheckedChange={(checked) => setValue('isPremium', checked)}
                            />
                        </div>

                        {/* Available toggle */}
                        <div className="flex items-center justify-between p-4 bg-book-green-50 rounded-lg">
                            <div className="space-y-1">
                                <Label htmlFor="isAvailable" className="text-base">
                                    Dostupna za čitanje
                                </Label>
                                <p className={cn(dt.typography.muted)}>
                                    Kontroliši da li je knjiga vidljiva korisnicima
                                </p>
                            </div>
                            <Switch
                                id="isAvailable"
                                checked={watch('isAvailable')}
                                onCheckedChange={(checked) => setValue('isAvailable', checked)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Upload novih fajlova */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Zameni fajlove
                    </CardTitle>
                    <CardDescription>
                        Opciono: Upload novi PDF ili cover sliku
                    </CardDescription>
                </CardHeader>
                <CardContent className={cn(dt.spacing.formFields)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Current/New Cover */}
                        <div className="space-y-2">
                            <Label>Cover slika</Label>
                            <div className="border-2 border-dashed border-reading-accent/20 rounded-lg p-4">
                                {getCoverUrl() ? (
                                    <img
                                        src={getCoverUrl()!}
                                        alt="Book cover"
                                        className="w-32 h-48 object-cover mx-auto rounded mb-4"
                                    />
                                ) : (
                                    <div className="w-32 h-48 bg-reading-accent/10 mx-auto rounded mb-4 flex items-center justify-center">
                                        <Image className="w-12 h-12 text-reading-accent/40" />
                                    </div>
                                )}
                                <Label
                                    htmlFor="newCoverFile"
                                    className="cursor-pointer text-reading-accent hover:underline block text-center"
                                >
                                    {getCoverUrl() ? 'Zameni cover sliku' : 'Dodaj cover sliku'}
                                </Label>
                                <Input
                                    id="newCoverFile"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={handleCoverChange}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* New PDF */}
                        <div className="space-y-2">
                            <Label>PDF fajl</Label>
                            <div className="border-2 border-dashed border-reading-accent/20 rounded-lg p-4 text-center">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-reading-accent/40" />
                                <p className={cn(dt.typography.muted, "mb-2")}>
                                    {book.contentUrl ? 'PDF već postoji' : 'PDF nije uploadovan'}
                                </p>
                                <Label
                                    htmlFor="newPdfFile"
                                    className="cursor-pointer text-reading-accent hover:underline"
                                >
                                    Zameni PDF fajl
                                </Label>
                                <Input
                                    id="newPdfFile"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handlePdfChange}
                                    className="hidden"
                                />
                                {watch('newPdfFile') && (
                                    <Badge variant="secondary" className="mt-3">
                                        Novi PDF: {watch('newPdfFile')?.name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Promo Chapter */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Promo poglavlje (opciono)</h3>
                            <p className={cn(dt.typography.muted)}>
                                Dodajte ili zamenite besplatno promo poglavlje
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Promo poglavlje PDF</Label>
                            <div className="border-2 border-dashed border-book-green-500/20 rounded-lg p-4 text-center">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-book-green-500/40" />
                                <p className={cn(dt.typography.muted, "mb-2")}>
                                    {book.promoChapterPath ? 'Promo poglavlje postoji' : 'Promo poglavlje nije dodato'}
                                </p>
                                <Label
                                    htmlFor="newPromoChapterFile"
                                    className="cursor-pointer text-book-green-600 hover:underline"
                                >
                                    {book.promoChapterPath ? 'Zameni promo poglavlje' : 'Dodaj promo poglavlje'}
                                </Label>
                                <Input
                                    id="newPromoChapterFile"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handlePromoChapterChange}
                                    className="hidden"
                                />
                                {watch('newPromoChapterFile') && (
                                    <Badge variant="secondary" className="mt-3 bg-book-green-100 text-book-green-700">
                                        Novi promo: {watch('newPromoChapterFile')?.name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submit dugmići */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {hasChanges ? '• Imate nesačuvane izmene' : '• Nema izmena'}
                </div>
                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/admin/books')}
                        disabled={isSubmitting}
                    >
                        Otkaži
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !hasChanges}
                        className={cn(dt.interactive.buttonPrimary)}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Čuvanje...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Sačuvaj izmene
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Error alert */}
            {(updateBookMutation.isError || uploadFilesMutation.isError) && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {(updateBookMutation.error as any)?.response?.data?.message ||
                            (uploadFilesMutation.error as any)?.response?.data?.message ||
                            'Greška pri ažuriranju knjige. Pokušajte ponovo.'}
                    </AlertDescription>
                </Alert>
            )}
        </form>
    );
}