import { AxiosInstance } from "axios";
import type {
    BookResponseDTO,
    CreateBookRequest,
    UpdateBookRequest,
    BookSearchParams,
    ApiResponse,
} from "./types/books.types";

export const booksApi = {
    // Javni endpoint
    getAllBooks: (client: AxiosInstance, params?: { type?: 'free' | 'premium' }) =>
        client.get<BookResponseDTO[]>("/api/v1/books", { params }),

    // Javni endpoint
    getBookById: (client: AxiosInstance, id: number) =>
        client.get<BookResponseDTO>(`/api/v1/books/${id}`),

    // Javni endpoint
    searchBooks: (client: AxiosInstance, params: BookSearchParams) =>
        client.get<BookResponseDTO[]>("/api/v1/books/search", { params }),

    // Javni endpoint
    getCategories: (client: AxiosInstance) =>
        client.get<string[]>("/api/v1/books/categories"),

    // Javni endpoint
    getPopularBooks: (client: AxiosInstance) =>
        client.get<BookResponseDTO[]>("/api/v1/books/popular"),

    // Javni endpoint
    getTopRatedBooks: (client: AxiosInstance) =>
        client.get<BookResponseDTO[]>("/api/v1/books/top-rated"),

    // Zaštićeni endpoint
    readBook: (client: AxiosInstance, id: number) =>
        client.get<ApiResponse<any>>(`/api/v1/books/${id}/read`),

    // Admin endpoint
    createBook: (client: AxiosInstance, data: CreateBookRequest) =>
        client.post<ApiResponse<BookResponseDTO>>("/api/v1/books", data),

    // Admin endpoint
    updateBook: (client: AxiosInstance, id: number, data: UpdateBookRequest) =>
        client.put<ApiResponse<BookResponseDTO>>(`/api/v1/books/${id}`, data),

    // Admin endpoint
    deleteBook: (client: AxiosInstance, id: number) =>
        client.delete<ApiResponse<void>>(`/api/v1/books/${id}`),
};