'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { dt } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plans = [
    {
        id: 'monthly',
        name: 'Mesečna pretplata',
        price: {
            amount: '1.200',
            currency: 'RSD',
        },
        billing: '/mesec',
        paymentPolicy: 'Automatska mesečna naplata',
        href: '/auth/register',
        accent: false,
    },
    {
        id: 'six-month',
        name: 'Šestomesečna pretplata',
        price: {
            amount: '5.990',
            currency: 'RSD',
            originalPrice: '7.200',
        },
        billing: '/6 meseci',
        paymentPolicy: 'Jednokratna uplata, bez automatskog obnavljanja',
        href: '/auth/register',
        accent: true,
    },
    {
        id: 'yearly',
        name: 'Godišnja pretplata',
        price: {
            amount: '9.990',
            currency: 'RSD',
            originalPrice: '12.000',
        },
        billing: '/godinu',
        paymentPolicy: 'Jednokratna uplata, bez automatskog obnavljanja',
        href: '/auth/register',
        accent: false,
    },
] as const;

export default function PricingPage() {
    return (
        <div className={cn(dt.layouts.mainPage, 'bg-library-parchment/95 text-sky-950')}>
            <div className="absolute inset-0 -z-10 bg-hero-grid opacity-70" aria-hidden="true" />

            <main className="relative z-10">
                <section className={cn(dt.layouts.pageContainer, 'py-16')}>
                    {/* Header */}
                    <div className="mx-auto max-w-3xl text-center">
                        <Badge className="mx-auto inline-flex items-center gap-2 rounded-full border border-library-gold/30 bg-library-azure/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-sky-950">
                            Cenovnik
                        </Badge>
                        <h1 className={cn(dt.typography.pageTitle, 'mt-6')}>
                            Odaberite plan koji vam odgovara
                        </h1>
                        <p className={cn(dt.typography.body, 'mt-4 text-sky-950/80')}>
                            Pristupite celoj biblioteci sa bilo kog uređaja. Otkažite kada god poželite.
                        </p>
                    </div>

                    {/* AI Promo Section */}
                    <div className="mx-auto mt-12 max-w-4xl">
                        <div className="relative overflow-hidden rounded-[32px] border border-library-highlight/30 bg-gradient-to-br from-library-azure/20 via-library-parchment/95 to-library-highlight/10 p-8 shadow-[0_30px_80px_rgba(84,166,255,0.25)] md:p-12">
                            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-library-highlight/20 blur-3xl" aria-hidden="true" />
                            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-library-gold/15 blur-3xl" aria-hidden="true" />

                            <div className="relative z-10 text-center">

                                <h2 className={cn(dt.typography.subsectionTitle, 'mt-6 text-sky-950')}>
                                    Učite brže uz najnoviju AI tehnologiju
                                </h2>

                                <p className={cn(dt.typography.body, 'mx-auto mt-4 max-w-2xl text-sky-950/80')}>
                                    Svaki plan uključuje <strong className="font-semibold text-sky-950">Google Gemini 2.5</strong> asistenta integrisanog direktno u čitač.
                                    Označite tekst i dobijte trenutna objašnjenja koncepata, prevode, sažetke i odgovore na pitanja —
                                    sve dok čitate.
                                </p>

                                <div className="mx-auto mt-8 grid max-w-2xl gap-4 text-left md:grid-cols-3">
                                    <div className="rounded-2xl border border-library-gold/25 bg-white/60 p-4 backdrop-blur-sm">

                                        <h3 className="font-semibold text-sky-950">Objašnjenje koncepata</h3>
                                        <p className="mt-1 text-sm text-sky-950/70">
                                            Razumite složene teme trenutno
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-library-gold/25 bg-white/60 p-4 backdrop-blur-sm">

                                        <h3 className="font-semibold text-sky-950">Sažimanje sadržaja</h3>
                                        <p className="mt-1 text-sm text-sky-950/70">
                                            Brže savladajte ključne informacije
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-library-gold/25 bg-white/60 p-4 backdrop-blur-sm">
                                        <h3 className="font-semibold text-sky-950">Pitanja i odgovori</h3>
                                        <p className="mt-1 text-sm text-sky-950/70">
                                            Postavite bilo koje pitanje o tekstu
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={cn(
                                    dt.components.card,
                                    'relative flex h-full flex-col p-8',
                                    plan.accent && 'ring-2 ring-library-gold/40 shadow-[0_20px_60px_rgba(228,179,76,0.15)]'
                                )}
                            >
                                {plan.accent && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="rounded-full border border-library-gold/30 bg-library-gold px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-sky-950 shadow-lg">
                                            Najpopularniji
                                        </Badge>
                                    </div>
                                )}

                                {/* Plan Name - Fixed height */}
                                <div className="h-16 flex items-center justify-center">
                                    <h2 className={cn(dt.typography.subsectionTitle, 'text-center')}>
                                        {plan.name}
                                    </h2>
                                </div>

                                {/* Price - Fixed height */}
                                <div className="mt-6 h-40 flex flex-col items-center justify-center text-center">
                                    {plan.price.amount ? (
                                        <div className="h-8 mb-2">
                                            <span className="font-bebas text-xl font-semibold text-sky-950/40 line-through">
                                                {plan.price.amount} {plan.price.currency}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="h-8 mb-2" />
                                    )}
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="font-bebas text-5xl font-bold text-sky-950">
                                            {plan.price.amount}
                                        </span>
                                        <span className="font-bebas text-2xl font-semibold text-sky-950">
                                            {plan.price.currency}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-sky-950/70">
                                        {plan.billing}
                                    </p>
                                </div>

                                {/* Payment Policy - Fixed height */}
                                <div className="mt-6 h-24 flex items-center">
                                    <div className="w-full rounded-lg border border-library-gold/25 bg-library-azure/20 p-4">
                                        <p className="text-center text-sm font-medium text-sky-950/90">
                                            {plan.paymentPolicy}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <Button
                                        asChild
                                        className={cn(
                                            'w-full rounded-full py-6 text-base font-semibold shadow-[0_18px_40px_rgba(228,179,76,0.25)] transition-transform hover:-translate-y-1',
                                            'bg-library-gold text-sky-950 hover:bg-library-gold/90'
                                        )}
                                    >
                                        <Link href={plan.href}>Odaberi plan</Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Info */}
                    <div className="mx-auto mt-16 max-w-2xl text-center">
                        <div className={cn(dt.components.infoBox)}>
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-950">
                                Započnite danas
                            </p>
                            <p className={cn(dt.typography.body, 'mt-3 text-sky-950/80')}>
                                Sve pretplate uključuju pristup celoj biblioteci digitalnih knjiga.
                                Čitajte na bilo kom uređaju, bilo kada, bilo gde.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
