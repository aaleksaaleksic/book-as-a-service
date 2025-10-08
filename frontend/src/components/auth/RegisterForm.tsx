'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, AlertCircle, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

const registerSchema = z
    .object({
        firstName: z
            .string()
            .trim()
            .min(1, 'Ime je obavezno')
            .min(2, 'Ime mora imati najmanje 2 karaktera'),
        lastName: z
            .string()
            .trim()
            .min(1, 'Prezime je obavezno')
            .min(2, 'Prezime mora imati najmanje 2 karaktera'),
        email: z
            .string()
            .trim()
            .min(1, 'Email je obavezan')
            .email('Unesite validnu email adresu')
            .transform(value => value.toLowerCase()),
        phoneNumber: z
            .string()
            .trim()
            .min(1, 'Broj telefona je obavezan')
            .transform(value => value.replace(/\s+/g, ''))
            .refine(value => /^\+?[1-9]\d{7,14}$/.test(value), 'Format: +381611234567 ili 0611234567'),
        password: z
            .string()
            .min(1, 'Lozinka je obavezna')
            .min(8, 'Lozinka mora imati najmanje 8 karaktera')
            .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Lozinka mora sadržati malo slovo, veliko slovo i broj'),
        confirmPassword: z
            .string()
            .min(1, 'Potvrda lozinke je obavezna'),
        acceptTerms: z
            .boolean()
            .refine(val => val === true, 'Morate prihvatiti uslove korišćenja'),
    })
    .refine(data => data.password === data.confirmPassword, {
        message: 'Lozinke se ne poklapaju',
        path: ['confirmPassword'],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
    onSubmit: (data: RegisterFormData) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
    serverErrors?: Partial<Record<keyof RegisterFormData, string>>;
}

export const RegisterForm = ({ onSubmit, isLoading = false, error, serverErrors }: RegisterFormProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            acceptTerms: false,
        },
    });

    const acceptTerms = watch('acceptTerms');
    const loading = isLoading || isSubmitting;

    const handleFormSubmit = async (data: RegisterFormData) => {
        try {
            await onSubmit(data);
        } catch (error) {
            // Error handling u parent komponenti
        }
    };

    const firstNameError = errors.firstName?.message ?? serverErrors?.firstName;
    const lastNameError = errors.lastName?.message ?? serverErrors?.lastName;
    const emailError = errors.email?.message ?? serverErrors?.email;
    const phoneError = errors.phoneNumber?.message ?? serverErrors?.phoneNumber;
    const passwordError = errors.password?.message ?? serverErrors?.password;
    const confirmPasswordError = errors.confirmPassword?.message ?? serverErrors?.confirmPassword;

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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

            {/* First Name */}
            <div className="space-y-2">
                <Label
                    htmlFor="firstName"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-950/70"
                >
                    Ime
                </Label>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-950/40" />
                    <Input
                        id="firstName"
                        type="text"
                        placeholder="Vaše ime"
                        className={cn(
                            'h-14 rounded-2xl border-library-highlight/30 bg-white/80 pl-12 pr-4 font-ui text-base text-sky-950 placeholder:text-sky-950/40 shadow-[0_12px_30px_rgba(11,29,58,0.08)] transition-all focus:border-library-gold/60 focus:outline-none focus:ring-2 focus:ring-library-gold/25',
                            firstNameError && 'border-red-400/70 focus:border-red-500 focus:ring-red-200'
                        )}
                        disabled={loading}
                        {...register('firstName')}
                    />
                </div>
                {firstNameError && (
                    <p className="text-sm font-medium text-red-600">
                        {firstNameError}
                    </p>
                )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
                <Label
                    htmlFor="lastName"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-950/70"
                >
                    Prezime
                </Label>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-950/40" />
                    <Input
                        id="lastName"
                        type="text"
                        placeholder="Vaše prezime"
                        className={cn(
                            'h-14 rounded-2xl border-library-highlight/30 bg-white/80 pl-12 pr-4 font-ui text-base text-sky-950 placeholder:text-sky-950/40 shadow-[0_12px_30px_rgba(11,29,58,0.08)] transition-all focus:border-library-gold/60 focus:outline-none focus:ring-2 focus:ring-library-gold/25',
                            lastNameError && 'border-red-400/70 focus:border-red-500 focus:ring-red-200'
                        )}
                        disabled={loading}
                        {...register('lastName')}
                    />
                </div>
                {lastNameError && (
                    <p className="text-sm font-medium text-red-600">
                        {lastNameError}
                    </p>
                )}
            </div>

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
                            emailError && 'border-red-400/70 focus:border-red-500 focus:ring-red-200'
                        )}
                        disabled={loading}
                        {...register('email')}
                    />
                </div>
                {emailError && (
                    <p className="text-sm font-medium text-red-600">
                        {emailError}
                    </p>
                )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
                <Label
                    htmlFor="phoneNumber"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-950/70"
                >
                    Broj telefona
                </Label>
                <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-950/40" />
                    <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+381611234567"
                        className={cn(
                            'h-14 rounded-2xl border-library-highlight/30 bg-white/80 pl-12 pr-4 font-ui text-base text-sky-950 placeholder:text-sky-950/40 shadow-[0_12px_30px_rgba(11,29,58,0.08)] transition-all focus:border-library-gold/60 focus:outline-none focus:ring-2 focus:ring-library-gold/25',
                            phoneError && 'border-red-400/70 focus:border-red-500 focus:ring-red-200'
                        )}
                        disabled={loading}
                        {...register('phoneNumber')}
                    />
                </div>
                {phoneError && (
                    <p className="text-sm font-medium text-red-600">
                        {phoneError}
                    </p>
                )}
            </div>

            {/* Password */}
            <div className="space-y-2">
                <Label
                    htmlFor="password"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-950/70"
                >
                    Lozinka
                </Label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-950/40" />
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={cn(
                            'h-14 rounded-2xl border-library-highlight/30 bg-white/80 pl-12 pr-12 font-ui text-base text-sky-950 placeholder:text-sky-950/40 shadow-[0_12px_30px_rgba(11,29,58,0.08)] transition-all focus:border-library-gold/60 focus:outline-none focus:ring-2 focus:ring-library-gold/25',
                            passwordError && 'border-red-400/70 focus:border-red-500 focus:ring-red-200'
                        )}
                        disabled={loading}
                        {...register('password')}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-950/40 transition hover:text-sky-950/70"
                        disabled={loading}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                {passwordError && (
                    <p className="text-sm font-medium text-red-600">{passwordError}</p>
                )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <Label
                    htmlFor="confirmPassword"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-950/70"
                >
                    Potvrdi lozinku
                </Label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-950/40" />
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={cn(
                            'h-14 rounded-2xl border-library-highlight/30 bg-white/80 pl-12 pr-12 font-ui text-base text-sky-950 placeholder:text-sky-950/40 shadow-[0_12px_30px_rgba(11,29,58,0.08)] transition-all focus:border-library-gold/60 focus:outline-none focus:ring-2 focus:ring-library-gold/25',
                            confirmPasswordError && 'border-red-400/70 focus:border-red-500 focus:ring-red-200'
                        )}
                        disabled={loading}
                        {...register('confirmPassword')}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-950/40 transition hover:text-sky-950/70"
                        disabled={loading}
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                {confirmPasswordError && (
                    <p className="text-sm font-medium text-red-600">{confirmPasswordError}</p>
                )}
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-2">
                <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setValue('acceptTerms', checked as boolean)}
                    disabled={loading}
                />
                <Label htmlFor="acceptTerms" className="cursor-pointer text-sm font-medium text-sky-950">
                    Prihvatam uslove korišćenja i politiku privatnosti
                </Label>
            </div>
            {errors.acceptTerms && (
                <p className="text-sm font-medium text-red-600">
                    {errors.acceptTerms.message}
                </p>
            )}

            {/* Submit Button */}
            <Button
                type="submit"
                className={cn(
                    dt.interactive.buttonPrimary,
                    'w-full justify-center py-5 text-base font-semibold uppercase tracking-[0.18em] font-ui'
                )}
                disabled={loading}
            >
                {loading ? 'Kreiram nalog...' : 'Kreiraj nalog'}
            </Button>
        </form>
    );
};