export interface BookResponseDTO {
    id: number;
    title: string;
    author: string;
    description: string;
    isbn?: string;
    category: string;
    pages: number;
    language: string;
    publicationYear?: number;
    coverImageUrl?: string;
    contentUrl?: string;
    price: number;
    isPremium: boolean;
    isAvailable: boolean;
    averageRating: number;
    totalRatings: number;
    readCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBookRequest {
    title: string;
    author: string;
    description: string;
    isbn?: string;
    category: string;
    pages: number;
    language: string;
    publicationYear?: number;
    price: number;
    isPremium: boolean;
    isAvailable: boolean;
}

export interface UpdateBookRequest extends Partial<CreateBookRequest> {
    isAvailable?: boolean;
}

export interface BookSearchParams {
    query?: string;
    q?: string;
    category?: string;
    author?: string;
    type?: 'free' | 'premium';
    page?: number;
    size?: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}