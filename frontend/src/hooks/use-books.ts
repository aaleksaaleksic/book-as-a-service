"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttpClient } from "@/context/HttpClientProvider";
import { booksApi } from "@/api/books";
import { toast } from "@/hooks/use-toast";
import type {
    BookSearchParams,
    CreateBookRequest,
    UpdateBookRequest,
    BookResponseDTO
} from "@/api/types/books.types";

// Query za dohvatanje svih knjiga sa opcionalnim filterom
export function useBooks(type?: 'free' | 'premium') {
    const client = useHttpClient();

    return useQuery({
        queryKey: ["books", type],
        queryFn: async () => {
            const response = await booksApi.getAllBooks(client, { type });
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minuta
    });
}

// Query za dohvatanje jedne knjige po ID-u
export function useBook(id: number) {
    const client = useHttpClient();

    return useQuery({
        queryKey: ["books", id],
        queryFn: async () => {
            const response = await booksApi.getBookById(client, id);
            return response.data;
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minuta
    });
}

// Query za pretragu knjiga
export function useBookSearch(params: BookSearchParams) {
    const client = useHttpClient();
    const searchTerm = params.q ?? params.query;

    return useQuery({
        queryKey: ["books", "search", params],
        queryFn: async () => {
            const response = await booksApi.searchBooks(client, params);
            return response.data;
        },
        enabled: !!searchTerm && searchTerm.length >= 2, // Minimum 2 karaktera
        staleTime: 2 * 60 * 1000,
    });
}

// Query za dohvatanje kategorija
export function useBookCategories() {
    const client = useHttpClient();

    return useQuery({
        queryKey: ["books", "categories"],
        queryFn: async () => {
            const response = await booksApi.getCategories(client);
            return response.data;
        },
        staleTime: 60 * 60 * 1000, // 1 sat - kategorije se retko menjaju
    });
}

// Query za popularne knjige
export function usePopularBooks() {
    const client = useHttpClient();

    return useQuery({
        queryKey: ["books", "popular"],
        queryFn: async () => {
            const response = await booksApi.getPopularBooks(client);
            return response.data;
        },
        staleTime: 30 * 60 * 1000, // 30 minuta
    });
}

// Query za najbolje ocenjene knjige
export function useTopRatedBooks() {
    const client = useHttpClient();

    return useQuery({
        queryKey: ["books", "top-rated"],
        queryFn: async () => {
            const response = await booksApi.getTopRatedBooks(client);
            return response.data;
        },
        staleTime: 30 * 60 * 1000,
    });
}

type CreateBookMutationPayload = Omit<CreateBookRequest, 'price'> & {
    price?: number;
    pdfFile?: File | null;
    coverFile?: File | null;
    promoChapterFile?: File | null;
};

export function useCreateBook() {
    const client = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateBookMutationPayload) => {
            try {
                // Step 1: Create book metadata using admin endpoint
                const bookData: CreateBookRequest = {
                    title: data.title.trim(),
                    author: data.author.trim(),
                    description: data.description.trim(),
                    isbn: data.isbn?.replace(/[\s-]/g, ""),
                    category: data.category,
                    publisher: data.publisher?.trim(),
                    pages: data.pages,
                    language: data.language,
                    price: Number(data.price ?? 0),
                    isPremium: data.isPremium,
                    isAvailable: data.isAvailable,
                };

                if (typeof data.publicationYear === "number" && !Number.isNaN(data.publicationYear)) {
                    bookData.publicationYear = data.publicationYear;
                }

                // Create the book with all files at once via admin endpoint
                const formData = new FormData();
                formData.append('book', new Blob([JSON.stringify(bookData)], { type: 'application/json' }));

                if (data.pdfFile) {
                    formData.append('pdf', data.pdfFile);
                }
                if (data.coverFile) {
                    formData.append('cover', data.coverFile);
                }
                if (data.promoChapterFile) {
                    formData.append('promoChapter', data.promoChapterFile);
                }

                const response = await client.post('/api/v1/admin/books', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                const apiResponse = response.data;

                if (!apiResponse.success || !apiResponse.book) {
                    throw new Error(apiResponse.message || 'Failed to create book');
                }

                return apiResponse.book;
            } catch (error) {
                console.error('Create book error:', error);
                throw error;
            }
        },
        onSuccess: (book) => {
            queryClient.invalidateQueries({ queryKey: ["books"] });

            toast({
                title: "Uspešno!",
                description: `Knjiga "${book?.title || 'Nova knjiga'}" je uspešno kreirana.`,
                variant: "default",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.message || error.response?.data?.message || "Neuspešno kreiranje knjige.",
                variant: "destructive",
            });
        },
    });
}

export function useUpdateBook() {
    const client = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            // Backend prima Map<String, Object> format
            const updateData: any = {};

            // Dodaj samo polja koja su promenjena
            if (data.title !== undefined) updateData.title = data.title;
            if (data.author !== undefined) updateData.author = data.author;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.category !== undefined) updateData.category = data.category;
            if (data.publisher !== undefined) updateData.publisher = data.publisher;
            if (data.pages !== undefined) updateData.pages = data.pages;
            if (data.language !== undefined) updateData.language = data.language;
            if (data.publicationYear !== undefined) updateData.publicationYear = data.publicationYear;
            if (data.price !== undefined) updateData.price = data.price;
            if (data.isPremium !== undefined) updateData.isPremium = data.isPremium;
            if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;

            const response = await client.put(`/api/v1/books/${id}`, updateData);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["books", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["books"] });

            toast({
                title: "Uspešno ažurirano!",
                description: "Knjiga je uspešno ažurirana.",
                variant: "default",
            });
        },
        onError: (error: any) => {
            console.error('Update book error:', error);
            toast({
                title: "Greška",
                description: error.response?.data?.message || "Neuspešno ažuriranje knjige.",
                variant: "destructive",
            });
        },
    });
}

// Mutation za brisanje knjige
export function useDeleteBook() {
    const client = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (bookId: number) => {
            const response = await booksApi.deleteBook(client, bookId);
            return response.data;
        },
        onSuccess: (_, bookId) => {
            // Invalidira cache nakon brisanja
            queryClient.invalidateQueries({ queryKey: ["books"] });
            queryClient.removeQueries({ queryKey: ["books", bookId] });

            toast({
                title: "Knjiga obrisana",
                description: "Knjiga je uspešno obrisana iz sistema.",
                variant: "default",
            });
        },
        onError: (error: any) => {
            console.error('Delete book error:', error);
            toast({
                title: "Greška pri brisanju",
                description: error.response?.data?.message || "Neuspešno brisanje knjige.",
                variant: "destructive",
            });
        },
    });
}

// Mutation za upload fajlova (PDF, cover, i promo chapter)
export function useUploadBookFiles() {
    const client = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
                               bookId,
                               pdfFile,
                               coverFile,
                               promoChapterFile
                           }: {
            bookId: number;
            pdfFile?: File;
            coverFile?: File;
            promoChapterFile?: File;
        }) => {
            if (!pdfFile && !coverFile && !promoChapterFile) {
                throw new Error('At least one file must be provided');
            }

            const formData = new FormData();
            formData.append('bookId', bookId.toString());
            if (pdfFile) {
                formData.append('pdf', pdfFile);
            }
            if (coverFile) {
                formData.append('cover', coverFile);
            }
            if (promoChapterFile) {
                formData.append('promoChapter', promoChapterFile);
            }

            const response = await client.post('/api/v1/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    // Možeš dodati progress tracking ovde
                    const percentCompleted = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    console.log(`Upload progress: ${percentCompleted}%`);
                },
            });

            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["books"] });

            toast({
                title: "Fajlovi uploadovani",
                description: "PDF i cover slika su uspešno uploadovani.",
                variant: "default",
            });
        },
        onError: (error: any) => {
            console.error('Upload error:', error);
            toast({
                title: "Greška pri upload-u",
                description: error.response?.data?.message || "Neuspešan upload fajlova.",
                variant: "destructive",
            });
        },
    });
}

export function useReadBook() {
    const client = useHttpClient();

    return useMutation({
        mutationFn: async (bookId: number) => {
            const response = await booksApi.readBook(client, bookId);
            return response.data;
        },
        onSuccess: (data) => {
            console.log('Reading session started:', data);
        },
        onError: (error: any) => {
            const message = error.response?.data?.message;

            if (error.response?.status === 403 || message?.includes('subscription')) {
                toast({
                    title: "Potrebna pretplata",
                    description: "Ova knjiga zahteva aktivnu pretplatu za čitanje.",
                    variant: "destructive",
                    action: {
                        label: "Pretplati se",
                        onClick: () => {
                            window.location.href = "/subscription";
                        },
                    } as any,
                });
            } else {
                toast({
                    title: "Greška",
                    description: message || "Nije moguće otvoriti knjigu.",
                    variant: "destructive",
                });
            }
        },
    });
}

export function useCanReadBook(book: BookResponseDTO | undefined) {
    const client = useHttpClient();

    // Ako je knjiga besplatna, svako može da je čita
    if (book && !book.isPremium) {
        return { canRead: true, reason: null };
    }

    // Za premium knjige, proveri da li korisnik ima pretplatu

    return {
        canRead: false,
        reason: 'Potrebna je aktivna pretplata za čitanje premium knjiga.'
    };
}

export function useBooksStatistics() {
    const client = useHttpClient();

    return useQuery({
        queryKey: ["books", "statistics"],
        queryFn: async () => {
            const response = await client.get("/api/v1/admin/analytics/books/stats");
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minuta
    });
}

// Query za knjige sa promo poglavljima (javni endpoint)
export function usePromoChapters() {
    const client = useHttpClient();

    return useQuery({
        queryKey: ["books", "promo-chapters"],
        queryFn: async () => {
            const response = await client.get("/api/v1/books/promo-chapters");
            return response.data;
        },
        staleTime: 10 * 60 * 1000, // 10 minuta
    });
}

