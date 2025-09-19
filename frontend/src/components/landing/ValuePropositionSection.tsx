'use client';

import { Compass, Headphones, Layers, Sparkles, Users } from 'lucide-react';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface ValuePropositionSectionProps {
    isAuthenticated: boolean;
}

const steps = [
    {
        title: 'Kreiraš nalog',
        description: 'Registracija traje manje od jednog minuta. Unesi osnovne informacije i odmah dobijaš pristup personalizovanoj kontroli čitanja.'
    },
    {
        title: 'Izabereš svoj ritam',
        description: 'Probaj 3 dana potpuno besplatno. Nakon toga biraš plan koji ti odgovara – mesečno, godišnje ili premium klub za ekskluzivne naslove.'
    },
    {
        title: 'Čitaš gde god poželiš',
        description: 'Na telefonu, tabletu ili laptopu. Sve beleške i napredak se automatski sinhronizuju, tako da nikada ne gubiš mesto.'
    },
];

const benefits = [
    {
        icon: Sparkles,
        title: 'Personalizovane preporuke',
        description: 'Naša platforma uči šta voliš da čitaš i svakodnevno predlaže naslove koji odgovaraju tvom ukusu.'
    },
    {
        icon: Layers,
        title: 'Sve u jednom mestu',
        description: 'Čitaj e-knjige, slušaj audio formate, pravi beleške i deli listu želja sa prijateljima iz jedne aplikacije.'
    },
    {
        icon: Headphones,
        title: 'Mode čitanja za svaku situaciju',
        description: 'Noćni režim, audio naracija i kontrola veličine fonta obezbeđuju savršeno iskustvo čitanja.'
    },
    {
        icon: Users,
        title: 'Zajednica strastvenih čitalaca',
        description: 'Priključi se klubovima, diskusijama i izazovima koji te motivišu da čitaš više svakog meseca.'
    },
    {
        icon: Compass,
        title: 'Putovanje kroz žanrove',
        description: 'Otkrivaj nove autore i žanrove kroz tematske kolekcije koje se osvežavaju svake nedelje.'
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
                        <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/20 bg-library-linen/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-library-copper">
                            Kako funkcioniše ReadBookHub
                        </div>
                        <h2 className="font-display text-3xl font-semibold text-reading-text sm:text-4xl">
                            Sve što ti treba da čitanje postane navika koju obožavaš
                        </h2>
                        <p className="max-w-xl text-sm text-reading-text/70">
                            ReadBookHub je više od digitalne biblioteke – to je lični asistent za čitanje koji ti pomaže da pronađeš prave knjige, držiš fokus i deliš inspiraciju sa drugima.
                            Svaki korak je osmišljen da ti uštedi vreme i otkrije nove priče.
                        </p>

                        <div className="space-y-6">
                            {steps.map((step, index) => (
                                <div
                                    key={step.title}
                                    className="relative rounded-3xl border border-library-gold/15 bg-white/80 p-6 shadow-[0_18px_45px_rgba(31,41,51,0.12)] backdrop-blur"
                                >
                                    <div className="absolute -left-3 -top-3 flex h-12 w-12 items-center justify-center rounded-3xl bg-library-gold text-lg font-semibold text-library-midnight shadow-lg">
                                        {index + 1}
                                    </div>
                                    <h3 className="font-display text-lg font-semibold text-reading-text">{step.title}</h3>
                                    <p className="mt-2 text-sm text-reading-text/70">{step.description}</p>
                                </div>
                            ))}
                        </div>

                        {!isAuthenticated && (
                            <div className="rounded-3xl border border-library-highlight/30 bg-library-highlight/10 p-6 shadow-[0_18px_45px_rgba(31,41,51,0.15)]">
                                <p className="text-sm font-semibold text-reading-text">
                                    Tip: Aktiviraj probu sada i dobijaš personalizovani plan čitanja za prva tri dana – potpuno besplatno i bez obaveze.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-library-gold/20 bg-library-linen/80 p-8 shadow-[0_20px_60px_rgba(31,41,51,0.18)]">
                            <h3 className="font-display text-xl font-semibold text-reading-text">Zašto nas korisnici biraju</h3>
                            <p className="mt-3 text-sm text-reading-text/70">
                                Spojili smo tehnologiju i ljubav prema knjigama kako bismo kreirali iskustvo koje je istovremeno moderno, intuitivno i inspirativno.
                            </p>
                            <div className="mt-6 grid gap-5">
                                {benefits.map((benefit) => (
                                    <div key={benefit.title} className="flex gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-library-gold/25 bg-white text-library-gold shadow-sm">
                                            <benefit.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-display text-base font-semibold text-reading-text">{benefit.title}</h4>
                                            <p className="mt-1 text-sm text-reading-text/70">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-library-highlight/20 bg-white/85 p-8 shadow-[0_18px_60px_rgba(31,41,51,0.15)]">
                            <p className="text-sm text-reading-text/70">
                                “ReadBookHub mi je pomogao da se vratim čitanju. Preporuke su neverovatno precizne, a osećaj kao da imam sopstvenog knjižara koji zna šta volim.”
                            </p>
                            <p className="mt-4 text-sm font-semibold text-reading-text">Milica, članica od 2023. godine</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
