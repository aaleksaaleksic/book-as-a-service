
export * from './auth';
export * from './books';
export * from './reading';
export * from './api';




import type { User, SubscriptionStatus } from './auth';
import type { Book, BookSummary } from './books';
import type { ReadingProgress, ReadingSession } from './reading';
import type { Subscription, SubscriptionType } from './subscription';

export interface UserDashboardData {
    user: User;
    subscription: Subscription;
    currentlyReading: Array<{
        book: BookSummary;
        progress: ReadingProgress;
    }>;
    recentSessions: ReadingSession[];
    recommendedBooks: BookSummary[];
}

export interface BookWithProgress extends Book {
    userProgress?: ReadingProgress;
    userSession?: ReadingSession;
    inUserLibrary: boolean;
    userRating?: number;
}


// APP-WIDE ENUMS (if needed)


export enum LoadingStateEnum {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCESS = 'success',
    ERROR = 'error',
}

export enum ThemeEnum {
    LIGHT = 'light',
    DARK = 'dark',
    SEPIA = 'sepia',
    AUTO = 'auto',
}