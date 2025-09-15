'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { dt } from '@/lib/design-tokens';

type LoginFormData = {
    email: string;
    password: string;
};

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const redirectTo = searchParams.get('redirect') || '/dashboard';

    const handleLogin = async (data: LoginFormData) => {
        try {
            setError(null);
            setIsLoading(true);

            await login(data.email, data.password);

            // Redirect se vrši automatski u AuthContext
            router.push(redirectTo);
        } catch (error: any) {
            console.error('Login error:', error);

            // Handle different error types
            if (error.response?.status === 401) {
                setError('Neispravni podaci za prijavu. Proverite email i lozinku.');
            } else if (error.response?.status === 403) {
                setError('Vaš nalog nije aktiviran. Proverite email za aktivacijski link.');
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Došlo je do greške prilikom prijave. Pokušajte ponovo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left Side - Branding and Hero Content */}
                    <div className="text-center lg:text-left space-y-8">
                        {/* Logo */}
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                            <BookOpen className="w-12 h-12 text-reading-accent" />
                        </div>

                        {/* Main Heading */}
                        <div className="space-y-4">
                            <h1 className="text-6xl lg:text-7xl font-bold text-reading-text leading-tight">
                                ReadBookHub
                            </h1>
                            <p className={`${dt.typography.body} text-reading-text/70 text-xl max-w-lg`}>
                                Vaša digitalna biblioteka.
                                Čitajte bilo gde, bilo kada.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="hidden lg:block space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-reading-accent rounded-full"></div>
                                <span className={`${dt.typography.body} text-reading-text/80`}>
                                    Čitanje na svim uređajima.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="w-full max-w-md">
                            <LoginForm
                                onSubmit={handleLogin}
                                isLoading={isLoading}
                                error={error}
                            />

                            {/* Additional Links */}
                            <div className="mt-6 text-center space-y-4">
                                <div className="text-sm">
                                    <Link
                                        href="/auth/forgot-password"
                                        className={`${dt.typography.small} text-reading-accent hover:underline`}
                                    >
                                        Zaboravili ste lozinku?
                                    </Link>
                                </div>

                                <div className={`${dt.typography.small} text-reading-text/70`}>
                                    Nemate nalog?{' '}
                                    <Link
                                        href="/auth/register"
                                        className="text-reading-accent hover:underline font-medium"
                                    >
                                        Registrujte se
                                    </Link>
                                </div>

                                {/* Back to Home */}
                                <div className="pt-4">
                                    <Link
                                        href="/"
                                        className={`${dt.typography.small} text-reading-text/60 hover:text-reading-accent transition-colors`}
                                    >
                                        ← Nazad na početnu
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}