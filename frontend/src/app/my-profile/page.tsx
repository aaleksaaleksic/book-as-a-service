"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserSubscription } from '@/hooks/use-user-subscription';
import { PageLoader } from '@/components/ui/loading-spinner';
import { dt } from '@/lib/design-tokens';
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useHttpClient } from '@/context/HttpClientProvider';
import { subscriptionsApi } from '@/api/subscriptions';
import { toast } from 'sonner';

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
    const { data: subscription, isLoading: subLoading, refetch } = useUserSubscription();
    const httpClient = useHttpClient();
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);

    if (authLoading || subLoading) {
        return <PageLoader text="Učitavanje profila" />;
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

    const handleCancelSubscription = async () => {
        if (!subscription?.id) return;

        setIsCanceling(true);
        try {
            const response = await subscriptionsApi.cancelSubscription(httpClient, subscription.id);

            if (response.data.success) {
                toast.success('Pretplata je uspešno otkazana');
                setIsCancelDialogOpen(false);
                await refetch();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Greška pri otkazivanju pretplate');
        } finally {
            setIsCanceling(false);
        }
    };

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

                                {/* Cancel Subscription Button */}
                                <div className="mt-6">
                                    <Button
                                        onClick={() => setIsCancelDialogOpen(true)}
                                        variant="outline"
                                        className="w-full bg-red-400 border-red-300 text-sky-950 hover:border-red-700"
                                    >
                                        Otkaži pretplatu
                                    </Button>
                                </div>

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

                {/* Cancel Subscription Dialog */}
                <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="rounded-full bg-red-100 p-2">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <DialogTitle className="text-xl">Otkazivanje pretplate</DialogTitle>
                            </div>
                            <DialogDescription className="text-base pt-2">
                                Da li ste sigurni da želite da otkažete vašu pretplatu?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <div className="rounded-lg border border-library-highlight/30 bg-library-azure/20 p-4">
                                <p className="text-sm text-reading-text/90">
                                    <strong className="text-reading-contrast">Važno:</strong> Čak i nakon otkazivanja, zadržaćete pristup svim sadržajima do datuma isteka vaše trenutne pretplate:
                                </p>
                                {subscription?.endDate && (
                                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-reading-contrast">
                                        <Calendar className="h-4 w-4 text-library-gold" />
                                        Pristup do: {formatDate(subscription.endDate)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={() => setIsCancelDialogOpen(false)}
                                disabled={isCanceling}
                            >
                                Zatvori
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleCancelSubscription}
                                disabled={isCanceling}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isCanceling ? 'Otkazivanje...' : 'Potvrdi otkazivanje'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
