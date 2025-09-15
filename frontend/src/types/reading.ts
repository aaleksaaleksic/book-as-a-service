export interface ReadingSession {
    id: number;
    userId: number;
    bookId: number;
    sessionStart: string;
    sessionEnd?: string;
    durationMinutes: number;
    pagesRead: number;
    lastPagePosition: number;
    deviceType: DeviceType;
    sessionActive: boolean;
    ipAddress?: string;
    createdAt: string;
}

export type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP';

export interface ActiveReadingSession {
    sessionId: number;
    bookId: number;
    currentPage: number;
    startedAt: string;
    lastActivity: string;
}



export interface ReadingProgress {
    id: number;
    userId: number;
    bookId: number;
    currentPage: number;
    totalPages: number;
    percentageComplete: number;
    lastReadAt: string;
    estimatedTimeRemaining: number;
    bookmarkedPages: number[];
    notes: ReadingNote[];
    readingSpeed: number;
}

export interface ReadingNote {
    id: number;
    userId: number;
    bookId: number;
    pageNumber: number;
    content: string;
    highlightedText?: string;
    noteType: NoteType;
    createdAt: string;
    updatedAt: string;
}

export type NoteType = 'NOTE' | 'HIGHLIGHT' | 'BOOKMARK' | 'QUESTION';

export interface ReadingBookmark {
    id: number;
    userId: number;
    bookId: number;
    pageNumber: number;
    chapterTitle: string;
    excerpt: string;
    createdAt: string;
    label?: string;
}



export interface ReadingPreferences {
    fontSize: number;
    fontFamily: FontFamily;
    lineHeight: number;
    backgroundColor: string;
    textColor: string;
    pageWidth: number;
    circadianSettings: CircadianSettings;
    autoScrollEnabled: boolean;
    nightModeEnabled: boolean;
}

export type FontFamily =
    | 'georgia'
    | 'times'
    | 'arial'
    | 'helvetica'
    | 'verdana'
    | 'openDyslexic';

export interface CircadianSettings {
    autoMode: boolean;
    manualTemperature: number;
    customSchedule?: CircadianSchedule[];
    geolocationEnabled: boolean;
    smoothTransitions: boolean;
}

export interface CircadianSchedule {
    timeFrom: string; // HH:mm format
    timeTo: string;
    temperature: number;
    description: string;
}


export interface UserReadingStats {
    totalBooksRead: number;
    totalReadingTime: number;
    averageReadingSpeed: number;
    favoriteGenres: string[];
    readingStreak: number; // consecutive days
    weeklyGoal: number; // minutes per week
    weeklyProgress: number; // minutes read this week
    monthlyStats: MonthlyReadingStats[];
}

export interface MonthlyReadingStats {
    month: string; // YYYY-MM format
    booksCompleted: number;
    totalMinutes: number;
    averageRating: number;
    topGenres: string[];
}

export interface ReadingGoal {
    id: number;
    userId: number;
    goalType: GoalType;
    targetValue: number;
    currentValue: number;
    timeFrame: TimeFrame;
    startDate: string;
    endDate: string;
    achieved: boolean;
}

export type GoalType =
    | 'BOOKS_COUNT'
    | 'READING_TIME'
    | 'PAGES_COUNT'
    | 'STREAK_DAYS';

export type TimeFrame =
    | 'WEEKLY'
    | 'MONTHLY'
    | 'QUARTERLY'
    | 'YEARLY';

// READING ANALYTICS TYPES

export interface ReadingAnalytics {
    sessionDuration: number;
    pagesRead: number;
    readingSpeed: number;
    pauseCount: number;
    scrollBehavior: ScrollBehavior;
    deviceType: DeviceType;
    timeOfDay: string;
    environmentalFactors?: EnvironmentalFactors;
}

export interface ScrollBehavior {
    averageScrollSpeed: number;
    backScrollCount: number;
    jumpScrollCount: number;
    totalScrollDistance: number;
}

export interface EnvironmentalFactors {
    colorTemperature: number;
    brightness: number;
    fontSize: number;
    backgroundType: 'light' | 'dark' | 'sepia';
}