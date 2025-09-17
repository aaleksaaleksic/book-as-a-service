'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle,
    Phone,
    Shield,
    ShieldCheck,
    Info,
    AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';

export default function PhoneVerificationPage() {
    const router = useRouter();
    const { user } = useAuth();

    // State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Normalize phone number
    const normalizedPhone = useMemo(
        () => phoneNumber.replace(/\s+/g, '').replace(/-/g, ''),
        [phoneNumber],
    );

    // Validate phone
    const isPhoneValid = normalizedPhone.length >= 9;

    // Initialize phone from user
    useEffect(() => {
        if (user?.phoneNumber) {
            setPhoneNumber(user.phoneNumber);
        }
    }, [user?.phoneNumber]);

    // Resend timer
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    /**
     * Open OTP dialog - simulates sending code for local testing
     */
    const handleSendCode = useCallback(() => {
        if (!isPhoneValid) {
            toast({
                title: "Greška",
                description: "Molimo unesite valjan broj telefona",
                variant: "destructive",
            });
            return;
        }

        setVerificationCode('');
        setIsOtpDialogOpen(true);
        setResendTimer(60);

        // For local testing notification
        toast({
            title: "Kod je 'poslat'!",
            description: "Za lokalno testiranje, proverite kod u bazi podataka (tabela users, kolona phone_verification_code)",
            duration: 10000,
        });
    }, [isPhoneValid]);


    const handleVerifyCode = useCallback(async (code: string) => {
        if (!code || code.length !== 6) {
            return;
        }

        setIsVerifying(true);

        try {
            const response = await api.post('/api/v1/users/verify-phone', {
                phoneNumber: normalizedPhone,
                verificationCode: code,
            });

            if (response.data.success) {
                setIsVerified(true);
                setIsOtpDialogOpen(false);

                toast({
                    title: "Uspešno!",
                    description: "Telefon je uspešno verifikovan",
                });

                // KLJUČNA IZMENA - samo reload stranice
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            }
        } catch (error: any) {
            console.error('Phone verification failed:', error);
            setVerificationCode('');

            toast({
                title: "Greška",
                description: error?.response?.data?.message || "Neispravni verifikacioni kod",
                variant: "destructive",
            });
        } finally {
            setIsVerifying(false);
        }
    }, [normalizedPhone]);


    const handleResendCode = useCallback(() => {
        if (resendTimer > 0) return;

        setVerificationCode('');
        setResendTimer(60);

        toast({
            title: "Novi kod 'poslat'",
            description: "Proverite phone_verification_code u bazi podataka",
            duration: 8000,
        });
    }, [resendTimer]);

    // Auto-verify when code is complete
    useEffect(() => {
        if (isOtpDialogOpen && verificationCode.length === 6 && !isVerifying) {
            handleVerifyCode(verificationCode);
        }
    }, [verificationCode, isOtpDialogOpen, isVerifying, handleVerifyCode]);

    // Format phone for display
    const formattedPhoneDisplay = useMemo(() => {
        if (!normalizedPhone) return '';

        if (normalizedPhone.startsWith('+')) {
            return normalizedPhone;
        }

        if (normalizedPhone.startsWith('0')) {
            return `+381${normalizedPhone.slice(1)}`;
        }

        return normalizedPhone;
    }, [normalizedPhone]);

    // Already verified check
    if (user?.phoneVerified && !isVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="mb-6"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Nazad
                    </Button>

                    <Card className="shadow-xl">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center space-y-4 text-center">
                                <ShieldCheck className="h-16 w-16 text-reading-accent" />
                                <h2 className="text-2xl font-semibold text-reading-text">
                                    Telefon je već verifikovan
                                </h2>
                                <p className="text-sm text-reading-text/70">
                                    Vaš broj telefona je već potvrđen.
                                </p>
                                <Button onClick={() => router.push('/')}>
                                    Idi na početnu
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Success state
    if (isVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <Card className="shadow-xl">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center space-y-4 text-center">
                                <CheckCircle className="h-16 w-16 text-green-500 animate-bounce" />
                                <h2 className="text-2xl font-semibold text-green-600">
                                    Telefon je uspešno verifikovan!
                                </h2>
                                <p className="text-sm text-reading-text/70">
                                    Prebacujemo vas na početnu stranicu...
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="mb-6"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Nazad
                    </Button>

                    <Card className="shadow-xl">
                        <CardHeader>
                            <div className="flex items-center justify-center mb-4">
                                <Shield className="h-12 w-12 text-reading-accent" />
                            </div>
                            <CardTitle className="text-center text-2xl">
                                Verifikacija telefona
                            </CardTitle>
                            <CardDescription className="text-center">
                                Unesite broj telefona za verifikaciju
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Broj telefona</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+381 64 123 4567"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="text-center text-lg"
                                    />
                                    <p className="text-xs text-reading-text/60 text-center">
                                        Format: +381 64 123 4567
                                    </p>
                                </div>

                                {/* Local testing info */}
                                <Alert className="border-blue-200 bg-blue-50">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <AlertTitle className="text-sm font-medium text-blue-800">
                                        Lokalno testiranje
                                    </AlertTitle>
                                    <AlertDescription className="text-xs text-blue-700 mt-1">
                                        Kod će biti generisan u bazi podataka.
                                        SQL: <code className="bg-white px-1 py-0.5 rounded text-[10px] block mt-1">
                                        SELECT phone_verification_code FROM users WHERE phone_number = '{normalizedPhone}'
                                    </code>
                                    </AlertDescription>
                                </Alert>

                                {!isPhoneValid && phoneNumber && (
                                    <Alert className="border-yellow-200 bg-yellow-50">
                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription className="text-xs text-yellow-800">
                                            Broj telefona mora imati najmanje 9 cifara
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    onClick={handleSendCode}
                                    disabled={!isPhoneValid}
                                    className="w-full"
                                    size="lg"
                                >
                                    <Phone className="mr-2 h-4 w-4" />
                                    Pošalji kod
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* OTP Dialog */}
            <Dialog open={isOtpDialogOpen} onOpenChange={(open) => {
                if (!isVerifying) {
                    setIsOtpDialogOpen(open);
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Unesite verifikacioni kod</DialogTitle>
                        <DialogDescription>
                            Unesite 6-cifreni kod za broj {formattedPhoneDisplay}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="flex justify-center">
                            <InputOTP
                                value={verificationCode}
                                onChange={setVerificationCode}
                                maxLength={6}
                                disabled={isVerifying}
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

                        {isVerifying && (
                            <p className="text-center text-sm text-reading-text/60 animate-pulse">
                                Verifikacija u toku...
                            </p>
                        )}

                        <Alert className="border-blue-100 bg-blue-50">
                            <Info className="h-3 w-3 text-blue-600" />
                            <AlertDescription className="text-xs text-blue-700">
                                Proverite kod u bazi podataka (phone_verification_code)
                            </AlertDescription>
                        </Alert>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleResendCode}
                                disabled={resendTimer > 0 || isVerifying}
                                className="flex-1"
                            >
                                {resendTimer > 0 ? `Pošalji ponovo (${resendTimer}s)` : 'Pošalji ponovo'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (!isVerifying) {
                                        setIsOtpDialogOpen(false);
                                        setVerificationCode('');
                                    }
                                }}
                                disabled={isVerifying}
                                className="flex-1"
                            >
                                Otkaži
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}