
export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    role: UserRole;
    permissions: Permission[];
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: string;
    updatedAt: string;
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt?: string;
}

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export type Permission =
// User Management
    | 'CAN_CREATE_USERS'
    | 'CAN_READ_USERS'
    | 'CAN_UPDATE_USERS'
    | 'CAN_DELETE_USERS'
    // Book Management
    | 'CAN_CREATE_BOOKS'
    | 'CAN_READ_BOOKS'
    | 'CAN_UPDATE_BOOKS'
    | 'CAN_DELETE_BOOKS'
    // Subscription Management
    | 'CAN_SUBSCRIBE'
    | 'CAN_VIEW_SUBSCRIPTION'
    | 'CAN_CANCEL_SUBSCRIPTION'
    // Reading Permissions
    | 'CAN_READ_PREMIUM_BOOKS'
    | 'CAN_DOWNLOAD_BOOKS'
    // Admin Permissions
    | 'CAN_VIEW_ANALYTICS'
    | 'CAN_MANAGE_PAYMENTS'
    | 'CAN_MODERATE_CONTENT';

export type SubscriptionStatus =
    | 'ACTIVE'
    | 'PENDING'
    | 'EXPIRED'
    | 'CANCELED'
    | 'TRIAL'
    | 'SUSPENDED'
    | 'PAYMENT_FAILED';


// AUTH REQUEST/RESPONSE TYPES

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    user: User;
    expiresIn: number;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface EmailVerificationRequest {
    email: string;
    code: string;
}

export interface PhoneVerificationRequest {
    phoneNumber: string;
    verificationCode: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

// AUTH CONTEXT TYPES

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    permissions: Permission[];
}

export interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (userData: RegisterRequest) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
    hasPermission: (permission: Permission) => boolean;
    hasAnyPermission: (permissions: Permission[]) => boolean;
    hasRole: (role: UserRole) => boolean;
}