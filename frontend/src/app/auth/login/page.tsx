'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useLogin } from '@/hooks/use-auth-api';
import { dt } from '@/lib/design-tokens';
import type { LoginRequest } from '@/api/types/auth.types';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const loginMutation = useLogin();
    const [error, setError] = useState<string | null>(null);

    const redirectTo = searchParams.get('redirect') || '/dashboard';
    const registered = searchParams.get('registered') === 'true';

    const handleLogin = async (data: { email: string; password: string }) => {
        try {
            setError(null);
            const loginRequest: LoginRequest = {
                email: data.email,
                password: data.password,
            };

            await loginMutation.mutateAsync(loginRequest);
        } catch (error: any) {
            setError('Proverite vaše podatke i pokušajte ponovo.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left Side - Branding */}
                    <div className="text-center lg:text-left space-y-8">
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                            <BookOpen className="w-12 h-12 text-reading-accent" />
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-6xl lg:text-7xl font-bold text-reading-text leading-tight">
                                ReadBookHub
                            </h1>
                            <p className={`${dt.typography.body} text-reading-text/70 text-xl max-w-lg`}>
                                Vaša digitalna biblioteka. Čitajte bilo gde, bilo kada.
                            </p>
                        </div>

                        {registered && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                                Registracija uspešna! Proverite email za verifikaciju.
                            </div>
                        )}

                        <div className="space-y-4">
                            <p className="text-reading-text/60">
                                Novi korisnik?{' '}
                                <Link href="/auth/register" className="text-reading-accent hover:underline">
                                    Kreirajte nalog
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="w-full max-w-md mx-auto lg:mx-0">
                        <LoginForm
                            onSubmit={handleLogin}
                            isLoading={loginMutation.isPending}
                            error={error}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}