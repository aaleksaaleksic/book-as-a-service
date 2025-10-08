'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, MailCheck } from 'lucide-react';

import type { LoginRequest } from '@/api/types/auth.types';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/hooks/use-auth-api';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const loginMutation = useLogin();
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email' | 'password', string>>>({});

    const registered = searchParams.get('registered') === 'true';
    const verified = searchParams.get('verified') === 'true';

    const handleLogin = async (data: { email: string; password: string }) => {
        try {
            setError(null);
            setFieldErrors({});
            const loginRequest: LoginRequest = {
                email: data.email.trim().toLowerCase(),
                password: data.password,
            };
            await loginMutation.mutateAsync(loginRequest);
        } catch (error: any) {
            const response = error?.response;
            const errorCode = response?.data?.errorCode as string | undefined;
            const backendMessage = response?.data?.message as string | undefined;
            const normalizedMessage = backendMessage?.toLowerCase() ?? '';

            if (errorCode === 'USER_NOT_FOUND' || response?.status === 404) {
                const message = 'Nalog sa ovom email adresom ne postoji.';
                setError(message);
                setFieldErrors({ email: message });
                return;
            }

            if (errorCode === 'INVALID_PASSWORD' || normalizedMessage.includes('password')) {
                const message = 'Pogrešna lozinka.';
                setError(message);
                setFieldErrors({ password: message });
                return;
            }

            if (errorCode === 'ACCOUNT_DEACTIVATED' || normalizedMessage.includes('deactivated')) {
                const message = 'Vaš nalog je deaktiviran. Kontaktirajte podršku.';
                setError(message);
                return;
            }

            if (backendMessage) {
                setError(backendMessage);
            } else if (error.message === 'Network Error') {
                setError('Ne možemo da se povežemo sa serverom. Proverite internet vezu.');
            } else {
                setError('Došlo je do greške. Pokušajte ponovo.');
            }
        }
    };

    const leftExtras = (
        <>
            {registered && (
                <Alert className="mx-auto max-w-lg border-library-gold/40 bg-library-gold/15 text-sky-950 shadow-sm lg:mx-0">
                    <CheckCircle className="h-4 w-4 text-library-gold" />
                    <AlertDescription className="text-sky-950/90">
                        Registracija uspešna! Poslali smo vam email sa kodom za verifikaciju.
                        <br />
                        <span className="text-sm font-medium text-sky-950/70">Za test koristite kod: 123456</span>
                    </AlertDescription>
                </Alert>
            )}

            {verified && (
                <Alert className="mx-auto max-w-lg border-emerald-300/60 bg-emerald-100/70 text-emerald-900 shadow-sm lg:mx-0">
                    <MailCheck className="h-4 w-4 text-emerald-700" />
                    <AlertDescription className="text-emerald-900">
                        Email uspešno verifikovan! Možete se prijaviti.
                    </AlertDescription>
                </Alert>
            )}
        </>
    );

    const footer = (
        <>
            <p>
                Novi korisnik?{' '}
                <Link href="/auth/register" className="font-semibold text-library-azure transition hover:text-library-gold">
                    Kreirajte nalog
                </Link>
            </p>
            <p>
                Imate kod za verifikaciju?{' '}
                <Link href="/auth/verify-email" className="font-semibold text-library-azure transition hover:text-library-gold">
                    Verifikujte email
                </Link>
            </p>
        </>
    );

    return (
        <AuthPageLayout
            badge="Dobrodošli"
            title="Prijavite se i nastavite svoje putovanje kroz knjige"
            description="Pristupite personalizovanoj biblioteci, nastavite gde ste stali i otključajte nove preporuke."
            leftExtras={leftExtras}
            footer={footer}
        >
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-semibold font-ui text-sky-950">Prijavite se</h2>
                    <p className="font-ui text-sm text-sky-950/70">
                        Unesite email i lozinku povezanu sa vašim nalogom.
                    </p>
                </div>
                <LoginForm
                    onSubmit={handleLogin}
                    isLoading={loginMutation.isPending}
                    error={error}
                    serverErrors={fieldErrors}
                />
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-medium text-sky-950/70">
                        <span className="h-px flex-1 bg-library-highlight/40" />
                        ili
                        <span className="h-px flex-1 bg-library-highlight/40" />
                    </div>
                    <Button
                        type="button"
                        onClick={() => router.push('/browse')}
                        className="w-full justify-center rounded-full border border-library-highlight/30 bg-white/60 py-6 text-sm font-semibold uppercase tracking-[0.18em] text-sky-950 transition hover:bg-library-azure/10 font-ui"
                    >
                        Nastavite kao gost
                    </Button>
                </div>
            </div>
        </AuthPageLayout>
    );
}
