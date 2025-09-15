export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
}

export interface EmailVerificationRequest {
    email: string;
    code: string;
}

export interface PhoneVerificationRequest {
    phoneNumber: string;
    code: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token: string;
    refreshToken: string;
    user: UserResponseDTO;
    expiresIn: number;
}

export interface UserResponseDTO {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role: string;
    permissions: string[];
    emailVerified: boolean;
    phoneVerified: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    subscriptionStatus?: string;
    trialEndsAt?: string;
}

export interface MessageResponse {
    success: boolean;
    message: string;
}