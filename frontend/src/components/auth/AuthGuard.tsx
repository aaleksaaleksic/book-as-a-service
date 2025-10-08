'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useCan, useSubscription } from '@/hooks/useAuth';
import { LoadingSpinner, PageLoader } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, CreditCard, AlertTriangle } from 'lucide-react';
import { AUTH_CONFIG } from '@/utils/constants';
import type { Permission, UserRole } from '@/types/auth';

interface AuthGuardProps {
    children: React.ReactNode;

    requireAuth?: boolean;

    permissions?: Permission[];

    anyPermissions?: Permission[];

    roles?: UserRole[];

    requireSubscription?: boolean;
    requireActiveSubscription?: boolean;

    fallback?: React.ReactNode;

    redirectTo?: string;
    unauthorizedRedirect?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
    children,
    requireAuth = true,
    permissions = [],
    anyPermissions = [],
    roles = [],
    requireSubscription = false,
    requireActiveSubscription = false,
    fallback,
    redirectTo,
    unauthorizedRedirect,
}) => {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuth();
    const { can, canAny, currentUser } = useCan();
    const { canReadBooks, needsSubscription, isActive, isTrial } = useSubscription();

    useEffect(() => {
        if (!requireAuth || isLoading || isAuthenticated) {
            return;
        }

        if (fallback) {
            return;
        }

        if (redirectTo) {
            router.push(redirectTo);
            return;
        }

        if (typeof window !== 'undefined') {
            const redirectPath = `${AUTH_CONFIG.LOGIN_REDIRECT}?redirect=${encodeURIComponent(window.location.pathname)}`;
            router.push(redirectPath);
        } else {
            router.push(AUTH_CONFIG.LOGIN_REDIRECT);
        }
    }, [requireAuth, isLoading, isAuthenticated, redirectTo, fallback, router]);

    if (isLoading) {
        return <PageLoader text="Proveravamo vaš nalog..." />;
    }

    if (requireAuth && !isAuthenticated) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return <PageLoader text="Preusmeravanje na prijavu..." />;
    }

    if (roles.length > 0 && user) {
        const hasRequiredRole = roles.includes(user.role);
        if (!hasRequiredRole) {
            return <UnauthorizedAccess reason="insufficient-role" requiredRoles={roles} />;
        }
    }

    if (permissions.length > 0) {
        const hasAllPermissions = permissions.every(permission => can(permission));
        if (!hasAllPermissions) {
            return <UnauthorizedAccess reason="missing-permissions" requiredPermissions={permissions} />;
        }
    }

    if (anyPermissions.length > 0) {
        const hasAnyRequiredPermission = canAny(anyPermissions);
        if (!hasAnyRequiredPermission) {
            return <UnauthorizedAccess reason="missing-any-permissions" requiredAnyPermissions={anyPermissions} />;
        }
    }

    if (requireSubscription && needsSubscription) {
        return <SubscriptionRequired />;
    }

    if (requireActiveSubscription && !canReadBooks) {
        return <ActiveSubscriptionRequired isActive={isActive} isTrial={isTrial} />;
    }

    return <>{children}</>;
};


interface UnauthorizedAccessProps {
    reason: 'insufficient-role' | 'missing-permissions' | 'missing-any-permissions';
    requiredRoles?: UserRole[];
    requiredPermissions?: Permission[];
    requiredAnyPermissions?: Permission[];
}

const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({
                                                                   reason,
                                                                   requiredRoles,
                                                                   requiredPermissions,
                                                                   requiredAnyPermissions,
                                                               }) => {
    const router = useRouter();
    const { logout } = useAuth();

    const handleGoBack = () => {
        router.back();
    };

    const handleGoHome = () => {
        router.push('/');
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600">
                        {reason === 'insufficient-role' && 'You do not have the required role to access this page.'}
                        {reason === 'missing-permissions' && 'You do not have the required permissions to access this page.'}
                        {reason === 'missing-any-permissions' && 'You do not have any of the required permissions to access this page.'}
                    </p>

                    <div className="flex justify-center">
                        <Button onClick={handleGoHome}>
                            Home page
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};


const SubscriptionRequired: React.FC = () => {
    const router = useRouter();

    const handleSubscribe = () => {
        router.push('/subscription');
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CreditCard className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <CardTitle className="text-2xl text-orange-600">Subscription Required</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600">
                        You need an active subscription to access this content.
                    </p>
                    <Button onClick={handleSubscribe} className="w-full">
                        View Subscription Plans
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};




interface ActiveSubscriptionRequiredProps {
    isActive: boolean;
    isTrial: boolean;
}

const ActiveSubscriptionRequired: React.FC<ActiveSubscriptionRequiredProps> = ({
                                                                                   isActive,
                                                                                   isTrial,
                                                                               }) => {
    const router = useRouter();

    const handleManageSubscription = () => {
        router.push('/subscription');
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <CardTitle className="text-2xl text-yellow-600">
                        {isTrial ? 'Trial Expired' : 'Subscription Inactive'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600">
                        {isTrial
                            ? 'Your trial period has ended. Please subscribe to continue reading.'
                            : 'Your subscription is not active. Please renew to continue reading.'
                        }
                    </p>
                    <Button onClick={handleManageSubscription} className="w-full">
                        Manage Subscription
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};