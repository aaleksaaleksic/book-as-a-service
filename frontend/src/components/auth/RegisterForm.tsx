'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { dt } from '@/lib/design-tokens';

const registerSchema = z.object({
    firstName: z
        .string()
        .min(1, 'Ime je obavezno')
        .min(2, 'Ime mora imati najmanje 2 karaktera')
        .max(50, 'Ime ne može biti duže od 50 karaktera'),
    lastName: z
        .string()
        .min(1, 'Prezime je obavezno')
        .min(2, 'Prezime mora imati najmanje 2 karaktera')
        .max(50, 'Prezime ne može biti duže od 50 karaktera'),
    email: z
        .string()
        .min(1, 'Email je obavezan')
        .email('Unesite validnu email adresu'),
    password: z
        .string()
        .min(8, 'Lozinka mora imati najmanje 8 karaktera')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Lozinka mora sadržavati barem jedno malo slovo, veliko slovo i broj'),
    confirmPassword: z
        .string()
        .min(1, 'Potvrda lozinke je obavezna'),
    acceptTerms: z
        .boolean()
        .refine(val => val === true, 'Morate prihvatiti uslove korišćenja'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Lozinke se ne poklapaju',
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
    onSubmit: (data: RegisterFormData) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
}

export const RegisterForm = ({ onSubmit, isLoading = false, error }: RegisterFormProps) => {
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

    const password = watch('password');
    const acceptTerms = watch('acceptTerms');

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleFormSubmit = async (data: RegisterFormData) => {
        try {
            await onSubmit(data);
        } catch (error) {
            // Error handling se vrši u parent komponenti
        }
    };

    const loading = isLoading || isSubmitting;

    // Password strength indicators
    const passwordRequirements = [
        { test: (pwd: string) => pwd.length >= 8, label: 'Najmanje 8 karaktera' },
        { test: (pwd: string) => /[a-z]/.test(pwd), label: 'Malo slovo' },
        { test: (pwd: string) => /[A-Z]/.test(pwd), label: 'Veliko slovo' },
        { test: (pwd: string) => /\d/.test(pwd), label: 'Broj' },
    ];

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center space-y-2">
                <CardTitle className={`${dt.typography.cardTitle} text-reading-text`}>
                    Kreirajte nalog
                </CardTitle>
                <CardDescription className={dt.typography.body}>
                    Pridružite se ČitamKnjige platformi
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* First Name */}
                    <div className="space-y-2">
                        <Label htmlFor="firstName" className={dt.typography.body}>
                            Ime
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="firstName"
                                type="text"
                                placeholder="Vaše ime"
                                className={`pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                                disabled={loading}
                                {...register('firstName')}
                            />
                        </div>
                        {errors.firstName && (
                            <p className={`${dt.typography.small} text-red-500`}>
                                {errors.firstName.message}
                            </p>
                        )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                        <Label htmlFor="lastName" className={dt.typography.body}>
                            Prezime
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="lastName"
                                type="text"
                                placeholder="Vaše prezime"
                                className={`pl-10 ${errors.lastName ? 'border-red-500' : ''}`}
                                disabled={loading}
                                {...register('lastName')}
                            />
                        </div>
                        {errors.lastName && (
                            <p className={`${dt.typography.small} text-red-500`}>
                                {errors.lastName.message}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className={dt.typography.body}>
                            Email
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="vaš@email.com"
                                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                                disabled={loading}
                                {...register('email')}
                            />
                        </div>
                        {errors.email && (
                            <p className={`${dt.typography.small} text-red-500`}>
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className={dt.typography.body}>
                            Lozinka
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Unesite lozinku"
                                className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
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
                        </div>

                        {/* Password Requirements */}
                        {password && (
                            <div className="space-y-1">
                                {passwordRequirements.map((req, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Check
                                            className={`h-3 w-3 ${
                                                req.test(password) ? 'text-green-500' : 'text-gray-300'
                                            }`}
                                        />
                                        <span className={`${dt.typography.small} ${
                                            req.test(password) ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                            {req.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {errors.password && (
                            <p className={`${dt.typography.small} text-red-500`}>
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className={dt.typography.body}>
                            Potvrda lozinke
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Potvrdite lozinku"
                                className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                disabled={loading}
                                {...register('confirmPassword')}
                            />
                            <button
                                type="button"
                                onClick={toggleConfirmPasswordVisibility}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                disabled={loading}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className={`${dt.typography.small} text-red-500`}>
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="acceptTerms"
                            checked={acceptTerms}
                            onCheckedChange={(checked) => setValue('acceptTerms', checked as boolean)}
                            disabled={loading}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="acceptTerms"
                                className={`${dt.typography.small} leading-normal cursor-pointer`}
                            >
                                Prihvatam{' '}
                                <a
                                    href="/terms"
                                    className="text-reading-accent hover:underline"
                                    target="_blank"
                                >
                                    uslove korišćenja
                                </a>{' '}
                                i{' '}
                                <a
                                    href="/privacy"
                                    className="text-reading-accent hover:underline"
                                    target="_blank"
                                >
                                    politiku privatnosti
                                </a>
                            </Label>
                        </div>
                    </div>
                    {errors.acceptTerms && (
                        <p className={`${dt.typography.small} text-red-500`}>
                            {errors.acceptTerms.message}
                        </p>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className={`w-full ${dt.interactive.buttonPrimary}`}
                        disabled={loading}
                    >
                        {loading ? 'Kreiram nalog...' : 'Kreiraj nalog'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};