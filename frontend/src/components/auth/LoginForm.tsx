'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const loginSchema = z.object({
    email: z.string().min(1, 'Email je obavezan').email('Unesite validnu email adresu'),
    password: z
        .string()
        .min(1, 'Lozinka je obavezna')
        .min(6, 'Lozinka mora imati najmanje 6 karaktera'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
    onSubmit: (data: LoginFormData) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
}

export const LoginForm = ({ onSubmit, isLoading = false, error }: LoginFormProps) => {
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const loading = isLoading || isSubmitting;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Alert */}
            {error && (
                <Alert
                    variant="destructive"
                    className="border-red-300 bg-red-50 text-red-700"
                >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-800">
                    Email
                </Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="vaš@email.com"
                        className={`pl-10 text-gray-900 ${
                            errors.email ? 'border-red-400' : 'border-amber-200'
                        } focus:border-amber-400 focus:ring-amber-300`}
                        disabled={loading}
                        {...register('email')}
                    />
                </div>
                {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
            </div>

            {/* Password */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-800">
                        Lozinka
                    </Label>
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Unesite lozinku"
                        className={`pl-10 pr-10 text-gray-900 ${
                            errors.password ? 'border-red-400' : 'border-amber-200'
                        } focus:border-amber-400 focus:ring-amber-300`}
                        disabled={loading}
                        {...register('password')}
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        disabled={loading}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>

                    <div className="mt-1 text-right">
                        <Link
                            href="/auth/forgot-password"
                            className="text-sm text-amber-600 hover:text-amber-500 transition-colors"
                        >
                            Zaboravili ste lozinku?
                        </Link>
                    </div>
                </div>

                {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-md shadow-sm transition-colors"
                disabled={loading}
            >
                {loading ? 'Prijavljujem...' : 'Prijavite se'}
            </Button>
        </form>
    );
};
