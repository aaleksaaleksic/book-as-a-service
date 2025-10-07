'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, tokenManager } from '@/lib/api-client';
import { AUTH_CONFIG, API_CONFIG } from '@/utils/constants';
import { getQueryClient } from '@/context/QueryProvider';
import type {
    AuthContextType,
    AuthState,
    User,
    RegisterRequest,
    Permission,
    UserRole,
    SubscriptionStatus
} from '@/types/auth';
import type { AuthResponse, MeResponse, UserResponseDTO } from '@/api/types/auth.types';

const ADMIN_ROLE_PERMISSIONS: Permission[] = [
    'CAN_CREATE_USERS',
    'CAN_UPDATE_USERS',
    'CAN_DELETE_USERS',
    'CAN_MANAGE_PAYMENTS',
];

const MODERATOR_ROLE_PERMISSIONS: Permission[] = [
    'CAN_MODERATE_CONTENT',
    'CAN_VIEW_ANALYTICS',
];

const deriveRoleFromPermissions = (permissions: Permission[] = []): UserRole => {
    if (permissions.some(permission => ADMIN_ROLE_PERMISSIONS.includes(permission))) {
        return 'ADMIN';
    }

    if (permissions.some(permission => MODERATOR_ROLE_PERMISSIONS.includes(permission))) {
        return 'MODERATOR';
    }

    return 'USER';
};

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


    const parseUserData = (data: UserResponseDTO): User => {
        // Backend vraća Permission enume koji moraju biti konvertovani u string
        const permissions: Permission[] = data.permissions?.map(p =>
            typeof p === 'string' ? p as Permission : (p as any).toString()
        ) || [];

        const role: UserRole = data.role as UserRole || deriveRoleFromPermissions(permissions);

        const subscriptionStatus: SubscriptionStatus =
            (data.subscriptionStatus as SubscriptionStatus) || 'TRIAL';

        return {
            id: data.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber || null,
            avatarUrl: null, // Backend trenutno ne vraća avatar
            role,
            permissions,
            emailVerified: data.emailVerified || false,
            phoneVerified: data.phoneVerified || false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt || data.createdAt,
            subscriptionStatus,
            trialEndsAt: data.trialEndsAt,
        };
    };


    const fetchCurrentUser = async (): Promise<void> => {
        try {
            const response = await api.get<MeResponse>(`${API_CONFIG.ENDPOINTS.AUTH}/me`);

            if (!response.data.success || !response.data.user) {
                throw new Error('Invalid response from /me endpoint');
            }

            const user = parseUserData(response.data.user);

            setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
                permissions: user.permissions || [],
            });
        } catch (error) {
            console.error('Failed to fetch current user:', error);

            // Ako je 401 greška, očisti tokene
            if ((error as any)?.response?.status === 401) {
                tokenManager.clearTokens();
            }

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

            // Ako nema tokena ili je istekao, postavi loading na false
            if (!token || tokenManager.isTokenExpired(token)) {
                setAuthState(prev => ({ ...prev, isLoading: false }));
                return;
            }

            // Učitaj korisnika sa backend-a
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

    // Inicijalizuj auth pri mount-u
    useEffect(() => {
        initializeAuth();
    }, []);

    // Slušaj logout event
    useEffect(() => {
        const handleLogoutEvent = () => {
            logout();
        };

        window.addEventListener('auth:logout', handleLogoutEvent);
        return () => window.removeEventListener('auth:logout', handleLogoutEvent);
    }, []);

    /**
     * Login funkcija - prima email i lozinku, vraća Promise<void>
     */
    const login = async (email: string, password: string): Promise<void> => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true }));

            const response = await api.post<AuthResponse>(`${API_CONFIG.ENDPOINTS.AUTH}/login`, {
                email,
                password,
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Login failed');
            }

            const { token, refreshToken, user } = response.data;

            // Sačuvaj tokene
            tokenManager.setToken(token);
            tokenManager.setRefreshToken(refreshToken);

            // Parsiraj i postavi korisnika
            const parsedUser = parseUserData(user);

            setAuthState({
                user: parsedUser,
                isAuthenticated: true,
                isLoading: false,
                permissions: parsedUser.permissions || [],
            });

            // Navigiraj na landing stranu
            router.push(AUTH_CONFIG.LANDING_REDIRECT);
        } catch (error) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
            throw error; // Propagiraj grešku da je useLogin hook može uhvatiti
        }
    };

    /**
     * Registracija novog korisnika
     */
    const register = async (userData: RegisterRequest): Promise<void> => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true }));

            await api.post(`${API_CONFIG.ENDPOINTS.USERS}/register`, userData);

            setAuthState(prev => ({ ...prev, isLoading: false }));

            // Prebaci na stranicu za verifikaciju email-a
            router.push(`/auth/verify-email?email=${encodeURIComponent(userData.email)}`);
        } catch (error) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    };

    /**
     * Logout funkcija - briše tokene i resetuje state
     */
    const logout = useCallback(() => {
        tokenManager.clearTokens();

        // Clear React Query cache
        const queryClient = getQueryClient();
        queryClient.clear();

        setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            permissions: [],
        });

        router.push(AUTH_CONFIG.LOGIN_REDIRECT);
    }, [router]);

    /**
     * Refresh user - ponovo učitava korisničke podatke
     */
    const refreshUser = async (): Promise<void> => {
        const token = tokenManager.getToken();

        if (token && !tokenManager.isTokenExpired(token)) {
            await fetchCurrentUser();
        } else if (authState.isAuthenticated) {
            // Ako je korisnik autentifikovan ali token je istekao, pokušaj refresh
            await refreshTokenAction();
        }
    };

    /**
     * Refresh token - obnavlja access token koristeći refresh token
     */
    const refreshTokenAction = async (): Promise<boolean> => {
        try {
            const refreshToken = tokenManager.getRefreshToken();
            if (!refreshToken) return false;

            const response = await api.post<AuthResponse>(`${API_CONFIG.ENDPOINTS.AUTH}/refresh`, {
                refreshToken,
            });

            if (!response.data.success) {
                throw new Error('Token refresh failed');
            }

            const { token, refreshToken: newRefreshToken } = response.data;

            tokenManager.setToken(token);
            tokenManager.setRefreshToken(newRefreshToken);

            // Učitaj ponovo korisničke podatke
            await fetchCurrentUser();
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
            return false;
        }
    };

    /**
     * Helper funkcije za proveru permisija i uloga
     */
    const hasPermission = useCallback((permission: Permission): boolean => {
        return authState.permissions.includes(permission);
    }, [authState.permissions]);

    const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
        return permissions.some(permission => authState.permissions.includes(permission));
    }, [authState.permissions]);

    const hasRole = useCallback((role: UserRole): boolean => {
        return authState.user?.role === role;
    }, [authState.user?.role]);

    // Context value koji se prosleđuje svim child komponentama
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