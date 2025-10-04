'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useRegister } from '@/hooks/use-auth-api';
import type { RegisterRequest } from '@/api/types/auth.types';

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-100 flex flex-col items-center justify-center px-4">
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
                        <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                            Pridružite se Bookotecha platformi!
                        </h1>
                        <p className="text-lg text-gray-700 max-w-md">
                            Kreirajte nalog i pristupite celoj biblioteci knjiga na jednom mestu.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="space-y-3">
                        <p className="text-gray-700">
                            Već imate nalog?{' '}
                            <Link
                                href="/auth/login"
                                className="text-amber-600 font-medium hover:underline"
                            >
                                Prijavite se
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Right Section (form) */}
                <div className="w-full max-w-md mx-auto lg:mx-0">
                    <div className="rounded-2xl bg-white/80 shadow-lg border border-amber-200 backdrop-blur-sm p-6">
                        <RegisterForm
                            onSubmit={handleRegister}
                            isLoading={registerMutation.isPending}
                            error={error}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}