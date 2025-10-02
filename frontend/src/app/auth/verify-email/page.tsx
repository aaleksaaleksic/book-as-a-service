'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, MailCheck, Clock, AlertCircle, Sparkles } from 'lucide-react';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { useEmailVerification, useResendEmailVerification } from '@/hooks/use-auth-api';
import { toast } from '@/hooks/use-toast';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [value, setValue] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const verifyMutation = useEmailVerification();
    const resendMutation = useResendEmailVerification();

    // Cooldown timer for resend button
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleComplete = async (code: string) => {
        if (!email || code.length !== 6) return;

        try {
            await verifyMutation.mutateAsync({ email, code });
            setIsVerified(true);

            setTimeout(() => {
                router.push('/auth/login?verified=true');
            }, 2000);
        } catch (error: any) {
            console.error('Verification error:', error);
            setValue('');

            // Handle rate limiting
            if (error?.response?.status === 429) {
                toast({
                    title: "Previše pokušaja",
                    description: error?.response?.data?.message || "Molimo sačekajte pre sledećeg pokušaja.",
                    variant: "destructive",
                });
            }
        }
    };

    const handleResend = async () => {
        if (!email) return;

        try {
            await resendMutation.mutateAsync(email);
            setValue('');
            setResendCooldown(120); // 2 minute cooldown

            toast({
                title: "Kod poslat!",
                description: "Novi verifikacioni kod je poslat na vaš email.",
            });
        } catch (error: any) {
            console.error('Resend error:', error);

            // Handle rate limiting
            if (error?.response?.status === 429) {
                const message = error?.response?.data?.message;
                toast({
                    title: "Molimo sačekajte",
                    description: message || "Možete zatražiti novi kod za 2 minuta.",
                    variant: "destructive",
                });
            }
        }
    };

    useEffect(() => {
        // Auto-submit kada se unese 6 cifara
        if (value.length === 6) {
            handleComplete(value);
        }
    }, [value]);

    if (isVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                <div className="w-full max-w-md">
                    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                        <CardContent className="pt-12 pb-8">
                            <div className="flex flex-col items-center space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                    <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4">
                                        <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
                                    </div>
                                </div>

                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                        Email verifikovan!
                                    </h2>
                                    <p className="text-gray-600 text-lg">
                                        Uspešno ste aktivirali nalog
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="w-4 h-4 animate-spin" />
                                    <span>Preusmeravanje na prijavu...</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            <div className="w-full max-w-md">
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                                <MailCheck className="w-6 h-6" strokeWidth={2.5} />
                            </div>
                            <h1 className="text-2xl font-bold">Verifikujte email</h1>
                        </div>
                        <p className="text-emerald-50 text-sm">
                            Poslali smo 6-cifreni kod na vašu email adresu
                        </p>
                    </div>

                    <CardContent className="p-6 space-y-6">
                        {/* Email display */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">Email adresa:</span>
                            </div>
                            <p className="font-semibold text-gray-900 mt-1 break-all">{email}</p>
                        </div>

                        {/* OTP Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-500" />
                                Unesite verifikacioni kod
                            </label>
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={value}
                                    onChange={setValue}
                                    disabled={verifyMutation.isPending}
                                >
                                    <InputOTPGroup className="gap-2">
                                        <InputOTPSlot index={0} className="w-12 h-14 text-lg font-bold border-2 rounded-lg" />
                                        <InputOTPSlot index={1} className="w-12 h-14 text-lg font-bold border-2 rounded-lg" />
                                        <InputOTPSlot index={2} className="w-12 h-14 text-lg font-bold border-2 rounded-lg" />
                                        <InputOTPSlot index={3} className="w-12 h-14 text-lg font-bold border-2 rounded-lg" />
                                        <InputOTPSlot index={4} className="w-12 h-14 text-lg font-bold border-2 rounded-lg" />
                                        <InputOTPSlot index={5} className="w-12 h-14 text-lg font-bold border-2 rounded-lg" />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                        </div>

                        {/* Loading state */}
                        {verifyMutation.isPending && (
                            <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                <Clock className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">Verifikacija u toku...</span>
                            </div>
                        )}

                        {/* Error state */}
                        {verifyMutation.isError && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Neispravan kod</p>
                                    <p className="text-xs text-red-600 mt-1">Proverite kod i pokušajte ponovo</p>
                                </div>
                            </div>
                        )}

                        {/* Verify button */}
                        <Button
                            onClick={() => handleComplete(value)}
                            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-200"
                            disabled={value.length !== 6 || verifyMutation.isPending}
                        >
                            {verifyMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 animate-spin" />
                                    Verifikujem...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Verifikuj email
                                </span>
                            )}
                        </Button>

                        {/* Resend section */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="text-center space-y-3">
                                <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    Niste primili kod?
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={handleResend}
                                    disabled={resendMutation.isPending || resendCooldown > 0}
                                    className="w-full h-11 border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
                                >
                                    {resendMutation.isPending ? (
                                        <span className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 animate-spin" />
                                            Šalje se...
                                        </span>
                                    ) : resendCooldown > 0 ? (
                                        <span className="flex items-center gap-2 text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            Sačekajte {resendCooldown}s
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-emerald-700 font-medium">
                                            <MailCheck className="w-4 h-4" />
                                            Pošalji novi kod
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Help text */}
                        <p className="text-xs text-center text-gray-500 pt-2">
                            Kod je validan 24 sata. Proverite spam folder ako ne vidite email.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}