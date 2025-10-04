'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, AlertCircle, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { dt } from '@/lib/design-tokens';

const registerSchema = z.object({
    firstName: z
        .string()
        .min(1, 'Ime je obavezno')
        .min(2, 'Ime mora imati najmanje 2 karaktera'),
    lastName: z
        .string()
        .min(1, 'Prezime je obavezno')
        .min(2, 'Prezime mora imati najmanje 2 karaktera'),
    email: z
        .string()
        .min(1, 'Email je obavezan')
        .email('Unesite validnu email adresu'),
    phoneNumber: z
        .string()
        .min(1, 'Broj telefona je obavezan')
        .regex(/^\+?[1-9]\d{7,14}$/, 'Format: +381611234567 ili 0611234567'),
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

    const acceptTerms = watch('acceptTerms');
    const loading = isLoading || isSubmitting;

    const handleFormSubmit = async (data: RegisterFormData) => {
        try {
            await onSubmit(data);
        } catch (error) {
            // Error handling u parent komponenti
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
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

            {/* First Name */}
            <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-800">
                    Ime
                </Label>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        id="firstName"
                        type="text"
                        placeholder="Vaše ime"
                        className={`pl-10 text-gray-900 ${
                            errors.firstName ? 'border-red-400' : 'border-amber-200'
                        } focus:border-amber-400 focus:ring-amber-300`}
                        disabled={loading}
                        {...register('firstName')}
                    />
                </div>
                {errors.firstName && (
                    <p className="text-sm text-red-500">
                        {errors.firstName.message}
                    </p>
                )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-800">
                    Prezime
                </Label>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        id="lastName"
                        type="text"
                        placeholder="Vaše prezime"
                        className={`pl-10 text-gray-900 ${
                            errors.lastName ? 'border-red-400' : 'border-amber-200'
                        } focus:border-amber-400 focus:ring-amber-300`}
                        disabled={loading}
                        {...register('lastName')}
                    />
                </div>
                {errors.lastName && (
                    <p className="text-sm text-red-500">
                        {errors.lastName.message}
                    </p>
                )}
            </div>

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
                    <p className="text-sm text-red-500">
                        {errors.email.message}
                    </p>
                )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-800">
                    Broj telefona
                </Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+381611234567"
                        className={`pl-10 text-gray-900 ${
                            errors.phoneNumber ? 'border-red-400' : 'border-amber-200'
                        } focus:border-amber-400 focus:ring-amber-300`}
                        disabled={loading}
                        {...register('phoneNumber')}
                    />
                </div>
                {errors.phoneNumber && (
                    <p className="text-sm text-red-500">
                        {errors.phoneNumber.message}
                    </p>
                )}
            </div>

            {/* Password */}
            <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-800">
                    Lozinka
                </Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`pl-10 pr-10 text-gray-900 ${
                            errors.password ? 'border-red-400' : 'border-amber-200'
                        } focus:border-amber-400 focus:ring-amber-300`}
                        disabled={loading}
                        {...register('password')}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        disabled={loading}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-sm text-red-500">
                        {errors.password.message}
                    </p>
                )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-800">
                    Potvrdi lozinku
                </Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`pl-10 pr-10 text-gray-900 ${
                            errors.confirmPassword ? 'border-red-400' : 'border-amber-200'
                        } focus:border-amber-400 focus:ring-amber-300`}
                        disabled={loading}
                        {...register('confirmPassword')}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        disabled={loading}
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                        {errors.confirmPassword.message}
                    </p>
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
                <Label htmlFor="acceptTerms" className="text-sm text-gray-800 cursor-pointer">
                    Prihvatam uslove korišćenja i politiku privatnosti
                </Label>
            </div>
            {errors.acceptTerms && (
                <p className="text-sm text-red-500">
                    {errors.acceptTerms.message}
                </p>
            )}

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-md shadow-sm transition-colors"
                disabled={loading}
            >
                {loading ? 'Kreiram nalog...' : 'Kreiraj nalog'}
            </Button>
        </form>
    );
};