"use client";
import { useMutation } from "@tanstack/react-query";
import { useHttpClient } from "@/context/HttpClientProvider";
import { authApi, userApi } from "@/api/auth";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { AUTH_CONFIG } from "@/utils/constants";
import type { LoginRequest, RegisterRequest } from "@/api/types/auth.types";
import {EmailVerificationRequest} from "@/types";

export function useLogin() {
    const client = useHttpClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: LoginRequest) => authApi.login(client, data),
        onSuccess: (response) => {
            localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
            localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, response.data.refreshToken);

            toast({
                title: "Dobrodošli nazad!",
                description: `Uspešno ste se ulogovali kao ${response.data.user.firstName}`,
            });

            router.push(AUTH_CONFIG.DASHBOARD_REDIRECT);
        },
        onError: (error: any) => {
            toast({
                title: "Greška pri prijavljivanju",
                description: error.response?.data?.message || "Neispravni podaci za prijavu",
                variant: "destructive",
            });
        },
    });
}

export function useRegister() {
    const client = useHttpClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: RegisterRequest) => userApi.register(client, data),
        onSuccess: () => {
            toast({
                title: "Registracija uspešna!",
                description: "Proverite email za verifikaciju naloga.",
            });

            router.push("/auth/login?registered=true");
        },
        onError: (error: any) => {
            toast({
                title: "Greška pri registraciji",
                description: error.response?.data?.message || "Neuspešna registracija",
                variant: "destructive",
            });
        },
    });
}

export function useCurrentUser() {
    const client = useHttpClient();

    return useMutation({
        mutationFn: () => authApi.me(client),
        onError: (error: any) => {
            console.error("Failed to fetch current user:", error);
        },
    });
}



// Hook za email verifikaciju
export function useEmailVerification() {
    const client = useHttpClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: EmailVerificationRequest) =>
            userApi.verifyEmail(client, data),
        onSuccess: () => {
            toast({
                title: "Uspešno!",
                description: "Email je uspešno verifikovan.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.response?.data?.message || "Neuspešna verifikacija",
                variant: "destructive",
            });
        },
    });
}

// Hook za ponovno slanje email verifikacije
export function useResendEmailVerification() {
    const client = useHttpClient();

    return useMutation({
        mutationFn: (email: string) =>
            userApi.resendEmailVerification(client, email),
        onSuccess: () => {
            toast({
                title: "Poslato!",
                description: "Novi verifikacioni kod je poslat na email.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.response?.data?.message || "Neuspešno slanje",
                variant: "destructive",
            });
        },
    });
}