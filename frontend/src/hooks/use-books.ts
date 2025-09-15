"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttpClient } from "@/context/HttpClientProvider";
import { booksApi } from "@/api/books";
import { toast } from "@/hooks/use-toast";
import type { BookSearchParams, CreateBookRequest, UpdateBookRequest } from "@/api/types/books.types";

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

export function useBook(id: number) {
    const client = useHttpClient();

    return useQuery({
        queryKey: ["books", id],
        queryFn: async () => {
            const response = await booksApi.getBookById(client, id);
            return response.data;
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useBookSearch(params: BookSearchParams) {
    const client = useHttpClient();

    return useQuery({
        queryKey: ["books", "search", params],
        queryFn: async () => {
            const response = await booksApi.searchBooks(client, params);
            return response.data;
        },
        enabled: !!params.query && params.query.length >= 2, // Min 2 karaktera
        staleTime: 2 * 60 * 1000,
    });
}

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

export function useCreateBook() {
    const client = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateBookRequest) => booksApi.createBook(client, data),
        onSuccess: () => {
            // Invalidira cache za sve knjige
            queryClient.invalidateQueries({ queryKey: ["books"] });
            toast({
                title: "Uspešno!",
                description: "Knjiga je uspešno kreirana.",
                variant: "default",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.response?.data?.message || "Neuspešno kreiranje knjige.",
                variant: "destructive",
            });
        },
    });
}

export function useUpdateBook() {
    const client = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateBookRequest }) =>
            booksApi.updateBook(client, id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["books", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["books"] });
            toast({
                title: "Uspešno!",
                description: "Knjiga je uspešno ažurirana.",
                variant: "default",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.response?.data?.message || "Neuspešno ažuriranje knjige.",
                variant: "destructive",
            });
        },
    });
}