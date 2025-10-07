// API CONFIGURATION


export const API_CONFIG = {
    // Base URL
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    VERSION: 'v1',
    ENDPOINTS: {
        AUTH: '/api/v1/auth',
        USERS: '/api/v1/users',
        BOOKS: '/api/v1/books',
        SUBSCRIPTIONS: '/api/v1/subscriptions',
        PAYMENTS: '/api/v1/payments',
        READING: '/api/v1/reading',
    },

    TIMEOUT: 10000,
} as const;


// AUTHENTICATION CONSTANTS

export const AUTH_CONFIG = {
    // JWT token storage key
    TOKEN_KEY: 'readbookhub_auth_token',
    REFRESH_TOKEN_KEY: 'readbookhub_refresh_token',

    REFRESH_BUFFER_MS: 5 * 60 * 1000,

    LOGIN_REDIRECT: '/auth/login',
    LANDING_REDIRECT: '/',

    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIREMENTS: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
    },
} as const;

// BUSINESS RULES CONSTANTS

export const BUSINESS_RULES = {
    SUBSCRIPTION_PRICES: {
        MONTHLY_RSD: 600_00, // 600 dinara
        YEARLY_RSD: 6000_00, // 6000 dinara
    },

    MAX_BOOKMARKS_PER_BOOK: 50,
    MAX_NOTES_PER_BOOK: 100,
    MAX_CONCURRENT_READING_SESSIONS: 3,

    PREVIEW_PAGES_FOR_NON_SUBSCRIBERS: 5,
    MAX_BOOKS_IN_LIBRARY: 1000,

    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    SEARCH_MIN_QUERY_LENGTH: 2,
    SEARCH_DEBOUNCE_MS: 300,
} as const;

// UI/UX CONSTANTS

export const UI_CONFIG = {
    BREAKPOINTS: {
        XS: 475,
        SM: 640,
        MD: 768,
        LG: 1024,
        XL: 1280,
        '2XL': 1536,
    },

    ANIMATION: {
        FAST: 150,
        NORMAL: 300,
        SLOW: 500,
    },

    TOAST: {
        DEFAULT_DURATION: 4000,
        ERROR_DURATION: 6000,
        SUCCESS_DURATION: 3000,
    },

    LOADING: {
        SKELETON_ITEMS: 8,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
    },
} as const;


// READING EXPERIENCE CONSTANTS

export const READING_CONFIG = {
    COLOR_TEMPERATURE: {
        MIN: 1900,
        MAX: 6500,
        DEFAULT: 5500,
        PRESETS: {
            NIGHT: 2200,     // Very warm for night reading
            EVENING: 3000,   // Warm for evening
            DAY: 5500,       // Neutral for day reading
            BRIGHT: 6500,    // Cool for bright conditions
        },
    },

    AUTO_SCHEDULE: [
        { timeFrom: '06:00', timeTo: '12:00', temperature: 6200 }, // Morning - energizing
        { timeFrom: '12:00', timeTo: '18:00', temperature: 5500 }, // Afternoon - optimal
        { timeFrom: '18:00', timeTo: '22:00', temperature: 3500 }, // Evening - transition
        { timeFrom: '22:00', timeTo: '06:00', temperature: 2200 }, // Night - sleep-friendly
    ],

    FONT_SIZES: {
        SMALL: 14,
        MEDIUM: 18,
        LARGE: 22,
        EXTRA_LARGE: 26,
    },

    TRACKING: {
        SESSION_PING_INTERVAL: 30000, // 30
        PROGRESS_SAVE_INTERVAL: 10000, // 10
        ANALYTICS_BATCH_SIZE: 50,
    },
} as const;


// VALIDATION CONSTANTS


export const VALIDATION = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    PHONE_REGEX: /^(\+381|0)[6-9][0-9]{7,8}$/,

    LENGTHS: {
        NAME_MIN: 2,
        NAME_MAX: 50,
        EMAIL_MAX: 100,
        NOTE_MAX: 1000,
        SEARCH_QUERY_MAX: 100,
    },

    FILE_UPLOAD: {
        MAX_SIZE_MB: 10,
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    },
} as const;


// ERROR MESSAGES

export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Problema sa mrežom. Molimo pokušajte ponovo.',
    TIMEOUT_ERROR: 'Zahtev je istekao. Molimo pokušajte ponovo.',
    SERVER_ERROR: 'Greška na serveru. Molimo kontaktirajte podršku.',

    INVALID_CREDENTIALS: 'Neispravni podaci za prijavu.',
    EMAIL_NOT_VERIFIED: 'Email adresa nije potvrđena.',
    ACCOUNT_LOCKED: 'Nalog je zaključan. Kontaktirajte podršku.',

    SUBSCRIPTION_REQUIRED: 'Potrebna je aktivna pretplata za pristup ovom sadržaju.',
    PAYMENT_FAILED: 'Plaćanje nije uspešno. Molimo pokušajte ponovo.',

    REQUIRED_FIELD: 'Ovo polje je obavezno.',
    INVALID_EMAIL: 'Unesite ispravnu email adresu.',
    PASSWORD_TOO_SHORT: `Lozinka mora imati najmanje ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} karaktera.`,
    PASSWORDS_DONT_MATCH: 'Lozinke se ne poklapaju.',
} as const;

// SUCCESS MESSAGES

export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Uspešna prijava!',
    REGISTRATION_SUCCESS: 'Nalog je uspešno kreiran. Proverite email za potvrdu.',
    EMAIL_VERIFIED: 'Email adresa je uspešno potvrđena.',
    PROFILE_UPDATED: 'Profil je uspešno ažuriran.',
    SUBSCRIPTION_ACTIVATED: 'Pretplata je uspešno aktivirana!',
    PAYMENT_SUCCESS: 'Plaćanje je uspešno završeno.',
    BOOKMARK_ADDED: 'Stranica je dodana u obeležavače.',
    NOTE_SAVED: 'Beleška je sačuvana.',
} as const;