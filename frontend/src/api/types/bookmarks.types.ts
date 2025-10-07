export interface BookmarkResponseDTO {
    id: number;
    userId: number;
    bookId: number;
    bookTitle: string;
    bookAuthor: string;
    bookCoverImageUrl: string | null;
    pageNumber: number;
    createdAt: string;
    updatedAt: string;
}

export interface BookmarkCreateDTO {
    bookId: number;
    pageNumber: number;
}

export interface BookmarkApiResponse<T = unknown> {
    data: T;
    message?: string;
    success: boolean;
}
