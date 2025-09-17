"use client";
import { useMutation } from "@tanstack/react-query";
import { useHttpClient } from "@/context/HttpClientProvider";
import { authApi, userApi } from "@/api/auth";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { AUTH_CONFIG } from "@/utils/constants";
import { useAuth } from "@/hooks/useAuth";
import type {
    LoginRequest,
    RegisterRequest,
    EmailVerificationRequest,
    MeResponse
} from "@/api/types/auth.types";


export function useLogin() {
    const { login } = useAuth();

    return useMutation({
        mutationFn: async (data: LoginRequest) => {

            await login(data.email, data.password);
        },
        onSuccess: () => {
            toast({
                title: "Dobrodošli nazad!",
                description: "Uspešno ste se ulogovali",
            });
        },
        onError: (error: any) => {
            // Proveri tip greške i prikaži odgovarajuću poruku
            let errorMessage = "Neispravni podaci za prijavu";

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            toast({
                title: "Greška pri prijavljivanju",
                description: errorMessage,
                variant: "destructive",
            });
        },
    });
}

/**
 * Hook za registraciju novog korisnika
 */
export function useRegister() {
    const client = useHttpClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: RegisterRequest) => userApi.register(client, data),
        onSuccess: (_, variables) => {
            toast({
                title: "Registracija uspešna!",
                description: "Proverite email za verifikaciju naloga.",
            });

            // Prebaci na stranicu za verifikaciju sa email parametrom
            router.push(`/auth/verify-email?email=${encodeURIComponent(variables.email)}`);
        },
        onError: (error: any) => {
            let errorMessage = "Neuspešna registracija";

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            toast({
                title: "Greška pri registraciji",
                description: errorMessage,
                variant: "destructive",
            });
        },
    });
}

/**
 * Hook za dobijanje trenutnog korisnika
 * Koristi se za manuelno osvežavanje korisničkih podataka
 */
export function useCurrentUser() {
    const client = useHttpClient();
    const { refreshUser } = useAuth();

    return useMutation({
        mutationFn: async (): Promise<MeResponse> => {
            const response = await authApi.me(client);

            // Osveži korisnika u AuthContext-u
            await refreshUser();

            return response.data;
        },
        onError: (error: any) => {
            console.error("Failed to fetch current user:", error);

            // Ne prikazuj toast za 401 grešku jer to znači da korisnik nije ulogovan
            if (error?.response?.status !== 401) {
                toast({
                    title: "Greška",
                    description: "Neuspešno učitavanje korisničkih podataka",
                    variant: "destructive",
                });
            }
        },
    });
}

/**
 * Hook za email verifikaciju
 */
export function useEmailVerification() {
    const client = useHttpClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: EmailVerificationRequest) =>
            userApi.verifyEmail(client, data),
        onSuccess: () => {
            toast({
                title: "Uspešno!",
                description: "Email je uspešno verifikovan. Možete se ulogovati.",
            });

            // Prebaci na login stranicu sa success parametrom
            router.push("/auth/login?verified=true");
        },
        onError: (error: any) => {
            let errorMessage = "Neuspešna verifikacija";

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            toast({
                title: "Greška",
                description: errorMessage,
                variant: "destructive",
            });
        },
    });
}

/**
 * Hook za ponovno slanje email verifikacije
 */
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
            let errorMessage = "Neuspešno slanje verifikacionog koda";

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            toast({
                title: "Greška",
                description: errorMessage,
                variant: "destructive",
            });
        },
    });
}

/**
 * Hook za logout korisnika
 */
export function useLogout() {
    const client = useHttpClient();
    const { logout } = useAuth();

    return useMutation({
        mutationFn: async () => {
            try {
                // Pokušaj logout na backend-u (opciono)
                await authApi.logout(client);
            } catch (error) {
                // Ignoriši grešku ako backend logout ne uspe
                console.error("Backend logout failed:", error);
            }

            // Uvek izvrši lokalni logout
            logout();
        },
        onSuccess: () => {
            toast({
                title: "Uspešno odjavljivanje",
                description: "Vidimo se ponovo!",
            });
        },
    });
}

/**
 * Hook za refresh token
 */
export function useRefreshToken() {
    const { refreshToken } = useAuth();

    return useMutation({
        mutationFn: async () => {
            const success = await refreshToken();
            if (!success) {
                throw new Error("Token refresh failed");
            }
            return success;
        },
        onError: () => {
            toast({
                title: "Sesija je istekla",
                description: "Molimo ulogujte se ponovo",
                variant: "destructive",
            });
        },
    });
}