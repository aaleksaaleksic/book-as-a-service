
import { useAuthContext } from '@/contexts/AuthContext';


export const useAuth = () => {
    const context = useAuthContext();

    return {
        user: context.user,
        isAuthenticated: context.isAuthenticated,
        isLoading: context.isLoading,

        login: context.login,
        register: context.register,
        logout: context.logout,
        refreshUser: context.refreshToken,

        hasPermission: context.hasPermission,
        hasAnyPermission: context.hasAnyPermission,
        hasRole: context.hasRole,
    };
};


export const useCan = () => {
    const { hasPermission, hasAnyPermission, hasRole, user } = useAuthContext();

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
        canManagePayments: () => hasPermission('CAN_MANAGE_PAYMENTS'),

        canSubscribe: () => hasPermission('CAN_SUBSCRIBE'),
        canViewSubscription: () => hasPermission('CAN_VIEW_SUBSCRIPTION'),
        canCancelSubscription: () => hasPermission('CAN_CANCEL_SUBSCRIPTION'),

        currentUser: user,
        userId: user?.id,
        userRole: user?.role,
    };
};


export const useMe = () => {
    const { user, isAuthenticated, isLoading } = useAuthContext();

    return {
        user,
        isAuthenticated,
        isLoading,

        id: user?.id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        fullName: user ? `${user.firstName} ${user.lastName}` : '',
        role: user?.role,
        permissions: user?.permissions || [],

        subscriptionStatus: user?.subscriptionStatus,
        isTrialUser: user?.subscriptionStatus === 'TRIAL',
        isActiveSubscriber: user?.subscriptionStatus === 'ACTIVE',
        hasActiveSubscription: user?.subscriptionStatus === 'ACTIVE' || user?.subscriptionStatus === 'TRIAL',

        isEmailVerified: user?.emailVerified || false,
        isPhoneVerified: user?.phoneVerified || false,
        isFullyVerified: (user?.emailVerified && user?.phoneVerified) || false,

        trialEndsAt: user?.trialEndsAt,
        isTrialExpired: user?.trialEndsAt ? new Date(user.trialEndsAt) < new Date() : false,
    };
};


export const useSubscription = () => {
    const { user, refreshUser } = useAuthContext();

    const subscriptionStatus = user?.subscriptionStatus;
    const trialEndsAt = user?.trialEndsAt;

    return {
        // Current status
        status: subscriptionStatus,
        isActive: subscriptionStatus === 'ACTIVE',
        isTrial: subscriptionStatus === 'TRIAL',
        isExpired: subscriptionStatus === 'EXPIRED',
        isCanceled: subscriptionStatus === 'CANCELED',
        isSuspended: subscriptionStatus === 'SUSPENDED',
        hasNoSubscription: !subscriptionStatus || subscriptionStatus === 'PAYMENT_FAILED',

        trialEndsAt,
        isTrialExpired: trialEndsAt ? new Date(trialEndsAt) < new Date() : false,
        trialDaysRemaining: trialEndsAt
            ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
            : 0,

        canReadBooks: subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'TRIAL',
        needsSubscription: !subscriptionStatus || ['EXPIRED', 'CANCELED', 'SUSPENDED', 'PAYMENT_FAILED'].includes(subscriptionStatus),

        // Actions
        refreshSubscriptionStatus: refreshUser,
    };
};


export const useAuthLoading = () => {
    const { isLoading } = useAuthContext();

    return {
        isAuthLoading: isLoading,
        isCheckingAuth: isLoading,
    };
};