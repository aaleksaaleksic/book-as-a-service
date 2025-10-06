'use client';

import { Compass, Headphones, Layers, Sparkles, Users } from 'lucide-react';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface ValuePropositionSectionProps {
    isAuthenticated: boolean;
}

const steps = [
    {
        title: 'Kreirajte nalog',
        description: 'Registracija traje manje od jednog minuta. Unesite osnovne informacije i potvrdite email i broj telefona.'
    },
    {
        title: 'Probajte režim čitanja',
        description: 'Prelistajte promo poglavlja knjiga u našem čitaču.'
    },
    {
        title: 'Odaberite plan koji vam odgovara',
        description: 'Od naša tri dostupna plana pretplate izaberite onaj koji vam najviše odgovara.'
    },
    {
        title: 'Uživajte u čitanju',
        description: 'Uživajte u čitanju knjiga koje vas zanimaju i predlažite naslove koje bi hteli da vidite na platformi'
    },
];


export const ValuePropositionSection = ({ isAuthenticated }: ValuePropositionSectionProps) => {
    return (
        <section className="relative overflow-hidden border-y border-library-gold/15 bg-gradient-to-br from-library-fog via-library-parchment to-white">
            <div className="absolute -left-10 top-16 h-40 w-40 rounded-full border border-library-highlight/20 opacity-60 blur-2xl" />
            <div className="absolute -right-10 bottom-10 h-48 w-48 rounded-[36px] border border-dashed border-library-gold/25 opacity-40" />

            <div className={cn(dt.layouts.pageContainer, 'relative z-10 py-20')}>
                <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/20 bg-library-linen/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-sky-950">
                            Kako funkcioniše Bookotecha?
                        </div>
                        <h2 className={dt.typography.pageTitle}>
                            Sve što ti treba da započneš korišćenje ove platforme
                        </h2>

                        <div className="space-y-6">
                            {steps.map((step, index) => (
                                <div
                                    key={step.title}
                                    className={dt.components.stepCard}
                                >
                                    <div className="absolute -left-3 -top-3 flex h-12 w-12 items-center justify-center rounded-3xl bg-library-gold text-lg font-semibold text-library-midnight shadow-lg">
                                        {index + 1}
                                    </div>
                                    <h3 className={dt.typography.stepTitle}>{step.title}</h3>
                                    <p className={cn(dt.typography.muted, 'mt-2')}>{step.description}</p>
                                </div>
                            ))}
                        </div>

                        {!isAuthenticated && (
                            <div className="rounded-3xl border border-library-highlight/30 bg-library-highlight/10 p-6 shadow-[0_18px_45px_rgba(31,41,51,0.15)]">
                                <p className="text-sm font-semibold text-reading-text">
                                    Tip: Prelistajte probna poglavlja knjiga koje vas interesuju i isprobajte režim čitanja.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-library-gold/20 bg-library-linen/80 p-8 shadow-[0_20px_60px_rgba(31,41,51,0.18)]">
                            <h3 className={dt.typography.subsectionTitle}>Šta nudimo?</h3>
                            <p className={cn(dt.typography.muted, 'mt-3')}>
                                Pretplatom na našu platformu dobijate pristup svim dostupnim knjigama. Kliknite ovde za listu knjiga i njihova promo poglavlja.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-library-highlight/20 bg-white/85 p-8 shadow-[0_18px_60px_rgba(31,41,51,0.15)]">
                            <p className={dt.typography.muted}>
                                "Bookotecha nam omugućava da imamo sve knjige koje volimo na jednom mestu. "
                            </p>
                            <p className={cn(dt.typography.muted, 'mt-4 font-semibold', `text-${dt.colors.text}`)}>Aleksa, jedan od osnivača Bookotecha platforme </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
