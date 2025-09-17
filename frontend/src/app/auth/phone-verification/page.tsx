'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Phone, Shield, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter as ShadDialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useVerifyPhone } from '@/hooks/use-phone-verification';

export default function PhoneVerificationPage() {
    const router = useRouter();
    const { user } = useAuth();
    const verifyPhone = useVerifyPhone();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);

    const normalizedPhone = useMemo(
        () => phoneNumber.replace(/\s+/g, ''),
        [phoneNumber],
    );
    const isPhoneValid = normalizedPhone.length >= 8;

    useEffect(() => {
        if (user?.phoneNumber) {
            setPhoneNumber(user.phoneNumber);
        }
    }, [user?.phoneNumber]);

    const handleSendCode = useCallback(() => {
        if (!isPhoneValid) {
            return;
        }

        setVerificationCode('');
        setIsOtpDialogOpen(true);
    }, [isPhoneValid]);


    const handleVerifyCode = useCallback(async (code: string) => {
        if (!code || code.length !== 6) {
            return;
        }

        try {
            await verifyPhone.mutateAsync({
                phoneNumber: normalizedPhone,
                code,
            });
            setIsVerified(true);
            setIsOtpDialogOpen(false);
            setVerificationCode('');
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch {
            setVerificationCode('');
        }
    }, [normalizedPhone, router, verifyPhone]);

    useEffect(() => {
        if (isOtpDialogOpen && verificationCode.length === 6) {
            void handleVerifyCode(verificationCode);
        }
    }, [handleVerifyCode, isOtpDialogOpen, verificationCode]);

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

    if (user?.phoneVerified && !isVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
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
                                    Vaš broj telefona je već potvrđen. Možete nastaviti sa korišćenjem platforme.
                                </p>
                                <Button onClick={() => router.push('/')}>Idi na početnu</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (isVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <Card className="shadow-xl">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center space-y-4 text-center">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                                <h2 className="text-2xl font-semibold text-green-600">
                                    Telefon je verifikovan!
                                </h2>
                                <p className="text-sm text-green-700">
                                    Preusmeravamo vas na početnu stranicu...
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Nazad
                </Button>

                <Card className="shadow-xl">
                    <CardHeader className="space-y-1 pb-4">
                        <div className="mb-2 flex items-center gap-2">
                            <Shield className="h-6 w-6 text-reading-accent" />
                            <CardTitle className="text-2xl">Verifikujte broj telefona</CardTitle>
                        </div>
                        <CardDescription className="text-base">
                            Unesite broj telefona na koji ćemo poslati šestocifreni kod za potvrdu.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-reading-text">Broj telefona</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-reading-text/40" />
                                <Input
                                    type="tel"
                                    placeholder="+381 61 234 5678"
                                    value={phoneNumber}
                                    onChange={(event) => setPhoneNumber(event.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <p className="text-xs text-reading-text/60">
                                Koristite međunarodni format (npr. +38164...).
                            </p>
                        </div>

                        {!isPhoneValid && phoneNumber && (
                            <Alert className="border-yellow-200 bg-yellow-50">
                                <AlertDescription className="text-xs text-yellow-800">
                                    Proverite da li ste uneli ispravan broj telefona.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            onClick={handleSendCode}
                            disabled={!isPhoneValid}
                            className="w-full"
                        >
                            Pošalji kod
                        </Button>
                    </CardContent>

                    <CardFooter>
                        <Button
                            variant="link"
                            className="w-full text-xs"
                            onClick={() => router.push('/')}
                        >
                            Preskoči za sada
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <Dialog
                open={isOtpDialogOpen}
                onOpenChange={(open) => {
                    setIsOtpDialogOpen(open);
                    if (!open) {
                        setVerificationCode('');
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-reading-accent" />
                            <DialogTitle className="text-2xl">Unesite verifikacioni kod</DialogTitle>
                        </div>
                        <DialogDescription className="text-base text-reading-text/80">
                            Poslali smo 6-cifreni kod na{' '}
                            <span className="font-medium text-reading-text">{formattedPhoneDisplay || phoneNumber}</span>
                        </DialogDescription>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-2 rounded border border-yellow-200 bg-yellow-50 p-2 text-left">
                                <p className="text-xs text-yellow-800 font-semibold">Razvojno okruženje</p>
                                <p className="text-xs text-yellow-800/80">
                                    Kod trenutno nije automatski poslat SMS-om. Pronađite ga ručno u bazi podataka
                                    (pgAdmin) i unesite ga ispod.
                                </p>

                            </div>
                        )}
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-reading-text/70">Unesite verifikacioni kod:</p>
                            <InputOTP
                                maxLength={6}
                                value={verificationCode}
                                onChange={setVerificationCode}
                                disabled={verifyPhone.isPending}
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

                        {verifyPhone.isPending && (
                            <p className="text-sm text-reading-text/60">Verifikacija u toku...</p>
                        )}

                        {verifyPhone.isError && (
                            <Alert className="border-red-200 bg-red-50">
                                <AlertDescription className="text-sm text-red-700">
                                    Neispravan kod. Pokušajte ponovo.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <ShadDialogFooter className="flex flex-col space-y-2">
                        <Button
                            onClick={() => handleVerifyCode(verificationCode)}
                            disabled={verificationCode.length !== 6 || verifyPhone.isPending}
                            className="w-full"
                        >
                            {verifyPhone.isPending ? 'Verifikuje se...' : 'Potvrdi kod'}
                        </Button>
                        <p className="text-xs text-reading-text/60 text-center w-full">
                            Kod ostaje važeći dok ne zatražite novi putem produkcionog SMS servisa.
                        </p>

                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsOtpDialogOpen(false);
                                setVerificationCode('');
                            }}
                            className="w-full"
                        >
                            Promeni broj telefona
                        </Button>
                    </ShadDialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
