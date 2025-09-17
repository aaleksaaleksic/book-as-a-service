'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSendPhoneVerification, useVerifyPhone } from '@/hooks/use-phone-verification';
import { dt } from '@/lib/design-tokens';

export default function PhoneVerificationPage() {
    const router = useRouter();
    const { user } = useAuth();
    const sendVerification = useSendPhoneVerification();
    const verifyPhone = useVerifyPhone();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);

    const handleSendCode = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            return;
        }

        try {
            await sendVerification.mutateAsync(phoneNumber);
            setCodeSent(true);
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            return;
        }

        try {
            await verifyPhone.mutateAsync({
                phoneNumber,
                code: verificationCode
            });
            router.push('/');
        } catch (error) {
            // Error handled in hook
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Nazad
                </Button>

                <Card className="shadow-xl">
                    <CardHeader className="space-y-4 text-center">
                        <div className="w-16 h-16 bg-reading-accent text-white rounded-2xl flex items-center justify-center mx-auto">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-reading-text">
                            Verifikuj broj telefona
                        </h1>
                        <p className="text-sm text-reading-text/70">
                            Poslaćemo vam kod za verifikaciju
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {!codeSent ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-reading-text">
                                        Broj telefona
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-reading-text/40" />
                                        <Input
                                            type="tel"
                                            placeholder="+381 61 234 5678"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSendCode}
                                    disabled={sendVerification.isPending}
                                    className="w-full"
                                >
                                    {sendVerification.isPending ? 'Šalje se...' : 'Pošalji kod'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-reading-text">
                                        Verifikacioni kod
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="123456"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        maxLength={6}
                                        className="text-center text-lg font-semibold tracking-widest"
                                    />
                                </div>

                                <Button
                                    onClick={handleVerifyCode}
                                    disabled={verifyPhone.isPending}
                                    className="w-full"
                                >
                                    {verifyPhone.isPending ? 'Verifikuje se...' : 'Verifikuj'}
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setCodeSent(false);
                                        setVerificationCode('');
                                    }}
                                    className="w-full"
                                >
                                    Promeni broj
                                </Button>
                            </>
                        )}
                    </CardContent>

                    <CardFooter>
                        <Button
                            variant="link"
                            onClick={() => router.push('/')}
                            className="w-full text-xs"
                        >
                            Preskoči za sada
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}