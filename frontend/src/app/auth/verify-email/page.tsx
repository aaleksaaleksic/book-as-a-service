'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useEmailVerification, useResendEmailVerification } from '@/hooks/use-auth-api';
import { dt } from '@/lib/design-tokens';

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
            // Toast prikazuje grešku automatski
        }
    };

    const handleResend = async () => {
        if (!email) return;

        try {
            await resendMutation.mutateAsync(email);
            setCode(''); // Reset kod
        } catch (error) {
            // Toast prikazuje grešku
        }
    };

    // Auto-submit kada se unese 6 cifara
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
                <CardHeader className="text-center">
                    <Mail className="w-12 h-12 text-reading-accent mx-auto mb-4" />
                    <CardTitle className={dt.typography.cardTitle}>
                        Verifikujte email
                    </CardTitle>
                    <CardDescription>
                        Unesite 6-cifreni kod koji smo poslali na
                        <br />
                        <span className="font-medium text-reading-text">{email}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Test poruka */}
                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            Za test koristite kod: <strong>123456</strong>
                        </AlertDescription>
                    </Alert>

                    {/* OTP Input */}
                    <div className="flex justify-center">
                        <InputOTP
                            maxLength={6}
                            value={code}
                            onChange={(value) => setCode(value)}
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

                    {/* Loading state */}
                    {verifyMutation.isPending && (
                        <p className="text-center text-sm text-gray-500">
                            Verifikujem kod...
                        </p>
                    )}

                    {/* Error message */}
                    {verifyMutation.isError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Neispravan kod. Pokušajte ponovo.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Resend section */}
                    <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                            Niste primili kod?
                        </p>
                        <Button
                            variant="ghost"
                            onClick={handleResend}
                            disabled={resendMutation.isPending}
                        >
                            {resendMutation.isPending ? 'Šalje se...' : 'Pošalji ponovo'}
                        </Button>
                    </div>

                    {/* Manual verify button (opciono) */}
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