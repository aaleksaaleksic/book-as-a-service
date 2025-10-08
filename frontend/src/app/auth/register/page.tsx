'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import type { RegisterRequest } from '@/api/types/auth.types';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { useRegister } from '@/hooks/use-auth-api';

export default function RegisterPage() {
    const router = useRouter();
    const registerMutation = useRegister();
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<'firstName' | 'lastName' | 'email' | 'phoneNumber' | 'password' | 'confirmPassword', string>>
    >({});

    const handleRegister = async (data: any) => {
        try {
            setError(null);
            setFieldErrors({});

            const registerRequest: RegisterRequest = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                phoneNumber: data.phoneNumber, // opciono
            };

            await registerMutation.mutateAsync(registerRequest);
            router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
        } catch (error: any) {
            const response = error?.response;
            const errorCode = response?.data?.errorCode as string | undefined;
            const backendMessage = response?.data?.message as string | undefined;
            const normalizedMessage = backendMessage?.toLowerCase() ?? '';

            if (errorCode === 'EMAIL_ALREADY_EXISTS' || normalizedMessage.includes('email')) {
                const message = 'Nalog sa ovom email adresom već postoji.';
                setError(message);
                setFieldErrors({ email: message });
                return;
            }

            if (errorCode === 'PHONE_ALREADY_EXISTS' || normalizedMessage.includes('phone')) {
                const message = 'Nalog sa ovim brojem telefona već postoji.';
                setError(message);
                setFieldErrors({ phoneNumber: message });
                return;
            }

            if (backendMessage) {
                setError(backendMessage);
            } else if (error.message === 'Network Error') {
                setError('Ne možemo da se povežemo sa serverom. Proverite internet vezu.');
            } else {
                setError('Došlo je do greške prilikom registracije.');
            }
        }
    };

    const footer = (
        <p>
            Već imate nalog?{' '}
            <Link href="/auth/login" className="font-semibold text-library-azure transition hover:text-library-gold">
                Prijavite se
            </Link>
        </p>
    );

    return (
        <AuthPageLayout
            badge="Nova avantura"
            title="Kreirajte nalog i otvorite vrata digitalnoj biblioteci"
            description="Potrebno je svega nekoliko trenutaka da postanete deo Bookotecha zajednice i dobijete pristup ekskluzivnim naslovima."
            footer={footer}
        >
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-semibold font-ui text-sky-950">Kreiraj nalog</h2>
                    <p className="font-ui text-sm text-sky-950/70">
                        Popunite tražene podatke kako bismo prilagodili iskustvo čitanja vama.
                    </p>
                </div>
                <RegisterForm
                    onSubmit={handleRegister}
                    isLoading={registerMutation.isPending}
                    error={error}
                    serverErrors={fieldErrors}
                />
            </div>
        </AuthPageLayout>
    );
}
