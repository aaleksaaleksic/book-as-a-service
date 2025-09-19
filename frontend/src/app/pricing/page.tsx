import Link from 'next/link';
import { Check, Clock, MessageCircle, ShieldCheck, Sparkles, Users, BookOpen, Crown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { dt } from '@/lib/design-tokens';

const baseFeatures = [
    'Neograničeno čitanje 12.000+ digitalnih naslova',
    'Personalizovane preporuke i dinamične liste knjiga',
    'Sinhronizacija beleški, podsetnika i napretka na svim uređajima',
    'Ekskluzivna zajednica čitalaca i tematski klubovi',
];

const plans = [
    {
        id: 'monthly',
        name: 'Osnovni plan',
        badge: 'Mesečno članstvo',
        description:
            'Idealno ako želiš punu fleksibilnost i pristup celom katalogu dok istražuješ ReadBookHub.',
        price: '999 RSD',
        billing: '/mesec',
        highlight: 'Aktiviraj kada želiš, otkaži u par klikova',
        cta: 'Započni mesečnu pretplatu',
        href: '/auth/register',
        note: 'Naplata se vrši mesečno – bez skrivenih troškova.',
        features: baseFeatures,
        accent: false,
    },
    {
        id: 'yearly',
        name: 'Godišnji plan',
        badge: 'Sa popustom',
        description:
            'Za neumorne čitaoce koji žele maksimum sadržaja tokom cele godine uz značajnu uštedu.',
        price: '9.999 RSD',
        billing: 'godišnje (~833 RSD/mesec)',
        highlight: 'Ušteda 16% u odnosu na mesečni plan',
        cta: 'Aktiviraj godišnje članstvo',
        href: '/auth/register',
        note: 'Poklanjamo 3 ekskluzivne kolekcije sezonski – samo za godišnje članove.',
        features: [
            ...baseFeatures,
            'Napredne analitike čitanja i personalizovani izazovi svaka tri meseca',
            'Rani pristup novim naslovima i live Q&A sesijama sa autorima',
        ],
        accent: true,
    },
] as const;

const experienceHighlights = [
    {
        icon: Sparkles,
        title: 'Personalizovano iskustvo',
        description:
            'Algoritam prati tvoje ciljeve, raspoloženje i žanrove kako bi ti svakog dana predložio savršeno štivo.',
    },
    {
        icon: BookOpen,
        title: 'Strukturisani planovi',
        description: 'Fokusirani planovi čitanja i mikro-ciljevi pomažu ti da održiš kontinuitet u učenju.',
    },
    {
        icon: Users,
        title: 'Zajednica koja inspiriše',
        description: 'Klubovi, diskusije i preporuke od čitalaca koji dele tvoja interesovanja.',
    },
];

const guarantee = [
    {
        icon: ShieldCheck,
        title: 'Bez rizika',
        description: '3 dana besplatne probne verzije i otkazivanje online kada god poželiš.',
    },
    {
        icon: Clock,
        title: 'Fleksibilno korišćenje',
        description: 'Čitaj na telefonu, tabletu ili laptopu – čak i offline.',
    },
    {
        icon: MessageCircle,
        title: 'Stvarna podrška',
        description: 'Naši urednici i tim podrške uz tebe su putem chata i e-maila.',
    },
];

const sharedButtonClasses =
    'rounded-full px-8 py-5 text-base font-semibold tracking-tight shadow-[0_18px_40px_rgba(228,179,76,0.25)] transition-transform hover:-translate-y-1';

export default function PricingPage() {
    return (
        <div className={cn(dt.layouts.mainPage, 'relative overflow-hidden bg-gradient-to-br from-library-midnight via-[#0b1120] to-[#1a1f2e] text-reading-contrast')}>
            <div className="pointer-events-none absolute inset-x-0 top-[-20%] h-[420px] bg-[radial-gradient(circle_at_center,_rgba(228,179,76,0.25),_transparent_65%)]" />
            <div className="pointer-events-none absolute bottom-[-30%] right-[-20%] h-[480px] w-[480px] rounded-full bg-library-highlight/15 blur-3xl" />
            <div className="pointer-events-none absolute left-[-10%] top-1/3 h-[420px] w-[420px] rounded-full bg-library-gold/10 blur-3xl" />

            <main className="relative z-10">
                <section className="px-4 pb-16 pt-24 sm:px-6 lg:px-12">
                    <div className="mx-auto max-w-4xl text-center">
                        <Badge className="mx-auto inline-flex items-center gap-2 rounded-full border border-library-gold/30 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-library-gold">
                            Premium pretplata
                        </Badge>
                        <h1 className="mt-7 font-display text-4xl font-semibold leading-tight sm:text-5xl">
                            Odaberi tempo čitanja koji ti prirodno leži
                        </h1>
                        <p className="mt-4 text-sm text-reading-contrast/70 sm:text-base">
                            Aktiviraj probu, istraži bogati katalog i odluči da li želiš fleksibilnost iz meseca u mesec ili dugoročnu uštedu uz godišnje članstvo.
                        </p>
                    </div>

                    <div className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={cn(
                                    'relative flex h-full flex-col justify-between overflow-hidden rounded-[32px] border p-10 backdrop-blur',
                                    plan.accent
                                        ? 'border-library-gold/40 bg-white text-reading-text shadow-[0_40px_140px_rgba(9,17,39,0.55)]'
                                        : 'border-white/15 bg-white/10 text-reading-contrast shadow-[0_32px_90px_rgba(9,17,39,0.35)]'
                                )}
                            >
                                {plan.accent && (
                                    <div className="absolute left-1/2 top-[-60px] h-[220px] w-[220px] -translate-x-1/2 rounded-full bg-library-gold/30 blur-3xl" />
                                )}

                                <div className="relative">
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'rounded-full border px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em]',
                                                plan.accent
                                                    ? 'border-library-gold bg-library-gold/10 text-library-midnight'
                                                    : 'border-white/40 bg-white/5 text-library-gold'
                                            )}
                                        >
                                            {plan.badge}
                                        </Badge>
                                        {plan.accent && (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-library-gold/20 px-3 py-1 text-xs font-semibold text-library-midnight">
                                                <Crown className="h-3.5 w-3.5" /> Najviše vrednosti
                                            </span>
                                        )}
                                    </div>
                                    <h2 className={cn('mt-8 font-display text-3xl font-semibold', plan.accent ? 'text-reading-text' : 'text-white')}>
                                        {plan.name}
                                    </h2>
                                    <p className={cn('mt-3 text-sm', plan.accent ? 'text-reading-text/70' : 'text-reading-contrast/70')}>
                                        {plan.description}
                                    </p>

                                    <div className="mt-8 flex items-baseline gap-3">
                                        <span className={cn('font-display text-5xl font-semibold', plan.accent ? 'text-reading-text' : 'text-white')}>
                                            {plan.price}
                                        </span>
                                        <span className={cn('text-sm font-medium', plan.accent ? 'text-library-copper' : 'text-library-gold/90')}>
                                            {plan.billing}
                                        </span>
                                    </div>
                                    <p className={cn('mt-2 text-xs font-semibold uppercase tracking-[0.28em]', plan.accent ? 'text-library-highlight/80' : 'text-library-gold/80')}>
                                        {plan.highlight}
                                    </p>

                                    <ul className="mt-8 space-y-4 text-sm">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3">
                                                <span
                                                    className={cn(
                                                        'mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-library-mint/15 text-library-mint shadow-inner',
                                                        plan.accent ? 'bg-library-mint/20 text-library-midnight' : ''
                                                    )}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </span>
                                                <span className={plan.accent ? 'text-reading-text/80' : 'text-reading-contrast/80'}>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="relative mt-10 flex flex-col gap-3">
                                    <Button
                                        asChild
                                        className={cn(
                                            sharedButtonClasses,
                                            plan.accent
                                                ? 'bg-library-gold text-library-midnight hover:bg-library-gold/90'
                                                : 'bg-library-highlight/80 text-white hover:bg-library-highlight'
                                        )}
                                    >
                                        <Link href={plan.href}>{plan.cta}</Link>
                                    </Button>
                                    <p className={cn('text-xs', plan.accent ? 'text-reading-text/60' : 'text-reading-contrast/60')}>{plan.note}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="border-t border-white/10 bg-white/5 px-4 py-20 backdrop-blur-sm sm:px-6 lg:px-12">
                    <div className="mx-auto max-w-5xl text-center">
                        <Badge className="mx-auto inline-flex items-center gap-2 rounded-full border border-library-gold/30 bg-library-parchment/40 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-library-copper">
                            U oba plana
                        </Badge>
                        <h2 className="mt-6 font-display text-3xl font-semibold sm:text-4xl">Premium iskustvo dizajnirano oko tebe</h2>
                        <p className="mt-4 text-sm text-reading-contrast/70">
                            Bez obzira na to koji plan odabereš, dobijaš alate i sadržaj koji te inspirišu da čitaš, učiš i deliš znanje sa zajednicom.
                        </p>
                    </div>

                    <div className="mx-auto mt-12 grid max-w-6xl gap-8 md:grid-cols-3">
                        {experienceHighlights.map((item) => (
                            <div
                                key={item.title}
                                className="group relative overflow-hidden rounded-[28px] border border-library-gold/20 bg-reading-background/60 p-8 shadow-[0_28px_100px_rgba(9,17,39,0.45)] transition-transform hover:-translate-y-2"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-library-gold/25 bg-library-gold/10 text-library-gold">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-6 font-display text-xl font-semibold text-reading-contrast">{item.title}</h3>
                                <p className="mt-3 text-sm text-reading-contrast/70">{item.description}</p>
                                <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
                                    <div className="absolute inset-x-[-30%] bottom-[-60%] h-full rounded-full bg-library-gold/15 blur-3xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="px-4 py-20 sm:px-6 lg:px-12">
                    <div className="mx-auto max-w-5xl rounded-[36px] border border-library-gold/25 bg-white/10 p-10 text-reading-contrast shadow-[0_32px_120px_rgba(9,17,39,0.45)] backdrop-blur">
                        <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-center">
                            <div>
                                <Badge className="inline-flex items-center gap-2 rounded-full border border-library-gold/40 bg-library-parchment/40 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-library-copper">
                                    Miran um dok čitaš
                                </Badge>
                                <h2 className="mt-6 font-display text-3xl font-semibold sm:text-4xl">Sigurna pretplata uz tim koji razume čitaoce</h2>
                                <p className="mt-4 text-sm text-reading-contrast/70">
                                    Naš fokus je da ti obezbedimo vreme za čitanje, a ne dodatnu administraciju. Sve – od aktivacije do otkazivanja – obavljaš online, uz pravu pomoć kad god ti zatreba.
                                </p>
                                <ul className="mt-8 space-y-3 text-sm text-reading-contrast/80">
                                    {guarantee.map((point) => (
                                        <li key={point.title} className="flex items-start gap-3">
                                            <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-library-mint/15 text-library-mint shadow-inner">
                                                <point.icon className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <p className="font-semibold text-reading-contrast">{point.title}</p>
                                                <p className="text-reading-contrast/70">{point.description}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex h-full flex-col justify-between gap-6 rounded-[28px] border border-dashed border-library-gold/40 bg-library-parchment/10 p-8 text-reading-text">
                                <div>
                                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-library-copper">
                                        Bonus za godišnji plan
                                    </div>
                                    <h3 className="mt-4 font-display text-2xl font-semibold">Sezonske kolekcije i live Q&A samo za članove</h3>
                                    <p className="mt-3 text-sm text-reading-text/70">
                                        Svaka sezona donosi pažljivo kurirane liste knjiga, radionice sa urednicima i interaktivne sesije sa autorima.
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full rounded-full border-library-gold/50 bg-white/80 py-5 text-library-midnight hover:bg-white"
                                >
                                    <Link href="/auth/register">Pređi na godišnje članstvo</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
