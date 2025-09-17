import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import type { User, UserRole, Permission, SubscriptionStatus } from '@/types/auth';

interface PhoneVerificationData {
    phoneNumber: string;
    verificationCode: string;
}


const parseUserData = (data: any): User => {
    const permissions: Permission[] = data.permissions?.map((p: any) =>
        typeof p === 'string' ? p as Permission : (p as any).toString()
    ) || [];

    const deriveRoleFromPermissions = (permissions: Permission[] = []): UserRole => {
        const ADMIN_PERMISSIONS: Permission[] = [
            'CAN_CREATE_USERS',
            'CAN_UPDATE_USERS',
            'CAN_DELETE_USERS',
            'CAN_MANAGE_PAYMENTS',
        ];

        const MODERATOR_PERMISSIONS: Permission[] = [
            'CAN_MODERATE_CONTENT',
            'CAN_VIEW_ANALYTICS',
        ];

        if (permissions.some(p => ADMIN_PERMISSIONS.includes(p))) {
            return 'ADMIN';
        }
        if (permissions.some(p => MODERATOR_PERMISSIONS.includes(p))) {
            return 'MODERATOR';
        }
        return 'USER';
    };

    const role: UserRole = data.role as UserRole || deriveRoleFromPermissions(permissions);
    const subscriptionStatus: SubscriptionStatus =
        (data.subscriptionStatus as SubscriptionStatus) || 'TRIAL';

    return {
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || null,
        avatarUrl: null,
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


export function useVerifyPhoneWithUser() {
    return useMutation({
        mutationFn: async (data: PhoneVerificationData) => {
            const response = await api.post('/api/v1/users/verify-phone', {
                phoneNumber: data.phoneNumber,
                verificationCode: data.verificationCode,
            });

            if (response.data.success && response.data.user) {
                // Parse i vrati updated user
                return parseUserData(response.data.user);
            }

            throw new Error(response.data.message || 'Verification failed');
        },
        onSuccess: (updatedUser) => {
            toast({
                title: "Uspešno!",
                description: "Telefon je uspešno verifikovan",
            });

            // VAŽNO: Ovde vraćamo user podatke koje caller može koristiti
            // za update auth state-a
            return updatedUser;
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message ||
                error?.message ||
                "Neispravni verifikacioni kod";

            toast({
                title: "Greška",
                description: errorMessage,
                variant: "destructive",
            });
        },
    });
}

export function useSendPhoneVerification() {
    return useMutation({
        mutationFn: async (phoneNumber: string) => {
            // Za lokalno testiranje, samo simuliramo slanje
            return Promise.resolve({ success: true });
        },
        onSuccess: () => {
            toast({
                title: "Kod poslat!",
                description: "Verifikacioni kod je generisan u bazi podataka.",
            });
        },
        onError: () => {
            toast({
                title: "Greška",
                description: "Neuspešno slanje koda",
                variant: "destructive",
            });
        },
    });
}

export function useVerifyPhone() {
    return useMutation({
        mutationFn: async (data: PhoneVerificationData) => {
            return api.post('/api/v1/users/verify-phone', {
                phoneNumber: data.phoneNumber,
                verificationCode: data.verificationCode,
            });
        },
        onSuccess: () => {
            toast({
                title: "Uspešno!",
                description: "Telefon je uspešno verifikovan.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.response?.data?.message || "Neispravni verifikacioni kod",
                variant: "destructive",
            });
        },
    });
}