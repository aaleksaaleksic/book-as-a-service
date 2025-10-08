'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpenCheck, ShieldCheck, Sparkles } from 'lucide-react';

import type { RegisterRequest } from '@/api/types/auth.types';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { useRegister } from '@/hooks/use-auth-api';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
    const router = useRouter();
    const registerMutation = useRegister();
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (data: any) => {
        try {
            setError(null);

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
            if (error.response?.data?.message) {
                setError(error.response.data.message);
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

    const leftExtras = (
        <div className="grid gap-4 text-left font-ui text-sky-950/80">
            <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-library-azure/10 text-library-azure">
                    <Sparkles className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold text-sky-950">Personalizovane preporuke</p>
                    <p className="text-sm text-sky-950/70">Otkrijte knjige koje odgovaraju vašem stilu čitanja.</p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-library-azure/10 text-library-azure">
                    <BookOpenCheck className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold text-sky-950">Neograničen pristup biblioteci</p>
                    <p className="text-sm text-sky-950/70">Uživajte u hiljadama naslova na svim uređajima.</p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-library-azure/10 text-library-azure">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold text-sky-950">Sigurna i brza registracija</p>
                    <p className="text-sm text-sky-950/70">Vaši podaci su zaštićeni uz modernu autentifikaciju.</p>
                </div>
            </div>
        </div>
    );

    return (
        <AuthPageLayout
            badge="Nova avantura"
            title="Kreirajte nalog i otvorite vrata digitalnoj biblioteci"
            description="Potrebno je svega nekoliko trenutaka da postanete deo Bookotecha zajednice i dobijete pristup ekskluzivnim naslovima."
            footer={footer}
            leftExtras={leftExtras}
        >
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h2 className={cn(dt.typography.subsectionTitle, 'text-3xl text-sky-950')}>Kreiraj nalog</h2>
                    <p className="font-ui text-sm text-sky-950/70">
                        Popunite tražene podatke kako bismo prilagodili iskustvo čitanja vama.
                    </p>
                </div>
                <RegisterForm
                    onSubmit={handleRegister}
                    isLoading={registerMutation.isPending}
                    error={error}
                />
            </div>
        </AuthPageLayout>
    );
}
