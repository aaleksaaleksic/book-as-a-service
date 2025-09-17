'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, tokenManager } from '@/lib/api-client';
import { extractUserPayload } from '@/api/auth';
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
import type { MeResponse } from '@/api/types/auth.types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

    // Funkcija za parsiranje korisničkih podataka
    const parseUserData = (data: any): User => {
        // Backend vraća korisnika unutar user objekta, ali zadržavamo kompatibilnost
        const userData = data?.data ?? data;

        return {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber || userData.phone || null,
            avatarUrl: userData.avatarUrl || userData.profileImageUrl || userData.avatar || null,
            role: userData.role as UserRole,
            permissions: userData.permissions || [],
            emailVerified: userData.emailVerified || false,
            phoneVerified: userData.phoneVerified || false,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
            subscriptionStatus: userData.subscriptionStatus || 'TRIAL',
            trialEndsAt: userData.trialEndsAt,
        };
    };

    const fetchCurrentUser = async (): Promise<void> => {
        try {
            const response = await api.get<MeResponse>(`${API_CONFIG.ENDPOINTS.AUTH}/me`);
            const rawUserData = extractUserPayload(response.data) ?? response.data;
            const user = parseUserData(rawUserData);

            setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
                permissions: user.permissions || [],
            });
        } catch (error) {
            console.error('Failed to fetch user:', error);
            tokenManager.clearTokens();
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                permissions: [],
            });
        }
    };

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

    const login = async (email: string, password: string): Promise<void> => {
        try {
            const response = await api.post(`${API_CONFIG.ENDPOINTS.AUTH}/login`, {
                email,
                password,
            });

            const { token, refreshToken, user } = response.data;

            tokenManager.setToken(token);
            tokenManager.setRefreshToken(refreshToken);

            const parsedUser = parseUserData(extractUserPayload(user) ?? user);

            setAuthState({
                user: parsedUser,
                isAuthenticated: true,
                isLoading: false,
                permissions: parsedUser.permissions || [],
            });

            router.push(AUTH_CONFIG.LANDING_REDIRECT);
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

            router.push(`/auth/verify-email?email=${encodeURIComponent(userData.email)}`);
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
        if (authState.isAuthenticated || tokenManager.getToken()) {
            await fetchCurrentUser();
        }
    };

    const refreshTokenAction = async (): Promise<boolean> => {
        try {
            const refreshToken = tokenManager.getRefreshToken();
            if (!refreshToken) return false;

            const response = await api.post(`${API_CONFIG.ENDPOINTS.AUTH}/refresh`, {
                refreshToken,
            });

            const { token, refreshToken: newRefreshToken } = response.data;

            tokenManager.setToken(token);
            tokenManager.setRefreshToken(newRefreshToken);

            await fetchCurrentUser();
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
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