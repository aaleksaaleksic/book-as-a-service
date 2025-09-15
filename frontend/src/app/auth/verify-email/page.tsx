'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { useEmailVerification, useResendEmailVerification } from '@/hooks/use-auth-api';
import { dt } from '@/lib/design-tokens';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const [code, setCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const verifyMutation = useEmailVerification();
    const resendMutation = useResendEmailVerification();

    const handleVerify = async () => {
        if (!email || !code) return;

        try {
            await verifyMutation.mutateAsync({ email, code });
            setIsVerified(true);

            setTimeout(() => {
                router.push('/auth/login?verified=true');
            }, 3000);
        } catch (error) {
        }
    };

    const handleResend = async () => {
        if (!email) return;

        try {
            await resendMutation.mutateAsync(email);
        } catch (error) {
        }
    };

    if (isVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-book-green-50 to-book-green-100">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                            <h2 className="text-2xl font-bold text-green-600">Email verifikovan!</h2>
                            <p className="text-gray-600">
                                Vaš email je uspešno verifikovan. Preusmjeravanje na prijavu...
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
                        Unesite kod koji smo poslali na {email}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Verifikacioni kod</Label>
                        <Input
                            id="code"
                            type="text"
                            placeholder="Unesite 6-cifreni kod"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            maxLength={6}
                            className="text-center text-2xl tracking-widest"
                        />
                    </div>

                    <Button
                        onClick={handleVerify}
                        className="w-full"
                        disabled={!code || code.length !== 6 || verifyMutation.isPending}
                    >
                        {verifyMutation.isPending ? 'Verifikujem...' : 'Verifikuj email'}
                    </Button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
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
                </CardContent>
            </Card>
        </div>
    );
}