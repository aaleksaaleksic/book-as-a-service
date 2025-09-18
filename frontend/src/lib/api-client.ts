import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, AUTH_CONFIG } from '@/utils/constants';

class TokenManager {
    private token: string | null = null;
    private refreshToken: string | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
            this.refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

            // Ensure middleware cookie exists when the app loads with a persisted token
            if (this.token) {
                this.setAuthCookie(this.token);
            }
        }
    }

    setToken(token: string): void {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
            this.setAuthCookie(token);
        }
    }

    setRefreshToken(refreshToken: string): void {
        this.refreshToken = refreshToken;
        if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
        }
    }

    getToken(): string | null {
        if (typeof window !== 'undefined' && !this.token) {
            this.token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
            if (this.token) {
                this.setAuthCookie(this.token);
            }
        }
        return this.token;
    }

    getRefreshToken(): string | null {
        if (typeof window !== 'undefined' && !this.refreshToken) {
            this.refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        }
        return this.refreshToken;
    }

    clearTokens(): void {
        this.token = null;
        this.refreshToken = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
            localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
            this.deleteAuthCookie();
        }
    }

    isTokenExpired(token: string): boolean {
        try {
            const payload = this.decodeToken(token);
            if (!payload?.exp) {
                return true;
            }
            const exp = payload.exp * 1000;
            return Date.now() >= exp - AUTH_CONFIG.REFRESH_BUFFER_MS;
        } catch {
            return true;
        }
    }

    private decodeToken(token: string): { exp?: number } | null {
        try {
            const payload = token.split('.')[1];
            if (!payload) {
                return null;
            }
            return JSON.parse(atob(payload));
        } catch {
            return null;
        }
    }

    private setAuthCookie(token: string): void {
        if (typeof document === 'undefined') {
            return;
        }

        const payload = this.decodeToken(token);
        let expires = '';

        if (payload?.exp) {
            const expiryDate = new Date(payload.exp * 1000);
            expires = `; expires=${expiryDate.toUTCString()}`;
        }

        document.cookie = `${AUTH_CONFIG.TOKEN_KEY}=${token}; path=/; SameSite=Lax${expires}`;
    }

    private deleteAuthCookie(): void {
        if (typeof document === 'undefined') {
            return;
        }

        document.cookie = `${AUTH_CONFIG.TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
}

export const tokenManager = new TokenManager();

const createApiClient = (): AxiosInstance => {
    const client = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        timeout: API_CONFIG.TIMEOUT,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor
    client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = tokenManager.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error: AxiosError) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor
    client.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as any;

            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    const refreshToken = tokenManager.getRefreshToken();
                    if (!refreshToken) {
                        throw new Error('No refresh token');
                    }

                    const response = await axios.post(
                        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH}/refresh`,
                        { refreshToken }
                    );

                    const { token, refreshToken: newRefreshToken } = response.data;

                    tokenManager.setToken(token);
                    tokenManager.setRefreshToken(newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return client(originalRequest);
                } catch (refreshError) {
                    tokenManager.clearTokens();
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('auth:logout'));
                    }
                    return Promise.reject(refreshError);
                }
            }

            return Promise.reject(error);
        }
    );

    return client;
};

export const api = createApiClient();