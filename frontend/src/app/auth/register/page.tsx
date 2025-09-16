'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useRegister } from '@/hooks/use-auth-api';
import { dt } from '@/lib/design-tokens';
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
        <div className="min-h-screen bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left Side - Branding */}
                    <div className="text-center lg:text-left space-y-8 order-2 lg:order-1">
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                            <BookOpen className="w-12 h-12 text-reading-accent" />
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-5xl lg:text-6xl font-bold text-reading-text leading-tight">
                                Pridružite se ReadBookHub-u
                            </h1>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-book-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-reading-accent font-bold">✓</span>
                                </div>
                                <p className="text-reading-text/80">7 dana besplatno</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-book-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-reading-accent font-bold">✓</span>
                                </div>
                                <p className="text-reading-text/80">Otkažite bilo kada</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-reading-text/60">
                                Već imate nalog?{' '}
                                <Link href="/auth/login" className="text-reading-accent hover:underline">
                                    Prijavite se
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Right Side - Register Form */}
                    <div className="w-full max-w-md mx-auto lg:mx-0 order-1 lg:order-2">
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