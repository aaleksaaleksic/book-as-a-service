'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useEmailVerification, useResendEmailVerification } from '@/hooks/use-auth-api';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [code, setCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const verifyMutation = useEmailVerification();
    const resendMutation = useResendEmailVerification();

    const handleVerify = async () => {
        if (!email || code.length !== 6) return;

        try {
            await verifyMutation.mutateAsync({ email, code });
            setIsVerified(true);

            setTimeout(() => {
                router.push('/auth/login?verified=true');
            }, 2000);
        } catch (error) {
            // Toast prikazuje grešku
        }
    };

    const handleResend = async () => {
        if (!email) return;

        try {
            await resendMutation.mutateAsync(email);
            setCode('');
        } catch (error) {
            // Toast prikazuje grešku
        }
    };

    useEffect(() => {
        if (code.length === 6) {
            handleVerify();
        }
    }, [code]);

    if (isVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-book-green-50 to-book-green-100">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                            <h2 className="text-2xl font-bold text-green-600">Email verifikovan!</h2>
                            <p className="text-gray-600">
                                Preusmjeravanje na prijavu...
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
                <CardHeader className="text-center px-4 sm:px-6">
                    <Mail className="w-10 h-10 sm:w-12 sm:h-12 text-reading-accent mx-auto mb-4" />
                    <CardTitle className="text-xl sm:text-2xl">
                        Verifikujte email
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                        Unesite 6-cifreni kod koji smo poslali na
                        <br />
                        <span className="font-medium text-reading-text break-all">{email}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 px-4 sm:px-6">
                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 text-sm">
                            Za test koristite kod: <strong>123456</strong>
                        </AlertDescription>
                    </Alert>

                    <div className="flex justify-center">
                        <InputOTP
                            maxLength={6}
                            value={code}
                            onChange={(value) => setCode(value)}
                            disabled={verifyMutation.isPending}
                            className="gap-1 sm:gap-2"
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-10 h-10 sm:w-12 sm:h-12" />
                                <InputOTPSlot index={1} className="w-10 h-10 sm:w-12 sm:h-12" />
                                <InputOTPSlot index={2} className="w-10 h-10 sm:w-12 sm:h-12" />
                                <InputOTPSlot index={3} className="w-10 h-10 sm:w-12 sm:h-12" />
                                <InputOTPSlot index={4} className="w-10 h-10 sm:w-12 sm:h-12" />
                                <InputOTPSlot index={5} className="w-10 h-10 sm:w-12 sm:h-12" />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    {verifyMutation.isPending && (
                        <p className="text-center text-sm text-gray-500">
                            Verifikujem kod...
                        </p>
                    )}

                    {verifyMutation.isError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                Neispravan kod. Pokušajte ponovo.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                            Niste primili kod?
                        </p>
                        <Button
                            variant="ghost"
                            onClick={handleResend}
                            disabled={resendMutation.isPending}
                            size="sm"
                        >
                            {resendMutation.isPending ? 'Šalje se...' : 'Pošalji ponovo'}
                        </Button>
                    </div>

                    <Button
                        onClick={handleVerify}
                        className="w-full"
                        disabled={code.length !== 6 || verifyMutation.isPending}
                    >
                        Verifikuj email
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}