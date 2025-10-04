'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const forgotPasswordSchema = z.object({
    email: z.string().min(1, 'Email je obavezan').email('Unesite validnu email adresu'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: data.email }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Došlo je do greške');
            }

            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Došlo je do greške. Pokušajte ponovo.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FDF7E3] via-[#FAF3D6] to-[#F7EAC0] flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="rounded-2xl bg-white/80 shadow-lg border border-[#E6D7A3] backdrop-blur-sm p-8">
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-[#1A1A1A]">
                                Proverite vaš email
                            </h1>
                            <p className="text-[#4B4B4B]">
                                Ako email <span className="font-medium">{getValues('email')}</span> postoji u našem sistemu, poslali smo vam instrukcije za resetovanje lozinke.
                            </p>
                            <p className="text-sm text-[#6B6B6B]">
                                Ne vidite email? Proverite spam folder.
                            </p>
                            <Link href="/auth/login">
                                <Button className="w-full mt-4 bg-[#C4972E] hover:bg-[#B08424] text-white font-semibold">
                                    Nazad na prijavu
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                            className="h-auto w-40 object-contain"
                            priority
                        />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-tight">
                            Zaboravili ste lozinku? 🔒
                        </h1>
                        <p className="text-lg text-[#4B4B4B] max-w-md">
                            Unesite vašu email adresu i poslaćemo vam instrukcije za resetovanje lozinke.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="space-y-3">
                        <p className="text-[#4B4B4B]">
                            Setili ste se lozinke?{' '}
                            <Link
                                href="/auth/login"
                                className="text-[#C4972E] font-medium hover:underline"
                            >
                                Prijavite se
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Right Section (form) */}
                <div className="w-full max-w-md mx-auto lg:mx-0">
                    <div className="rounded-2xl bg-white/80 shadow-lg border border-[#E6D7A3] backdrop-blur-sm p-6">
                        <div className="mb-6">
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center text-sm text-[#4B4B4B] hover:text-[#C4972E] transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Nazad na prijavu
                            </Link>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Error */}
                            {error && (
                                <Alert variant="destructive" className="border-red-300 bg-red-50 text-red-700">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-[#3A3A3A]">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="vaš@email.com"
                                        className={`pl-10 text-gray-900 ${errors.email ? 'border-red-400' : 'border-amber-200'} focus:border-amber-400 focus:ring-amber-300`}
                                        disabled={isLoading}
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full bg-[#C4972E] hover:bg-[#B08424] text-white font-semibold py-2 rounded-md shadow-sm transition-colors"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Šaljem...' : 'Pošalji instrukcije'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
