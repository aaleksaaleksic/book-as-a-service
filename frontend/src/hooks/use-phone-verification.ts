import { useMutation } from "@tanstack/react-query";
import { useHttpClient } from "@/context/HttpClientProvider";
import { userApi } from "@/api/auth";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { PhoneVerificationRequest } from "@/api/types/auth.types";

export function useSendPhoneVerification() {
    const client = useHttpClient();

    return useMutation({
        mutationFn: (phoneNumber: string) =>
            userApi.resendPhoneVerification(client, phoneNumber),
        onSuccess: () => {
            toast({
                title: "Kod poslat!",
                description: "Verifikacioni kod je poslat na vaš telefon.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.response?.data?.message || "Neuspešno slanje koda",
                variant: "destructive",
            });
        },
    });
}

export function useVerifyPhone() {
    const client = useHttpClient();
    const { refreshUser } = useAuth();

    return useMutation({
        mutationFn: (data: PhoneVerificationRequest) =>
            userApi.verifyPhone(client, data),
        onSuccess: async () => {
            toast({
                title: "Uspešno!",
                description: "Telefon je uspešno verifikovan.",
            });
            await refreshUser();
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