'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useLogin } from '@/hooks/use-auth-api';
import { dt } from '@/lib/design-tokens';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LoginRequest } from '@/api/types/auth.types';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const loginMutation = useLogin();
    const [error, setError] = useState<string | null>(null);

    const registered = searchParams.get('registered') === 'true';
    const verified = searchParams.get('verified') === 'true';

    const handleLogin = async (data: { email: string; password: string }) => {
        try {
            setError(null);
            const loginRequest: LoginRequest = {
                email: data.email,
                password: data.password,
            };

            await loginMutation.mutateAsync(loginRequest);
            // Redirect se vrši automatski u useLogin hook-u
        } catch (error: any) {
            if (error.response?.status === 401) {
                setError('Neispravni email ili lozinka');
            } else {
                setError('Došlo je do greške. Pokušajte ponovo.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

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

                        {/* Success messages */}
                        {registered && (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    Registracija uspešna! Poslali smo vam email sa kodom za verifikaciju.
                                    <br />
                                    <span className="text-sm">Za test koristite kod: 123456</span>
                                </AlertDescription>
                            </Alert>
                        )}

                        {verified && (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    Email uspešno verifikovan! Možete se prijaviti.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <p className="text-reading-text/60">
                                Novi korisnik?{' '}
                                <Link href="/auth/register" className="text-reading-accent hover:underline">
                                    Kreirajte nalog
                                </Link>
                            </p>
                            <p className="text-reading-text/60">
                                Imate kod za verifikaciju?{' '}
                                <Link href="/auth/verify-email" className="text-reading-accent hover:underline">
                                    Verifikujte email
                                </Link>
                            </p>
                        </div>
                    </div>

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