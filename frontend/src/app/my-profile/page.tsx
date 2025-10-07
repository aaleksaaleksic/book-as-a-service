"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserSubscription } from '@/hooks/use-user-subscription';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { dt } from '@/lib/design-tokens';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const getSubscriptionPlanName = (planType: string) => {
    switch (planType) {
        case 'MONTHLY':
            return 'Mesečna pretplata';
        case 'SIX_MONTH':
            return 'Šestomesečna pretplata';
        case 'YEARLY':
            return 'Godišnja pretplata';
        default:
            return planType;
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'ACTIVE':
            return { label: 'Aktivna', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
        case 'EXPIRED':
            return { label: 'Istekla', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle };
        case 'CANCELED':
            return { label: 'Otkazana', color: 'text-gray-600', bg: 'bg-gray-100', icon: XCircle };
        default:
            return { label: status, color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock };
    }
};

export default function MyProfilePage() {
    const { user, isLoading: authLoading } = useAuth();
    const { data: subscription, isLoading: subLoading } = useUserSubscription();

    if (authLoading || subLoading) {
        return (
            <div className={cn(dt.layouts.mainPage, "flex items-center justify-center bg-library-parchment/95")}>
                <LoadingSpinner size="lg" variant="spinner" text="Učitavanje profila" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const hasActiveSubscription = subscription?.status === 'ACTIVE';
    const statusBadge = subscription?.status ? getStatusBadge(subscription.status) : null;
    const StatusIcon = statusBadge?.icon;
    const isAutoRenew = subscription?.autoRenew;
    const planType = subscription?.type || subscription?.planType;
    const isMonthly = planType === 'MONTHLY';

    return (
        <div className={cn(dt.layouts.mainPage,"bg-library-parchment/95")}>
            <div className={cn(dt.layouts.pageContainer, dt.spacing.pageSections, "max-w-5xl mx-auto")}>
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className={cn(dt.typography.pageTitle, "mb-2")}>Moj Profil</h1>
                    <p className={cn(dt.typography.muted)}>
                        Pregled vaših informacija i pretplate
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid gap-8 md:grid-cols-2">
                    {/* User Info Card */}
                    <div className={cn(dt.components.card, dt.spacing.cardPadding)}>
                        <h2 className={cn(dt.typography.subsectionTitle, "mb-6")}>
                            Osnovne informacije
                        </h2>

                        {/* Avatar */}
                        <div className="mb-6 flex justify-center">
                            <div
                                className={cn(
                                    "relative h-24 w-24 rounded-full overflow-hidden flex items-center justify-center",
                                    user?.avatarUrl
                                        ? 'border-2 border-library-gold/30 bg-reading-surface'
                                        : 'bg-library-gold text-sky-950'
                                )}
                                style={
                                    user?.avatarUrl
                                        ? {
                                              backgroundImage: `url(${user.avatarUrl})`,
                                              backgroundSize: 'cover',
                                              backgroundPosition: 'center',
                                          }
                                        : undefined
                                }
                            >
                                {!user?.avatarUrl && (
                                    <span className="text-3xl font-semibold font-bebas">
                                        {`${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.toUpperCase() || 'U'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* User Details */}
                        <div className={cn(dt.spacing.componentSpacing)}>
                            <div className="space-y-4">
                                <div>
                                    <p className={cn(dt.typography.small, "uppercase tracking-wider mb-1")}>
                                        Ime i prezime
                                    </p>
                                    <p className={cn(dt.typography.body, "font-semibold")}>
                                        {user.firstName} {user.lastName}
                                    </p>
                                </div>

                                <div>
                                    <p className={cn(dt.typography.small, "uppercase tracking-wider mb-1")}>
                                        Email adresa
                                    </p>
                                    <p className={cn(dt.typography.body)}>
                                        {user.email}
                                    </p>
                                </div>

                                {user.phoneNumber && (
                                    <div>
                                        <p className={cn(dt.typography.small, "uppercase tracking-wider mb-1")}>
                                            Broj telefona
                                        </p>
                                        <p className={cn(dt.typography.body)}>
                                            {user.phoneNumber}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Subscription Card */}
                    <div className={cn(dt.components.card, dt.spacing.cardPadding)}>
                        <h2 className={cn(dt.typography.subsectionTitle, "mb-6")}>
                            Pretplata
                        </h2>

                        {hasActiveSubscription ? (
                            <div className={cn(dt.spacing.componentSpacing)}>
                                {/* Status Badge */}
                                {statusBadge && (
                                    <div className="flex items-center gap-2 mb-4">
                                        {StatusIcon && (
                                            <StatusIcon className={cn("h-5 w-5", statusBadge.color)} />
                                        )}
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-sm font-semibold",
                                            statusBadge.bg,
                                            statusBadge.color
                                        )}>
                                            {statusBadge.label}
                                        </span>
                                    </div>
                                )}

                                {/* Plan Type */}
                                <div className="mb-4">
                                    <p className={cn(dt.typography.small, "uppercase tracking-wider mb-1")}>
                                        Tip pretplate
                                    </p>
                                    <p className={cn(dt.typography.body, "font-semibold")}>
                                        {getSubscriptionPlanName(planType || '')}
                                    </p>
                                </div>

                                {/* End Date */}
                                {subscription.endDate && (
                                    <div className="mb-4">
                                        <p className={cn(dt.typography.small, "uppercase tracking-wider mb-1")}>
                                            Važi do
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-library-gold" />
                                            <p className={cn(dt.typography.body, "font-semibold")}>
                                                {formatDate(subscription.endDate)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Auto-payment Note */}
                                {subscription?.endDate && (
                                    <div className={cn(
                                        "mt-6 p-4 rounded-lg border",
                                        isMonthly && isAutoRenew
                                            ? "bg-blue-50/50 border-blue-200/50"
                                            : "bg-library-gold/5 border-library-gold/20"
                                    )}>
                                        <p className={cn(dt.typography.small, "text-reading-text/80")}>
                                            {isMonthly && isAutoRenew ? (
                                                <>
                                                    <strong>Automatsko plaćanje:</strong> Sledeća naplata će biti izvršena{' '}
                                                    {formatDate(subscription.endDate)}
                                                </>
                                            ) : (
                                                <>
                                                    <strong>Jednokratna uplata:</strong> Pretplata važi do{' '}
                                                    {formatDate(subscription.endDate)}. Potrebno je produžiti ručno.
                                                </>
                                            )}
                                        </p>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className={cn(dt.components.infoBox, "text-center space-y-4")}>
                                <p className={cn(dt.typography.body)}>
                                    Trenutno nemate aktivnu pretplatu
                                </p>
                                <Link
                                    href="/pricing"
                                    className={cn(
                                        dt.interactive.buttonPrimary,
                                        "inline-block"
                                    )}
                                >
                                    Pogledaj planove
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
