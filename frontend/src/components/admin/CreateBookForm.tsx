'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    Upload,
    FileText,
    Image,
    AlertCircle,
    Check,
    X
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
import { useCreateBook } from '@/hooks/use-books';
import { BOOK_CATEGORIES, POPULAR_CATEGORIES } from '@/utils/book-categories';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

const createBookSchema = z.object({
    title: z.string()
        .min(1, 'Naslov je obavezan')
        .max(255, 'Naslov ne može biti duži od 255 karaktera'),
    author: z.string()
        .min(1, 'Autor je obavezan')
        .max(255, 'Autor ne može biti duži od 255 karaktera'),
    description: z.string()
        .min(10, 'Opis mora imati najmanje 10 karaktera')
        .max(2000, 'Opis ne može biti duži od 2000 karaktera'),
    isbn: z.string()
        .min(10, 'ISBN mora imati najmanje 10 karaktera')
        .max(20, 'ISBN ne može biti duži od 20 karaktera')
        .regex(/^[0-9X-]+$/, 'ISBN može sadržati samo brojeve, X i crtice'),
    category: z.string().min(1, 'Kategorija je obavezna'),
    pages: z.number()
        .min(1, 'Broj strana mora biti pozitivan')
        .max(10000, 'Broj strana ne može biti veći od 10000'),
    language: z.string().min(1, 'Jezik je obavezan'),
    publicationYear: z.number()
        .min(1000, 'Godina izdanja nije validna')
        .max(new Date().getFullYear() + 1, 'Godina izdanja ne može biti u budućnosti')
        .optional(),
    price: z.number()
        .min(0, 'Cena ne može biti negativna')
        .max(999999.99, 'Cena ne može biti veća od 999999.99'),
    isPremium: z.boolean(),
    pdfFile: z.instanceof(File)
        .refine(file => file.type === 'application/pdf', 'Fajl mora biti PDF'),
    coverFile: z.instanceof(File)
        .refine(file => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
            'Cover mora biti JPG ili PNG slika'),
});

type CreateBookFormData = z.infer<typeof createBookSchema>;

export function CreateBookForm() {
    const router = useRouter();
    const createBookMutation = useCreateBook();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
        reset
    } = useForm<CreateBookFormData>({
        resolver: zodResolver(createBookSchema),
        defaultValues: {
            isPremium: false,
            language: 'Serbian',
            price: 0,
            pages: 1,
        }
    });

    const isPremium = watch('isPremium');
    const selectedCategory = watch('category');

    // Handle cover image preview
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('coverFile', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle PDF file selection
    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('pdfFile', file);
        }
    };

    // Submit form
    const onSubmit = async (data: CreateBookFormData) => {
        try {
            // Create FormData for multipart upload
            const formData = new FormData();

            // Book data as JSON
            const bookData = {
                title: data.title,
                author: data.author,
                description: data.description,
                isbn: data.isbn,
                category: data.category,
                pages: data.pages,
                language: data.language,
                publicationYear: data.publicationYear,
                price: data.price,
                isPremium: data.isPremium,
            };

            // Backend expects Map<String, Object> format
            Object.entries(bookData).forEach(([key, value]) => {
                formData.append(key, String(value));
            });

            // Fajlovi
            formData.append('pdf', data.pdfFile);
            formData.append('cover', data.coverFile);

            await createBookMutation.mutateAsync(formData as any);
            router.push('/admin/books');
        } catch (error) {
            console.error('Error creating book:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Osnovne informacije */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Osnovne informacije
                    </CardTitle>
                    <CardDescription>
                        Unesite osnovne podatke o knjizi
                    </CardDescription>
                </CardHeader>
                <CardContent className={cn(dt.spacing.formFields)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Naslov */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Naslov *</Label>
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
                            <Label htmlFor="author">Autor *</Label>
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

                        {/* ISBN */}
                        <div className="space-y-2">
                            <Label htmlFor="isbn">ISBN *</Label>
                            <Input
                                id="isbn"
                                {...register('isbn')}
                                placeholder="npr. 978-86-521-3845-6"
                                className={errors.isbn ? 'border-red-500' : ''}
                            />
                            {errors.isbn && (
                                <p className="text-sm text-red-500">{errors.isbn.message}</p>
                            )}
                        </div>

                        {/* Kategorija */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Kategorija *</Label>
                            <Select onValueChange={(value) => setValue('category', value)}>
                                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Izaberite kategoriju" />
                                </SelectTrigger>
                                <SelectContent className="max-h-96">
                                    {/* Popularne kategorije */}
                                    <div className="px-2 py-1.5">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                                            Popularne kategorije
                                        </p>
                                        {POPULAR_CATEGORIES.map(category => (
                                            <SelectItem key={category} value={category}>
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
                                        {BOOK_CATEGORIES.map(category => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </div>
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-sm text-red-500">{errors.category.message}</p>
                            )}
                        </div>

                        {/* Broj strana */}
                        <div className="space-y-2">
                            <Label htmlFor="pages">Broj strana *</Label>
                            <Input
                                id="pages"
                                type="number"
                                {...register('pages', { valueAsNumber: true })}
                                placeholder="npr. 320"
                                className={errors.pages ? 'border-red-500' : ''}
                            />
                            {errors.pages && (
                                <p className="text-sm text-red-500">{errors.pages.message}</p>
                            )}
                        </div>

                        {/* Jezik */}
                        <div className="space-y-2">
                            <Label htmlFor="language">Jezik *</Label>
                            <Select
                                defaultValue="Serbian"
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
                                {...register('publicationYear', { valueAsNumber: true })}
                                placeholder={`npr. ${new Date().getFullYear()}`}
                                className={errors.publicationYear ? 'border-red-500' : ''}
                            />
                            {errors.publicationYear && (
                                <p className="text-sm text-red-500">{errors.publicationYear.message}</p>
                            )}
                        </div>

                        {/* Cena */}
                        <div className="space-y-2">
                            <Label htmlFor="price">Cena (RSD)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                {...register('price', { valueAsNumber: true })}
                                placeholder="npr. 999.00"
                                disabled={!isPremium}
                                className={errors.price ? 'border-red-500' : ''}
                            />
                            {errors.price && (
                                <p className="text-sm text-red-500">{errors.price.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Opis */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Opis *</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Unesite opis knjige..."
                            rows={4}
                            className={errors.description ? 'border-red-500' : ''}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

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
                            checked={isPremium}
                            onCheckedChange={(checked) => setValue('isPremium', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Upload fajlova */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Upload fajlova
                    </CardTitle>
                    <CardDescription>
                        Dodajte PDF knjige i cover sliku
                    </CardDescription>
                </CardHeader>
                <CardContent className={cn(dt.spacing.formFields)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* PDF Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="pdfFile">PDF fajl *</Label>
                            <div className="border-2 border-dashed border-reading-accent/20 rounded-lg p-6 text-center hover:border-reading-accent/40 transition-colors">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-reading-accent/40" />
                                <Label
                                    htmlFor="pdfFile"
                                    className="cursor-pointer text-reading-accent hover:underline"
                                >
                                    Izaberite PDF fajl
                                </Label>
                                <Input
                                    id="pdfFile"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handlePdfChange}
                                    className="hidden"
                                />
                                <p className={cn(dt.typography.muted, "mt-2")}>
                                    Maksimalno 50MB
                                </p>
                                {watch('pdfFile') && (
                                    <Badge variant="secondary" className="mt-3">
                                        <Check className="w-3 h-3 mr-1" />
                                        {watch('pdfFile').name}
                                    </Badge>
                                )}
                            </div>
                            {errors.pdfFile && (
                                <p className="text-sm text-red-500">{errors.pdfFile.message}</p>
                            )}
                        </div>

                        {/* Cover Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="coverFile">Cover slika *</Label>
                            <div className="border-2 border-dashed border-reading-accent/20 rounded-lg p-6 text-center hover:border-reading-accent/40 transition-colors">
                                {previewUrl ? (
                                    <div className="relative">
                                        <img
                                            src={previewUrl}
                                            alt="Cover preview"
                                            className="w-32 h-48 object-cover mx-auto rounded"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="absolute top-0 right-0"
                                            onClick={() => {
                                                setPreviewUrl(null);
                                                setValue('coverFile', null as any);
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Image className="w-12 h-12 mx-auto mb-4 text-reading-accent/40" />
                                        <Label
                                            htmlFor="coverFile"
                                            className="cursor-pointer text-reading-accent hover:underline"
                                        >
                                            Izaberite cover sliku
                                        </Label>
                                        <Input
                                            id="coverFile"
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png"
                                            onChange={handleCoverChange}
                                            className="hidden"
                                        />
                                        <p className={cn(dt.typography.muted, "mt-2")}>
                                            JPG ili PNG, maksimalno 5MB
                                        </p>
                                    </>
                                )}
                            </div>
                            {errors.coverFile && (
                                <p className="text-sm text-red-500">{errors.coverFile.message}</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submit dugmići */}
            <div className="flex justify-end gap-4">
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
                    disabled={isSubmitting}
                    className={cn(dt.interactive.buttonPrimary)}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Dodavanje...
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Dodaj knjigu
                        </>
                    )}
                </Button>
            </div>

            {/* Error alert */}
            {createBookMutation.isError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {(createBookMutation.error as any)?.response?.data?.message ||
                            'Greška pri dodavanju knjige. Pokušajte ponovo.'}
                    </AlertDescription>
                </Alert>
            )}
        </form>
    );
}