'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(1, 'Lozinka je obavezna')
        .min(6, 'Lozinka mora imati najmanje 6 karaktera'),
    confirmPassword: z.string().min(1, 'Potvrda lozinke je obavezna'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Lozinke se ne podudaraju',
    path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    useEffect(() => {
        if (!token) {
            setError('Nevažeći link za resetovanje lozinke');
        }
    }, [token]);

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            setError('Nevažeći token za resetovanje');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword: data.password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Došlo je do greške');
            }

            setIsSubmitted(true);
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
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
                                Lozinka uspešno resetovana!
                            </h1>
                            <p className="text-[#4B4B4B]">
                                Vaša lozinka je uspešno promenjena. Možete se sada prijaviti sa novom lozinkom.
                            </p>
                            <p className="text-sm text-[#6B6B6B]">
                                Bićete automatski preusmereni na stranicu za prijavu...
                            </p>
                            <Link href="/auth/login">
                                <Button className="w-full mt-4 bg-[#C4972E] hover:bg-[#B08424] text-white font-semibold">
                                    Prijavite se
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
                            className="h-48 w-64 object-contain"
                            priority
                        />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-tight">
                            Resetujte lozinku 
                        </h1>
                        <p className="text-lg text-[#4B4B4B] max-w-md">
                            Unesite novu lozinku za vaš nalog. Budite sigurni da je lozinka jaka i sigurna.
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
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Error */}
                            {error && (
                                <Alert variant="destructive" className="border-red-300 bg-red-50 text-red-700">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-[#3A3A3A]">
                                    Nova lozinka
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Unesite novu lozinku"
                                        className={`pl-10 pr-10 text-gray-900 ${errors.password ? 'border-red-400' : 'border-amber-200'} focus:border-amber-400 focus:ring-amber-300`}
                                        disabled={isLoading || !token}
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        disabled={isLoading || !token}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#3A3A3A]">
                                    Potvrdite lozinku
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Potvrdite novu lozinku"
                                        className={`pl-10 pr-10 text-gray-900 ${errors.confirmPassword ? 'border-red-400' : 'border-amber-200'} focus:border-amber-400 focus:ring-amber-300`}
                                        disabled={isLoading || !token}
                                        {...register('confirmPassword')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        disabled={isLoading || !token}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full bg-[#C4972E] hover:bg-[#B08424] text-white font-semibold py-2 rounded-md shadow-sm transition-colors"
                                disabled={isLoading || !token}
                            >
                                {isLoading ? 'Resetujem...' : 'Resetuj lozinku'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-[#FDF7E3] via-[#FAF3D6] to-[#F7EAC0] flex items-center justify-center">
                <div className="text-[#4B4B4B]">Učitavam...</div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
