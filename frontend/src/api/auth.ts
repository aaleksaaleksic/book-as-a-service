import { AxiosInstance } from "axios";
import type {
    LoginRequest,
    RegisterRequest,
    EmailVerificationRequest,
    PhoneVerificationRequest,
    RefreshTokenRequest,
    AuthResponse,
    UserResponseDTO,
    MessageResponse,
} from "./types/auth.types";

export const authApi = {
    // Login with email and password
    login: (client: AxiosInstance, data: LoginRequest) =>
        client.post<AuthResponse>("/api/v1/auth/login", data),

    // Get current user information
    me: (client: AxiosInstance) =>
        client.get<UserResponseDTO>("/api/v1/auth/me"),

    // Refresh access token
    refresh: (client: AxiosInstance, data: RefreshTokenRequest) =>
        client.post<AuthResponse>("/api/v1/auth/refresh", data),

    // Logout
    logout: (client: AxiosInstance) =>
        client.post<MessageResponse>("/api/v1/auth/logout"),
};

export const userApi = {
    // Register new user
    register: (client: AxiosInstance, data: RegisterRequest) =>
        client.post<MessageResponse>("/api/v1/users/register", data),

    // Verify email with code
    verifyEmail: (client: AxiosInstance, data: EmailVerificationRequest) =>
        client.post<MessageResponse>("/api/v1/users/verify-email", data),

    // Verify phone with code
    verifyPhone: (client: AxiosInstance, data: PhoneVerificationRequest) =>
        client.post<MessageResponse>("/api/v1/users/verify-phone", data),

    // Resend verification email
    resendEmailVerification: (client: AxiosInstance, email: string) =>
        client.post<MessageResponse>("/api/v1/users/resend-email-verification", { email }),

    // Resend phone verification
    resendPhoneVerification: (client: AxiosInstance, phoneNumber: string) =>
        client.post<MessageResponse>("/api/v1/users/resend-phone-verification", { phoneNumber }),
};