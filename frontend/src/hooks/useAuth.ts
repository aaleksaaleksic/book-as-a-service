import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return {
        user: context.user,
        isAuthenticated: context.isAuthenticated,
        isLoading: context.isLoading,
        login: context.login,
        register: context.register,
        logout: context.logout,
        refreshUser: context.refreshUser,
        refreshToken: context.refreshToken,
        hasPermission: context.hasPermission,
        hasAnyPermission: context.hasAnyPermission,
        hasRole: context.hasRole,
    };
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }

    return context;
};

export const useCan = () => {
    const { hasPermission, hasAnyPermission, hasRole, user } = useAuth();

    return {
        can: hasPermission,
        canAny: hasAnyPermission,
        isAdmin: () => hasRole('ADMIN'),
        isModerator: () => hasRole('MODERATOR'),
        isUser: () => hasRole('USER'),
        canReadBooks: () => hasPermission('CAN_READ_BOOKS'),
        canManageBooks: () => hasAnyPermission(['CAN_CREATE_BOOKS', 'CAN_UPDATE_BOOKS', 'CAN_DELETE_BOOKS']),
        canManageUsers: () => hasAnyPermission(['CAN_CREATE_USERS', 'CAN_UPDATE_USERS', 'CAN_DELETE_USERS']),
        canViewAnalytics: () => hasPermission('CAN_VIEW_ANALYTICS'),
        currentUser: user,
        userId: user?.id,
        userRole: user?.role,
    };
};

export const useSubscription = () => {
    const { user, hasPermission } = useAuth();

    const subscriptionStatus = user?.subscriptionStatus;
    const isActive = subscriptionStatus === 'ACTIVE';
    const isTrial = subscriptionStatus === 'TRIAL';

    const canReadBooks =
        isActive ||
        isTrial ||
        hasPermission('CAN_READ_BOOKS') ||
        hasPermission('CAN_READ_PREMIUM_BOOKS');

    return {
        canReadBooks,
        needsSubscription: !canReadBooks,
        isActive,
        isTrial,
    };
};
