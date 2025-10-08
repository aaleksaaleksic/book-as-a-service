'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { CheckCircle, Mail, MailCheck, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useEmailVerification, useResendEmailVerification } from '@/hooks/use-auth-api';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
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
            <AuthPageLayout
                badge="Čestitamo"
                title="Email je uspešno verifikovan"
                description="Vaš nalog je spreman za korišćenje. Preusmeravamo vas na stranicu za prijavu."
            >
                <div className="flex flex-col items-center space-y-8 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-library-gold/40 blur-3xl" aria-hidden="true" />
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-library-gold to-library-azure text-white shadow-[0_25px_60px_rgba(12,35,64,0.25)]">
                            <CheckCircle className="h-12 w-12" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="font-reading text-lg text-sky-950/80">
                            Email adresa <span className="font-semibold text-sky-950">{email}</span> je potvrđena.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-sky-950/70">
                            <Clock className="h-4 w-4 animate-spin" />
                            <span>Preusmeravanje na prijavu...</span>
                        </div>
                    </div>
                </div>
            </AuthPageLayout>
        );
    }

    const leftExtras = (
        <div className="grid gap-4 text-left font-ui text-sky-950/80">
            <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-library-azure/10 text-library-azure">
                    <Sparkles className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold text-sky-950">Proverite inbox</p>
                    <p className="text-sm text-sky-950/70">Kod stiže u roku od jednog minuta. Ako ga nema, proverite spam.</p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-library-azure/10 text-library-azure">
                    <Mail className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold text-sky-950">Vaša email adresa</p>
                    <p className="text-sm text-sky-950/70 break-all">{email || 'Proverite email iz prethodnog koraka.'}</p>
                </div>
            </div>
        </div>
    );

    const footer = (
        <p className="text-sm">
            Niste dobili kod? Ponovo ga pošaljite ili kontaktirajte podršku na{' '}
            <span className="font-semibold text-library-azure">support@bookotecha.rs</span>.
        </p>
    );

    return (
        <AuthPageLayout
            badge="Poslednji korak"
            title="Verifikujte email i aktivirajte nalog"
            description="Unesite šestocifreni kod koji smo vam poslali kako bismo potvrdili da ova adresa pripada vama."
            leftExtras={leftExtras}
            footer={footer}
        >
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h2 className={cn(dt.typography.subsectionTitle, 'text-3xl text-sky-950')}>Verifikacioni kod</h2>
                    <p className="font-ui text-sm text-sky-950/70">
                        Kod je važeći 24 sata. Kada unesete svih šest cifara, verifikacija će se pokrenuti automatski.
                    </p>
                </div>

                <div className="rounded-3xl border border-library-highlight/30 bg-white/80 p-6 text-left shadow-[0_12px_45px_rgba(12,35,64,0.18)]">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-950/70">
                        <Mail className="h-4 w-4" />
                        Email adresa
                    </div>
                    <p className="mt-2 font-ui text-base text-sky-950 break-all">{email || 'Nepoznata adresa'}</p>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-950/60">
                        <Sparkles className="h-4 w-4 text-library-azure" />
                        Unesite kod
                    </label>
                    <div className="flex justify-center">
                        <InputOTP
                            maxLength={6}
                            value={value}
                            onChange={setValue}
                            disabled={verifyMutation.isPending}
                        >
                            <InputOTPGroup className="gap-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <InputOTPSlot
                                        key={index}
                                        index={index}
                                        className="h-16 w-12 rounded-2xl border-library-highlight/30 bg-white/80 text-center text-xl font-semibold text-sky-950 shadow-[0_10px_25px_rgba(12,35,64,0.12)] transition focus:border-library-gold/60 focus:outline-none focus:ring-2 focus:ring-library-gold/25"
                                    />
                                ))}
                            </InputOTPGroup>
                        </InputOTP>
                    </div>
                </div>

                {verifyMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-library-highlight/30 bg-library-azure/10 p-3 text-sm font-medium text-library-azure">
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Verifikacija u toku...</span>
                    </div>
                )}

                {verifyMutation.isError && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-400/40 bg-red-100/80 p-4 text-red-800">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">Neispravan kod</p>
                            <p className="text-xs text-red-700">Proverite kod i pokušajte ponovo.</p>
                        </div>
                    </div>
                )}

                <Button
                    onClick={() => handleComplete(value)}
                    className={cn(
                        dt.interactive.buttonPrimary,
                        'w-full justify-center py-5 text-base font-semibold uppercase tracking-[0.18em]'
                    )}
                    disabled={value.length !== 6 || verifyMutation.isPending}
                >
                    {verifyMutation.isPending ? (
                        <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4 animate-spin" />
                            Verifikujem...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Verifikuj email
                        </span>
                    )}
                </Button>

                <div className="space-y-3 rounded-3xl border border-library-highlight/30 bg-white/70 p-6 text-center shadow-[0_12px_40px_rgba(12,35,64,0.15)]">
                    <p className="flex items-center justify-center gap-2 text-sm font-medium text-sky-950/70">
                        <Mail className="h-4 w-4" />
                        Niste primili kod?
                    </p>
                    <Button
                        variant="outline"
                        onClick={handleResend}
                        disabled={resendMutation.isPending || resendCooldown > 0}
                        className="w-full justify-center rounded-full border-2 border-library-highlight/40 bg-white/90 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sky-950 transition hover:bg-library-azure/10"
                    >
                        {resendMutation.isPending ? (
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 animate-spin" />
                                Šalje se...
                            </span>
                        ) : resendCooldown > 0 ? (
                            <span className="flex items-center gap-2 text-sky-950/60">
                                <Clock className="h-4 w-4" />
                                Sačekajte {resendCooldown}s
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-library-azure">
                                <MailCheck className="h-4 w-4" />
                                Pošalji novi kod
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </AuthPageLayout>
    );
}