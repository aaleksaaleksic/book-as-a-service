'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, tokenManager } from '@/lib/api-client';
import { AUTH_CONFIG, API_CONFIG } from '@/utils/constants';
import type {
    AuthContextType,
    AuthState,
    User,
    LoginRequest,
    RegisterRequest,
    Permission,
    UserRole
} from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const router = useRouter();

    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        permissions: [],
    });

    useEffect(() => {
        initializeAuth();
    }, []);

    useEffect(() => {
        const handleLogoutEvent = () => {
            logout();
        };

        window.addEventListener('auth:logout', handleLogoutEvent);
        return () => window.removeEventListener('auth:logout', handleLogoutEvent);
    }, []);

    const initializeAuth = async () => {
        try {
            const token = tokenManager.getToken();

            if (!token || tokenManager.isTokenExpired(token)) {
                setAuthState(prev => ({ ...prev, isLoading: false }));
                return;
            }

            await fetchCurrentUser();
        } catch (error) {
            console.error('Auth initialization failed:', error);
            tokenManager.clearTokens();
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                permissions: [],
            });
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get<User>(`${API_CONFIG.ENDPOINTS.AUTH}/me`);

            setAuthState({
                user: response.data,
                isAuthenticated: true,
                isLoading: false,
                permissions: response.data.permissions,
            });
        } catch (error) {
            console.error('Failed to fetch current user:', error);
            throw error;
        }
    };

    const login = async (email: string, password: string): Promise<void> => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true }));

            const loginData: LoginRequest = { email, password };
            const response = await api.post(`${API_CONFIG.ENDPOINTS.AUTH}/login`, loginData);

            const loginResponse = response.data as {
                token: string;
                refreshToken: string;
                user: User;
            };

            const { token, refreshToken, user } = loginResponse;

            tokenManager.setToken(token);
            tokenManager.setRefreshToken(refreshToken);

            setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
                permissions: user.permissions,
            });

            router.push(AUTH_CONFIG.DASHBOARD_REDIRECT);
        } catch (error) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    };

    const register = async (userData: RegisterRequest): Promise<void> => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true }));

            await api.post(`${API_CONFIG.ENDPOINTS.USERS}/register`, userData);

            setAuthState(prev => ({ ...prev, isLoading: false }));

            router.push(`/auth/verify?email=${encodeURIComponent(userData.email)}`);
        } catch (error) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    };

    const logout = useCallback(() => {
        tokenManager.clearTokens();

        setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            permissions: [],
        });

        router.push(AUTH_CONFIG.LOGIN_REDIRECT);
    }, [router]);

    const refreshUser = async (): Promise<void> => {
        if (authState.isAuthenticated) {
            await fetchCurrentUser();
        }
    };

    const refreshTokenAction = async (): Promise<boolean> => {
        try {
            await refreshUser();
            return true;
        } catch (error) {
            return false;
        }
    };

    const hasPermission = useCallback((permission: Permission): boolean => {
        return authState.permissions.includes(permission);
    }, [authState.permissions]);

    const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
        return permissions.some(permission => authState.permissions.includes(permission));
    }, [authState.permissions]);

    const hasRole = useCallback((role: UserRole): boolean => {
        return authState.user?.role === role;
    }, [authState.user?.role]);

    const contextValue: AuthContextType = {
        ...authState,
        login,
        register,
        logout,
        refreshToken: refreshTokenAction,
        refreshUser,
        hasPermission,
        hasAnyPermission,
        hasRole,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};