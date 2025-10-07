import { AxiosInstance } from "axios";
import type {
    BookmarkResponseDTO,
    BookmarkCreateDTO,
} from "./types/bookmarks.types";

export const bookmarksApi = {
    // Save or update bookmark
    saveBookmark: (client: AxiosInstance, data: BookmarkCreateDTO) =>
        client.post<BookmarkResponseDTO>("/api/v1/bookmarks", data),

    // Get all bookmarks for authenticated user
    getUserBookmarks: (client: AxiosInstance) =>
        client.get<BookmarkResponseDTO[]>("/api/v1/bookmarks"),

    // Get bookmark for specific book
    getBookmarkForBook: (client: AxiosInstance, bookId: number) =>
        client.get<BookmarkResponseDTO>(`/api/v1/bookmarks/book/${bookId}`),

    // Get most recent bookmark (for "Continue Reading")
    getMostRecentBookmark: (client: AxiosInstance) =>
        client.get<BookmarkResponseDTO>("/api/v1/bookmarks/recent"),

    // Delete bookmark by ID
    deleteBookmark: (client: AxiosInstance, bookmarkId: number) =>
        client.delete<void>(`/api/v1/bookmarks/${bookmarkId}`),

    // Delete bookmark by book ID
    deleteBookmarkByBookId: (client: AxiosInstance, bookId: number) =>
        client.delete<void>(`/api/v1/bookmarks/book/${bookId}`),
};
