
// API RESPONSE TYPES


export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface ApiError {
    message: string;
    status: number;
    path: string;
    timestamp: string;
    errors?: Record<string, string[]>; // Validation errors
    errorCode?: string;
    details?: Record<string, any>;
}

export interface ValidationError {
    field: string;
    message: string;
    rejectedValue?: any;
}


// COMMON REQUEST TYPES


export interface PaginationParams {
    page?: number;
    size?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
    query?: string;
    filters?: Record<string, any>;
}

export interface DateRangeParams {
    startDate?: string;
    endDate?: string;
}


// HTTP CLIENT TYPES

export interface RequestConfig {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    abortSignal?: AbortSignal;
    headers?: Record<string, string>;
}

export interface ApiClientConfig {
    baseURL: string;
    timeout: number;
    retries: number;
    authTokenKey: string;
    refreshTokenKey: string;
}

// REACT QUERY TYPES

export interface QueryConfig {
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
    retry?: number | boolean;
    enabled?: boolean;
}

export interface MutationConfig {
    onSuccess?: (data: any) => void;
    onError?: (error: ApiError) => void;
    onSettled?: () => void;
}

// LOADING AND ERROR STATE TYPES

export interface LoadingState {
    isLoading: boolean;
    error: string | null;
    lastUpdated?: string;
}

export interface AsyncState<T> extends LoadingState {
    data: T | null;
}

export interface FormState extends LoadingState {
    isSubmitting: boolean;
    isDirty: boolean;
    touchedFields: Record<string, boolean>;
    errors: Record<string, string>;
}

// ANALYTICS AND TRACKING TYPES

export interface AnalyticsEvent {
    eventName: string;
    properties: Record<string, any>;
    userId?: number;
    sessionId?: string;
    timestamp: string;
    deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    platform: string;
    browserName: string;
}

export interface PerformanceMetrics {
    pageLoadTime: number;
    apiResponseTime: number;
    renderTime: number;
    memoryUsage?: number;
    errorCount: number;
}

// UTILITY TYPES

// Make all properties optional
export type Partial<T> = {
    [P in keyof T]?: T[P];
};

// Make specific properties required
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Exclude specific properties
export type OmitFields<T, K extends keyof T> = Omit<T, K>;

// Pick specific properties and make them required
export type PickRequired<T, K extends keyof T> = Required<Pick<T, K>>;

// Convert all properties to strings
export type Stringify<T> = {
    [K in keyof T]: string;
};

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};


// FORM AND VALIDATION TYPES


export interface FormFieldError {
    message: string;
    type: 'required' | 'pattern' | 'min' | 'max' | 'custom';
}

export interface FormValidationRule {
    required?: boolean;
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => boolean | string;
}

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox';
    placeholder?: string;
    defaultValue?: any;
    options?: FormSelectOption[];
    validation?: FormValidationRule;
    disabled?: boolean;
}

export interface FormSelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    duration?: number;
    actions?: NotificationAction[];
    persistent?: boolean;
    timestamp: string;
}

export type NotificationType =
    | 'success'
    | 'error'
    | 'warning'
    | 'info';

export interface NotificationAction {
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
}