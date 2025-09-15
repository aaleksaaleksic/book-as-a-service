
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, AUTH_CONFIG } from '@/utils/constants';
import type { ApiResponse, ApiError } from '@/types/api';

export const apiClient: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const tokenManager = {
    getToken: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    },

    setToken: (token: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
    },

    getRefreshToken: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    },

    setRefreshToken: (token: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, token);
    },

    clearTokens: (): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    },

    isTokenExpired: (token: string): boolean => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch {
            return true;
        }
    },
};

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = tokenManager.getToken();

        if (token && !tokenManager.isTokenExpired(token)) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        console.error(' Request interceptor error:', error);
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        // Log successful response in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = tokenManager.getRefreshToken();

                if (refreshToken) {
                    const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH}/refresh`, {
                        refreshToken,
                    });

                    const { token: newToken, refreshToken: newRefreshToken } = response.data.data;

                    tokenManager.setToken(newToken);
                    tokenManager.setRefreshToken(newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                console.error(' Token refresh failed:', refreshError);


                tokenManager.clearTokens();

                window.dispatchEvent(new CustomEvent('auth:logout'));

                return Promise.reject(refreshError);
            }
        }

        const apiError: ApiError = {
            message: (error.response?.data as any)?.message || error.message || 'Network error occurred',
            status: error.response?.status || 0,
            path: error.config?.url || '',
            timestamp: new Date().toISOString(),
            errors: (error.response?.data as any)?.errors,
        };

        console.error(' API Error:', apiError);
        return Promise.reject(apiError);
    }
);

export const api = {
    // GET request
    get: async <T>(url: string): Promise<ApiResponse<T>> => {
        const response = await apiClient.get<ApiResponse<T>>(url);
        return response.data;
    },

    post: async <T, D = any>(url: string, data?: D): Promise<ApiResponse<T>> => {
        const response = await apiClient.post<ApiResponse<T>>(url, data);
        return response.data;
    },

    put: async <T, D = any>(url: string, data?: D): Promise<ApiResponse<T>> => {
        const response = await apiClient.put<ApiResponse<T>>(url, data);
        return response.data;
    },

    delete: async <T>(url: string): Promise<ApiResponse<T>> => {
        const response = await apiClient.delete<ApiResponse<T>>(url);
        return response.data;
    },

    patch: async <T, D = any>(url: string, data?: D): Promise<ApiResponse<T>> => {
        const response = await apiClient.patch<ApiResponse<T>>(url, data);
        return response.data;
    },
};

export const handleApiError = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
        return (error as ApiError).message;
    }
    return 'An unexpected error occurred';
};

export default apiClient;