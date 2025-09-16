'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Copy } from 'lucide-react';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { useEmailVerification, useResendEmailVerification } from '@/hooks/use-auth-api';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [value, setValue] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const verifyMutation = useEmailVerification();
    const resendMutation = useResendEmailVerification();

    // Za development - prikaži token iz baze
    // U tvojoj bazi vidim da je token: eac2c589-36ce-4be2-9659-af6b6a17a...
    // Ali pošto backend očekuje "123456" za mock, koristićemo to
    const TEST_CODE = "123456";

    const handleComplete = async (code: string) => {
        if (!email || code.length !== 6) return;

        try {
            await verifyMutation.mutateAsync({ email, code });
            setIsVerified(true);

            setTimeout(() => {
                router.push('/auth/login?verified=true');
            }, 2000);
        } catch (error) {
            console.error('Verification error:', error);
            setValue('');
        }
    };

    const handleResend = async () => {
        if (!email) return;

        try {
            await resendMutation.mutateAsync(email);
            setValue('');
        } catch (error) {
            console.error('Resend error:', error);
        }
    };

    const copyTestCode = () => {
        navigator.clipboard.writeText(TEST_CODE);
    };

    useEffect(() => {
        // Auto-submit kada se unese 6 cifara
        if (value.length === 6) {
            handleComplete(value);
        }
    }, [value]);

    if (isVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-book-green-50 to-book-green-100">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                            <h2 className="text-2xl font-bold text-green-600">Email verifikovan!</h2>
                            <p className="text-gray-600 text-center">
                                Preusmeravanje na prijavu...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-book-green-50 to-book-green-100">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 pb-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Mail className="w-6 h-6 text-reading-accent" />
                        <CardTitle className="text-2xl">Verifikujte email</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                        Poslali smo 6-cifreni kod na <span className="font-medium text-reading-text">{email}</span>
                    </CardDescription>

                    {/* Development mode - prikaži test kod */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-800 mb-1">Test mode:</p>
                            <div className="flex items-center justify-between">
                                <code className="text-sm font-mono">{TEST_CODE}</code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={copyTestCode}
                                    className="h-6 px-2"
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">Unesite verifikacioni kod:</p>
                        <InputOTP
                            maxLength={6}
                            value={value}
                            onChange={setValue}
                            disabled={verifyMutation.isPending}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    {verifyMutation.isPending && (
                        <p className="text-sm text-gray-500">
                            Verifikacija u toku...
                        </p>
                    )}

                    {verifyMutation.isError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            <p className="text-sm">
                                Neispravan kod. Pokušajte ponovo.
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={() => handleComplete(value)}
                        className="w-full"
                        disabled={value.length !== 6 || verifyMutation.isPending}
                    >
                        {verifyMutation.isPending ? 'Verifikujem...' : 'Verifikuj email'}
                    </Button>

                    <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-2">
                            Niste primili kod?
                        </p>
                        <Button
                            variant="outline"
                            onClick={handleResend}
                            disabled={resendMutation.isPending}
                            className="w-full"
                        >
                            {resendMutation.isPending ? 'Šalje se...' : 'Pošalji novi kod'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}