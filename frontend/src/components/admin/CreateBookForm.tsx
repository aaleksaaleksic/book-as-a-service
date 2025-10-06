'use client';

import { useEffect, useState } from 'react';
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
    X,
    ChevronDown
} from 'lucide-react';
import { useCreateBook } from '@/hooks/use-books';
import { useCategories } from '@/hooks/use-categories';
import { usePublishers } from '@/hooks/use-publishers';

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
    categoryId: z.number().min(1, 'Kategorija je obavezna'),
    publisherId: z.number().min(1, 'Izdavač je obavezan'),
    pages: z.number()
        .min(1, 'Broj strana mora biti pozitivan')
        .max(10000, 'Broj strana ne može biti veći od 10000'),
    language: z.string().min(1, 'Jezik je obavezan'),
    publicationYear: z.number()
        .min(1000, 'Godina izdanja nije validna')
        .max(new Date().getFullYear() + 1, 'Godina izdanja ne može biti u budućnosti')
        .optional(),
    isPremium: z.boolean(),
    isAvailable: z.boolean(),
    pdfFile: z.instanceof(File)
        .refine(file => file.type === 'application/pdf', 'Fajl mora biti PDF'),
    coverFile: z.instanceof(File)
        .refine(file => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
            'Cover mora biti JPG ili PNG slika'),
    promoChapterFile: z.instanceof(File)
        .refine(file => file.type === 'application/pdf', 'Promo poglavlje mora biti PDF')
        .optional(),
});

type CreateBookFormData = z.infer<typeof createBookSchema>;

export function CreateBookForm() {
    const router = useRouter();
    const createBookMutation = useCreateBook();
    const { data: categories, isLoading: categoriesLoading } = useCategories();
    const { data: publishers, isLoading: publishersLoading } = usePublishers();
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
            isAvailable: true,
            language: 'Serbian',
            pages: 1,
        }
    });

    const isPremium = watch('isPremium');
    const isAvailable = watch('isAvailable');

    // Handle cover image preview
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('coverFile', file, { shouldDirty: true });
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
            setValue('pdfFile', file, { shouldDirty: true });
        }
    };

    // Handle promo chapter file selection
    const handlePromoChapterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('promoChapterFile', file, { shouldDirty: true });
        }
    };

    useEffect(() => {
        register('pdfFile');
        register('coverFile');
        register('promoChapterFile');
    }, [register]);

    // Submit form
    const onSubmit = async (data: CreateBookFormData) => {
        try {
            const publicationYearValue = Number.isNaN(data.publicationYear) ? undefined : data.publicationYear;

            await createBookMutation.mutateAsync({
                title: data.title,
                author: data.author,
                description: data.description,
                isbn: data.isbn,
                categoryId: data.categoryId,
                publisherId: data.publisherId,
                pages: data.pages,
                language: data.language,
                publicationYear: publicationYearValue,
                price: 0,
                isPremium: data.isPremium,
                isAvailable: data.isAvailable,
                pdfFile: data.pdfFile,
                coverFile: data.coverFile,
                promoChapterFile: data.promoChapterFile,
            });
            router.push('/admin/books');
        } catch (error) {
            console.error('Error creating book:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Osnovne informacije */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-sky-950" />
                        <h3 className="text-lg font-semibold text-gray-900">Osnovne informacije</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Unesite osnovne podatke o knjizi</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Naslov */}
                        <div className="space-y-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Naslov *
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
                                Autor *
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

                        {/* ISBN */}
                        <div className="space-y-2">
                            <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
                                ISBN *
                            </label>
                            <input
                                id="isbn"
                                {...register('isbn')}
                                placeholder="npr. 978-86-521-3845-6"
                                className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none ${
                                    errors.isbn ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.isbn && (
                                <p className="text-sm text-red-500">{errors.isbn.message}</p>
                            )}
                        </div>

                        {/* Kategorija */}
                        <div className="space-y-2">
                            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                                Kategorija *
                            </label>
                            <div className="relative">
                                <select
                                    onChange={(e) => setValue('categoryId', parseInt(e.target.value), { shouldDirty: true })}
                                    disabled={categoriesLoading}
                                    className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg appearance-none focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none ${
                                        errors.categoryId ? 'border-red-500' : 'border-gray-300'
                                    }`}
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
                            {errors.categoryId && (
                                <p className="text-sm text-red-500">{errors.categoryId.message}</p>
                            )}
                        </div>

                        {/* Izdavač */}
                        <div className="space-y-2">
                            <label htmlFor="publisherId" className="block text-sm font-medium text-gray-700">
                                Izdavač *
                            </label>
                            <div className="relative">
                                <select
                                    onChange={(e) => setValue('publisherId', parseInt(e.target.value), { shouldDirty: true })}
                                    disabled={publishersLoading}
                                    className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg appearance-none focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none ${
                                        errors.publisherId ? 'border-red-500' : 'border-gray-300'
                                    }`}
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
                            {errors.publisherId && (
                                <p className="text-sm text-red-500">{errors.publisherId.message}</p>
                            )}
                        </div>

                        {/* Broj strana */}
                        <div className="space-y-2">
                            <label htmlFor="pages" className="block text-sm font-medium text-gray-700">
                                Broj strana *
                            </label>
                            <input
                                id="pages"
                                type="number"
                                {...register('pages', { valueAsNumber: true })}
                                placeholder="npr. 320"
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
                                Jezik *
                            </label>
                            <div className="relative">
                                <select
                                    defaultValue="Serbian"
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
                                {...register('publicationYear', { valueAsNumber: true })}
                                placeholder={`npr. ${new Date().getFullYear()}`}
                                className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none ${
                                    errors.publicationYear ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.publicationYear && (
                                <p className="text-sm text-red-500">{errors.publicationYear.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Opis */}
                    <div className="space-y-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Opis *
                        </label>
                        <textarea
                            id="description"
                            {...register('description')}
                            placeholder="Unesite opis knjige..."
                            rows={4}
                            className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none resize-none ${
                                errors.description ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

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
                            aria-checked={isPremium}
                            onClick={() => setValue('isPremium', !isPremium, { shouldDirty: true })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                isPremium ? 'bg-sky-950' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                    isPremium ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="space-y-1">
                            <label htmlFor="isAvailable" className="text-sm font-medium text-gray-900">
                                Vidljivost knjige
                            </label>
                            <p className="text-sm text-gray-600">
                                Kontroliše da li je knjiga odmah dostupna čitaocima
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isAvailable}
                            onClick={() => setValue('isAvailable', !isAvailable, { shouldDirty: true })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                isAvailable ? 'bg-sky-950' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                    isAvailable ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload fajlova */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-sky-950" />
                        <h3 className="text-lg font-semibold text-gray-900">Upload fajlova</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Dodajte PDF knjige i cover sliku</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* PDF Upload */}
                        <div className="space-y-2">
                            <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700">
                                PDF fajl *
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sky-950 transition-colors">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <label
                                    htmlFor="pdfFile"
                                    className="cursor-pointer text-sky-950 hover:underline font-medium"
                                >
                                    Izaberite PDF fajl
                                </label>
                                <input
                                    id="pdfFile"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handlePdfChange}
                                    className="hidden"
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    Maksimalno 70MB
                                </p>
                                {watch('pdfFile') && (
                                    <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <Check className="w-3 h-3 mr-1" />
                                        {watch('pdfFile').name}
                                    </div>
                                )}
                            </div>
                            {errors.pdfFile && (
                                <p className="text-sm text-red-500">{errors.pdfFile.message}</p>
                            )}
                        </div>

                        {/* Cover Upload */}
                        <div className="space-y-2">
                            <label htmlFor="coverFile" className="block text-sm font-medium text-gray-700">
                                Cover slika *
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sky-950 transition-colors">
                                {previewUrl ? (
                                    <div className="relative inline-block">
                                        <img
                                            src={previewUrl}
                                            alt="Cover preview"
                                            className="w-32 h-48 object-cover mx-auto rounded"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPreviewUrl(null);
                                                setValue('coverFile', undefined as any, { shouldDirty: true });
                                            }}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <label
                                            htmlFor="coverFile"
                                            className="cursor-pointer text-sky-950 hover:underline font-medium"
                                        >
                                            Izaberite cover sliku
                                        </label>
                                        <input
                                            id="coverFile"
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png"
                                            onChange={handleCoverChange}
                                            className="hidden"
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
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

                    <div className="h-px bg-gray-200" />

                    {/* Promo Chapter Upload - Optional */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1">Promo poglavlje (opciono)</h3>
                            <p className="text-sm text-gray-600">
                                Dodajte besplatno promo poglavlje koje korisnici bez pretplate mogu čitati
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="promoChapterFile" className="block text-sm font-medium text-gray-700">
                                Promo poglavlje PDF
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sky-950 transition-colors">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <label
                                    htmlFor="promoChapterFile"
                                    className="cursor-pointer text-sky-950 hover:underline font-medium"
                                >
                                    Izaberite promo poglavlje PDF
                                </label>
                                <input
                                    id="promoChapterFile"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handlePromoChapterChange}
                                    className="hidden"
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    PDF fajl, maksimalno 70MB
                                </p>
                                {watch('promoChapterFile') && (
                                    <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <Check className="w-3 h-3 mr-1" />
                                        {watch('promoChapterFile').name}
                                    </div>
                                )}
                            </div>
                            {errors.promoChapterFile && (
                                <p className="text-sm text-red-500">{errors.promoChapterFile.message}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit dugmići */}
            <div className="flex justify-end gap-4">
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
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-sky-950 rounded-lg hover:bg-sky-900 transition-colors duration-200 disabled:opacity-50"
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
                </button>
            </div>

            {/* Error alert */}
            {createBookMutation.isError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <p className="text-sm text-red-800">
                            {(createBookMutation.error as any)?.response?.data?.message ||
                                'Greška pri dodavanju knjige. Pokušajte ponovo.'}
                        </p>
                    </div>
                </div>
            )}
        </form>
    );
}
