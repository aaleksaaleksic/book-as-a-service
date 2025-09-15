'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { dt } from '@/lib/design-tokens';

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email je obavezan')
        .email('Unesite validnu email adresu'),
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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleFormSubmit = async (data: LoginFormData) => {
        try {
            await onSubmit(data);
        } catch (error) {
            // Error handling se vrši u parent komponenti
        }
    };

    const loading = isLoading || isSubmitting;

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center space-y-2">
                <CardTitle className={`${dt.typography.cardTitle} text-reading-text`}>
                    Prijavite se
                </CardTitle>
                <CardDescription className={dt.typography.body}>
                    Unesite vaše podatke za pristup
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

                    {/* Email Field */}
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

                    {/* Password Field */}
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
                        {errors.password && (
                            <p className={`${dt.typography.small} text-red-500`}>
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className={`w-full ${dt.interactive.buttonPrimary}`}
                        disabled={loading}
                    >
                        {loading ? 'Prijavljujem...' : 'Prijavite se'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};