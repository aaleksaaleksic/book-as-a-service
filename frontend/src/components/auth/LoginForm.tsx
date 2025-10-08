'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Alert */}
            {error && (
                <Alert
                    variant="destructive"
                    className="border-red-400/40 bg-red-100/80 text-red-800 shadow-sm"
                >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
                <Label
                    htmlFor="email"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-950/70"
                >
                    Email
                </Label>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-950/40" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="vaš@email.com"
                        className={cn(
                            'h-14 rounded-2xl border-library-highlight/30 bg-white/80 pl-12 pr-4 font-ui text-base text-sky-950 placeholder:text-sky-950/40 shadow-[0_12px_30px_rgba(11,29,58,0.08)] transition-all focus:border-library-gold/60 focus:outline-none focus:ring-2 focus:ring-library-gold/25',
                            errors.email && 'border-red-400/70 focus:border-red-500 focus:ring-red-200'
                        )}
                        disabled={loading}
                        {...register('email')}
                    />
                </div>
                {errors.email && (
                    <p className="text-sm font-medium text-red-600">{errors.email.message}</p>
                )}
            </div>

            {/* Password */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label
                        htmlFor="password"
                        className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-950/70"
                    >
                        Lozinka
                    </Label>
                </div>

                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-950/40" />
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Unesite lozinku"
                        className={cn(
                            'h-14 rounded-2xl border-library-highlight/30 bg-white/80 pl-12 pr-12 font-ui text-base text-sky-950 placeholder:text-sky-950/40 shadow-[0_12px_30px_rgba(11,29,58,0.08)] transition-all focus:border-library-gold/60 focus:outline-none focus:ring-2 focus:ring-library-gold/25',
                            errors.password && 'border-red-400/70 focus:border-red-500 focus:ring-red-200'
                        )}
                        disabled={loading}
                        {...register('password')}
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-950/40 transition hover:text-sky-950/70"
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
                            className="text-sm font-semibold text-library-azure transition hover:text-library-gold"
                        >
                            Zaboravili ste lozinku?
                        </Link>
                    </div>
                </div>

                {errors.password && (
                    <p className="text-sm font-medium text-red-600">{errors.password.message}</p>
                )}
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className={cn(
                    dt.interactive.buttonPrimary,
                    'w-full justify-center py-5 text-base font-semibold uppercase tracking-[0.18em] font-ui'
                )}
                disabled={loading}
            >
                {loading ? 'Prijavljujem...' : 'Prijavite se'}
            </Button>
        </form>
    );
};
