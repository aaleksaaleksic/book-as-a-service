
// BOOK TYPES

export interface Book {
    id: number;
    title: string;
    author: string;
    description: string;
    coverImageUrl: string;
    category: BookCategory;
    publishedAt: string;
    pageCount: number;
    readingTimeMinutes: number;
    featured: boolean;
    popular: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BookSummary {
    id: number;
    title: string;
    author: string;
    coverImageUrl: string;
    category: string;
    readingTimeMinutes: number;
}

export interface BookDetails extends Book {
    content: BookContent[];
    reviews: BookReview[];
    relatedBooks: BookSummary[];
    statistics: BookStatistics;
}

export interface BookCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    bookCount: number;
    coverImageUrl?: string;
}

export interface BookContent {
    id: number;
    bookId: number;
    chapterNumber: number;
    chapterTitle: string;
    content: string; // HTML or markdown content
    wordCount: number;
    estimatedReadingMinutes: number;
}

export interface BookReview {
    id: number;
    userId: number;
    userName: string;
    bookId: number;
    comment?: string;
    createdAt: string;
    helpful: number;
}

export interface BookStatistics {
    totalReads: number;
    totalReviews: number;
    averageReadingTime: number;
    completionRate: number;
}


// SEARCH AND FILTERING TYPES


export interface BookSearchParams {
    q?: string;
    query?: string;
    category?: string;
    author?: string;
    sortBy?: BookSortOption;
    sortDirection?: SortDirection;
    page?: number;
    size?: number;
    featured?: boolean;
    popular?: boolean;
}

export type BookSortOption =
    | 'title'
    | 'author'
    | 'publishedAt'
    | 'readingTime'
    | 'popularity';

export type SortDirection = 'asc' | 'desc';

export interface BookSearchFilters {
    categories: BookCategory[];
    authors: string[];
    readingTimeRanges: ReadingTimeRange[];
}

export interface ReadingTimeRange {
    label: string;
    minMinutes: number;
    maxMinutes: number;
}


// BOOK MANAGEMENT TYPES (Admin/Moderator)

export interface CreateBookRequest {
    title: string;
    author: string;
    description: string;
    category: string; // Backend uses String
    coverImageUrl: string;
    publishedAt: string;
    featured?: boolean;
    popular?: boolean;
}

export interface UpdateBookRequest extends Partial<CreateBookRequest> {
    id: number;
}

export interface UploadBookContentRequest {
    bookId: number;
    chapters: BookContentChapter[];
}

export interface BookContentChapter {
    chapterNumber: number;
    chapterTitle: string;
    content: string;
}


// BOOK INTERACTION TYPES

export interface BookInteraction {
    bookId: number;
    userId: number;
    interactionType: BookInteractionType;
    timestamp: string;
    metadata?: Record<string, any>;
}

export type BookInteractionType =
    | 'VIEW'
    | 'CLICK'
    | 'START_READING'
    | 'FINISH_READING'
    | 'BOOKMARK'
    | 'REVIEW'
    | 'SHARE';