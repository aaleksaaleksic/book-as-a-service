'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';
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
        } catch (error: any) {
            if (error.response?.status === 401) {
                setError('Neispravni email ili lozinka');
            } else {
                setError('Došlo je do greške. Pokušajte ponovo.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FDF7E3] via-[#FAF3D6] to-[#F7EAC0] flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-6xl grid lg:grid-cols-2 items-center gap-12">
                {/* Left Section */}
                <div className="text-center lg:text-left space-y-10">
                    {/* Logo */}
                    <div className="flex items-center justify-center lg:justify-start">
                        <Image
                            src="/logo.svg"
                            alt="Bookotecha Logo"
                            width={180}
                            height={80}
                            className="h-48 w-64 object-contain"
                            priority
                        />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-tight">
                            Dobrodošli nazad!
                        </h1>
                        <p className="text-lg text-[#4B4B4B] max-w-md">
                            Prijavite se u svoj nalog i nastavite da čitate svoje omiljene knjige na Bookotecha platformi.
                        </p>
                    </div>

                    {/* Success messages */}
                    {registered && (
                        <Alert className="bg-green-50 border-green-200 max-w-md">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Registracija uspešna! Poslali smo vam email sa kodom za verifikaciju.
                                <br />
                                <span className="text-sm">Za test koristite kod: 123456</span>
                            </AlertDescription>
                        </Alert>
                    )}

                    {verified && (
                        <Alert className="bg-green-50 border-green-200 max-w-md">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Email uspešno verifikovan! Možete se prijaviti.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Links */}
                    <div className="space-y-3">
                        <p className="text-[#4B4B4B]">
                            Novi korisnik?{' '}
                            <Link
                                href="/auth/register"
                                className="text-[#C4972E] font-medium hover:underline"
                            >
                                Kreirajte nalog
                            </Link>
                        </p>
                        <p className="text-[#4B4B4B]">
                            Imate kod za verifikaciju?{' '}
                            <Link
                                href="/auth/verify-email"
                                className="text-[#C4972E] font-medium hover:underline"
                            >
                                Verifikujte email
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Right Section (form) */}
                <div className="w-full max-w-md mx-auto lg:mx-0">
                    <div className="rounded-2xl bg-white/80 shadow-lg border border-[#E6D7A3] backdrop-blur-sm p-6">
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
