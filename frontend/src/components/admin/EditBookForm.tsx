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
    ChevronDown,
    X
} from 'lucide-react';
import { useUpdateBook, useUploadBookFiles } from '@/hooks/use-books';
import { useCategories } from '@/hooks/use-categories';
import { usePublishers } from '@/hooks/use-publishers';
import { BookResponseDTO } from '@/api/types/books.types';
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
    categoryId: z.number().optional(),
    publisherId: z.number().optional(),
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
    const { data: categories, isLoading: categoriesLoading } = useCategories();
    const { data: publishers, isLoading: publishersLoading } = usePublishers();
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
            categoryId: book.category?.id,
            publisherId: book.publisher?.id,
            pages: book.pages,
            language: book.language || 'Serbian',
            publicationYear: book.publicationYear,
            isPremium: book.isPremium,
            isAvailable: book.isAvailable,
        }
    });

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
            if (data.categoryId !== book.category?.id) changedData.categoryId = data.categoryId;
            if (data.publisherId !== book.publisher?.id) changedData.publisherId = data.publisherId;

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
            {/* Status badges */}
            <div className="flex gap-2">
                {book.isPremium && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Premium
                    </span>
                )}
                {!book.isAvailable && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Nedostupna
                    </span>
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
                    ID: {book.id}
                </span>
            </div>

            {/* Osnovne informacije */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-sky-950" />
                        <h3 className="text-lg font-semibold text-gray-900">Osnovne informacije</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Izmeni osnovne podatke o knjizi</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Naslov */}
                        <div className="space-y-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Naslov
                            </label>
                            <input
                                id="title"
                                {...register('title')}
                                placeholder="npr. Atomske navike"
                                className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none ${
                                    errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Autor */}
                        <div className="space-y-2">
                            <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                                Autor
                            </label>
                            <input
                                id="author"
                                {...register('author')}
                                placeholder="npr. James Clear"
                                className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none ${
                                    errors.author ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.author && (
                                <p className="text-sm text-red-500">{errors.author.message}</p>
                            )}
                        </div>

                        {/* Kategorija */}
                        <div className="space-y-2">
                            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                                Kategorija
                            </label>
                            <div className="relative">
                                <select
                                    value={watch('categoryId') || ''}
                                    onChange={(e) => setValue('categoryId', parseInt(e.target.value), { shouldDirty: true })}
                                    disabled={categoriesLoading}
                                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none"
                                >
                                    <option value="">{categoriesLoading ? 'Učitavanje...' : 'Izaberite kategoriju'}</option>
                                    {categories?.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Izdavač */}
                        <div className="space-y-2">
                            <label htmlFor="publisherId" className="block text-sm font-medium text-gray-700">
                                Izdavač
                            </label>
                            <div className="relative">
                                <select
                                    value={watch('publisherId') || ''}
                                    onChange={(e) => setValue('publisherId', parseInt(e.target.value), { shouldDirty: true })}
                                    disabled={publishersLoading}
                                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none"
                                >
                                    <option value="">{publishersLoading ? 'Učitavanje...' : 'Izaberi izdavača'}</option>
                                    {publishers?.map((publisher) => (
                                        <option key={publisher.id} value={publisher.id}>
                                            {publisher.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Broj strana */}
                        <div className="space-y-2">
                            <label htmlFor="pages" className="block text-sm font-medium text-gray-700">
                                Broj strana
                            </label>
                            <input
                                id="pages"
                                type="number"
                                {...register('pages', { valueAsNumber: true })}
                                className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none ${
                                    errors.pages ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.pages && (
                                <p className="text-sm text-red-500">{errors.pages.message}</p>
                            )}
                        </div>

                        {/* Jezik */}
                        <div className="space-y-2">
                            <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                                Jezik
                            </label>
                            <div className="relative">
                                <select
                                    value={watch('language') || 'Serbian'}
                                    onChange={(e) => setValue('language', e.target.value)}
                                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none"
                                >
                                    <option value="Serbian">Srpski</option>
                                    <option value="English">Engleski</option>
                                    <option value="German">Nemački</option>
                                    <option value="French">Francuski</option>
                                    <option value="Spanish">Španski</option>
                                    <option value="Russian">Ruski</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Godina izdanja */}
                        <div className="space-y-2">
                            <label htmlFor="publicationYear" className="block text-sm font-medium text-gray-700">
                                Godina izdanja
                            </label>
                            <input
                                id="publicationYear"
                                type="number"
                                {...register('publicationYear', {
                                    valueAsNumber: true,
                                    setValueAs: v => v === "" ? null : parseInt(v)
                                })}
                                className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none ${
                                    errors.publicationYear ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.publicationYear && (
                                <p className="text-sm text-red-500">{errors.publicationYear.message}</p>
                            )}
                        </div>

                        {/* ISBN (readonly) */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">ISBN</label>
                            <input
                                value={book.isbn}
                                disabled
                                className="w-full px-3 py-2 text-sm text-gray-500 bg-gray-100 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Opis */}
                    <div className="space-y-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Opis
                        </label>
                        <textarea
                            id="description"
                            {...register('description')}
                            rows={4}
                            className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none resize-none ${
                                errors.description ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Switches */}
                    <div className="space-y-4">
                        {/* Premium toggle */}
                        <div className="flex items-center justify-between p-4 bg-sky-50 rounded-lg border border-sky-100">
                            <div className="space-y-1">
                                <label htmlFor="isPremium" className="text-sm font-medium text-gray-900">
                                    Premium knjiga
                                </label>
                                <p className="text-sm text-gray-600">
                                    Premium knjige zahtevaju pretplatu za čitanje
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={watch('isPremium')}
                                onClick={() => setValue('isPremium', !watch('isPremium'), { shouldDirty: true })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                    watch('isPremium') ? 'bg-sky-950' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                        watch('isPremium') ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Available toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="space-y-1">
                                <label htmlFor="isAvailable" className="text-sm font-medium text-gray-900">
                                    Dostupna za čitanje
                                </label>
                                <p className="text-sm text-gray-600">
                                    Kontroliši da li je knjiga vidljiva korisnicima
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={watch('isAvailable')}
                                onClick={() => setValue('isAvailable', !watch('isAvailable'), { shouldDirty: true })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                    watch('isAvailable') ? 'bg-sky-950' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                        watch('isAvailable') ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload novih fajlova */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-sky-950" />
                        <h3 className="text-lg font-semibold text-gray-900">Zameni fajlove</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Opciono: Upload novi PDF ili cover sliku</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Current/New Cover */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Cover slika</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-sky-950 transition-colors">
                                {getCoverUrl() ? (
                                    <div className="relative inline-block w-full">
                                        <img
                                            src={getCoverUrl()!}
                                            alt="Book cover"
                                            className="w-32 h-48 object-cover mx-auto rounded mb-4"
                                        />
                                        {previewUrl && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPreviewUrl(null);
                                                    setValue('newCoverFile', undefined as any);
                                                }}
                                                className="absolute top-0 right-1/2 translate-x-[4.5rem] -translate-y-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-32 h-48 bg-gray-100 mx-auto rounded mb-4 flex items-center justify-center">
                                        <Image className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                                <label
                                    htmlFor="newCoverFile"
                                    className="cursor-pointer text-sky-950 hover:underline font-medium block text-center"
                                >
                                    {getCoverUrl() ? 'Zameni cover sliku' : 'Dodaj cover sliku'}
                                </label>
                                <input
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
                            <label className="block text-sm font-medium text-gray-700">PDF fajl</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-sky-950 transition-colors">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-sm text-gray-600 mb-2">
                                    {book.contentUrl ? 'PDF već postoji' : 'PDF nije uploadovan'}
                                </p>
                                <label
                                    htmlFor="newPdfFile"
                                    className="cursor-pointer text-sky-950 hover:underline font-medium"
                                >
                                    Zameni PDF fajl
                                </label>
                                <input
                                    id="newPdfFile"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handlePdfChange}
                                    className="hidden"
                                />
                                {watch('newPdfFile') && (
                                    <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Novi PDF: {watch('newPdfFile')?.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-200" />

                    {/* Promo Chapter */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1">Promo poglavlje (opciono)</h3>
                            <p className="text-sm text-gray-600">
                                Dodajte ili zamenite besplatno promo poglavlje
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Promo poglavlje PDF</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-sky-950 transition-colors">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-sm text-gray-600 mb-2">
                                    {book.promoChapterPath ? 'Promo poglavlje postoji' : 'Promo poglavlje nije dodato'}
                                </p>
                                <label
                                    htmlFor="newPromoChapterFile"
                                    className="cursor-pointer text-sky-950 hover:underline font-medium"
                                >
                                    {book.promoChapterPath ? 'Zameni promo poglavlje' : 'Dodaj promo poglavlje'}
                                </label>
                                <input
                                    id="newPromoChapterFile"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handlePromoChapterChange}
                                    className="hidden"
                                />
                                {watch('newPromoChapterFile') && (
                                    <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Novi promo: {watch('newPromoChapterFile')?.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit dugmići */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    {hasChanges ? '• Imate nesačuvane izmene' : '• Nema izmena'}
                </div>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.push('/admin/books')}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                    >
                        Otkaži
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !hasChanges}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-sky-950 rounded-lg hover:bg-sky-900 transition-colors duration-200 disabled:opacity-50"
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
                    </button>
                </div>
            </div>

            {/* Error alert */}
            {(updateBookMutation.isError || uploadFilesMutation.isError) && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <p className="text-sm text-red-800">
                            {(updateBookMutation.error as any)?.response?.data?.message ||
                                (uploadFilesMutation.error as any)?.response?.data?.message ||
                                'Greška pri ažuriranju knjige. Pokušajte ponovo.'}
                        </p>
                    </div>
                </div>
            )}
        </form>
    );
}
