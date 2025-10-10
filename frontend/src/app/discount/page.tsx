'use client';

import { useState } from 'react';
import { Gift, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { dt } from '@/lib/design-tokens';
import { useGeneratePublicDiscount, usePublicGeneratorAvailability } from '@/hooks/use-discounts';
import { useToast } from '@/hooks/use-toast';

export default function PublicDiscountPage() {
    const [email, setEmail] = useState('');
    const [discountData, setDiscountData] = useState<{
        code: string;
        expiresAt: string;
        email: string;
    } | null>(null);

    const { toast } = useToast();
    const generateDiscount = useGeneratePublicDiscount();
    const { data: availabilityData } = usePublicGeneratorAvailability();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        generateDiscount.mutate(
            { email },
            {
                onSuccess: (data) => {
                    if (data.success && data.discount) {
                        setDiscountData({
                            code: data.discount.code,
                            expiresAt: data.discount.expiresAt,
                            email: data.discount.email,
                        });
                        toast({
                            title: 'Uspešno!',
                            description: 'Kod za popust je poslat na vaš email',
                        });
                    } else {
                        toast({
                            title: 'Greška',
                            description: data.message || 'Došlo je do greške',
                            variant: 'destructive',
                        });
                    }
                },
                onError: (error: any) => {
                    toast({
                        title: 'Greška',
                        description: error.response?.data?.message || 'Greška pri povezivanju sa serverom',
                        variant: 'destructive',
                    });
                },
            }
        );
    };

    return (
        <div className="min-h-screen bg-library-parchment/95">
            <div className="absolute inset-0 -z-10 bg-hero-grid opacity-70" aria-hidden="true" />

            <div className={cn(dt.layouts.pageContainer, 'relative z-10 py-20')}>
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-library-gold to-amber-500 mb-6 shadow-lg">
                            <Gift className="w-10 h-10 text-white" />
                        </div>
                        <h1 className={cn(dt.typography.pageTitle, 'text-sky-950 mb-4')}>
                            Dobij 10% Popusta!
                        </h1>
                        <p className="text-lg text-sky-900/80 max-w-xl mx-auto">
                            Unesite vašu email adresu i dobićete kod za <strong>10% popusta</strong> na bilo koju pretplatu.
                        </p>
                    </div>

                    {/* Card */}
                    <div className={cn(dt.components.bookCard, 'backdrop-blur-sm')}>
                        {!discountData ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-sky-950 mb-2">
                                        Email adresa
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-700" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="vas.email@primer.com"
                                            required
                                            className="pl-12 h-12 bg-white border-sky-200 focus:border-library-gold text-sky-950"
                                            disabled={generateDiscount.isPending}
                                        />
                                    </div>
                                </div>

                                {!availabilityData?.available && (
                                    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-800">
                                            Javni generator popust kodova više nije dostupan. Bio je dostupan do 10. novembra 2025.
                                        </p>
                                    </div>
                                )}

                                <div className="bg-amber-50 border-l-4 border-library-gold p-4 rounded-r-lg">
                                    <h3 className="font-semibold text-sky-950 mb-2 text-sm">📌 Važno:</h3>
                                    <ul className="text-sm text-sky-900/80 space-y-1 list-disc list-inside">
                                        <li>Kod važi <strong>5 dana</strong> od generisanja</li>
                                        <li>Kod može biti iskorišćen samo <strong>jednom</strong></li>
                                        <li>Primićete email sa detaljima</li>
                                        <li>Generator dostupan do <strong>10. novembra 2025.</strong></li>
                                    </ul>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={generateDiscount.isPending || !availabilityData?.available}
                                    className={cn(
                                        dt.interactive.buttonPrimary,
                                        'w-full h-12 text-lg',
                                        'bg-library-gold hover:bg-library-gold/90 text-library-midnight'
                                    )}
                                >
                                    {generateDiscount.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Generisanje...
                                        </>
                                    ) : (
                                        <>
                                            <Gift className="w-5 h-5 mr-2" />
                                            Dobij kod za popust
                                        </>
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold text-sky-950 mb-2">Čestitamo!</h2>
                                    <p className="text-sky-900/80">
                                        Vaš kod za popust je uspešno generisan i poslat na <strong>{discountData.email}</strong>
                                    </p>
                                </div>

                                {/* Discount Code Display */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-3 border-dashed border-green-500 rounded-xl p-8">
                                    <p className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wider">
                                        Vaš kod za popust
                                    </p>
                                    <div className="text-4xl font-bold tracking-[0.3em] text-green-800 font-mono my-4">
                                        {discountData.code}
                                    </div>
                                    <p className="text-lg font-semibold text-green-700">10% popusta</p>
                                </div>

                                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-left">
                                    <h3 className="font-semibold text-amber-900 mb-2 text-sm">⏰ Važno:</h3>
                                    <ul className="text-sm text-amber-900/80 space-y-1">
                                        <li>Kod ističe: <strong>{discountData.expiresAt}</strong></li>
                                        <li>Proverite vaš email za dodatne informacije</li>
                                        <li>Sačuvajte kod - treba vam ga prilikom plaćanja</li>
                                    </ul>
                                </div>

                                <Button
                                    onClick={() => (window.location.href = '/pricing')}
                                    className={cn(
                                        dt.interactive.buttonPrimary,
                                        'w-full h-12 text-lg',
                                        'bg-library-gold hover:bg-library-gold/90 text-library-midnight'
                                    )}
                                >
                                    Pogledaj planove
                                </Button>

                                <button
                                    onClick={() => {
                                        setDiscountData(null);
                                        setEmail('');
                                    }}
                                    className="text-sm text-sky-700 hover:text-sky-900 underline"
                                >
                                    Generiši još jedan kod
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="mt-8 text-center text-sm text-sky-900/70">
                        <p>
                            Imate pitanja? Kontaktirajte nas na{' '}
                            <a href="mailto:bookotecha@gmail.com" className="text-library-gold hover:underline font-semibold">
                                bookotecha@gmail.com
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
