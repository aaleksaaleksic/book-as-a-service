import Link from 'next/link';
import { Check, Clock, MessageCircle, ShieldCheck, Sparkles, Users, BookOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { dt } from '@/lib/design-tokens';

const baseFeatures = [
    'Neograničeno čitanje 12.000+ digitalnih naslova',
    'Personalizovane preporuke na osnovu tvojih navika',
    'Sinhronizacija beleški, podsetnika i napretka na svim uređajima',
    'Pristup ekskluzivnoj zajednici čitalaca i mesečnim diskusijama',
];

const plans = [
    {
        id: 'monthly',
        name: 'Osnovni plan',
        label: 'Mesečni plan',
        description: 'Idealno za čitaoce koji žele fleksibilnost i žele da isprobaju ReadBookHub bez dugoročnih obaveza.',
        price: '999 RSD',
        billing: 'mesečno',
        highlight: 'Psihološka cena ispod 1.000 dinara',
        cta: 'Pokreni mesečnu pretplatu',
        href: '/auth/register',
        meta: 'Otkazuješ online u bilo kom trenutku',
        features: baseFeatures,
        accent: false,
    },
    {
        id: 'yearly',
        name: 'Godišnji plan',
        label: 'Sa popustom',
        description: 'Za strastvene čitaoce koji žele da uštede i dobiju maksimum iz našeg ekosistema sadržaja tokom cele godine.',
        price: '9.999 RSD',
        billing: 'godišnje (~833 RSD/mesec)',
        highlight: 'Ušteda 16% u odnosu na mesečni plan',
        cta: 'Uštedi sa godišnjim članstvom',
        href: '/auth/register',
        meta: 'Uključena 3 meseca ekskluzivnih audio izdanja gratis',
        features: [
            ...baseFeatures,
            'Napredne analitike čitanja i personalizovani izazovi svakog kvartala',
            'Prvi pristup novim naslovima i specijalnim kolekcijama',
        ],
        accent: true,
    },
] as const;

const includedHighlights = [
    {
        icon: Sparkles,
        title: 'Personalizovano iskustvo',
        description:
            'Napredni algoritam ti svakodnevno predlaže naslove na osnovu žanrova, raspoloženja i ciljeva čitanja.',
    },
    {
        icon: BookOpen,
        title: 'Fokus na rutinu',
        description:
            'Planovi čitanja, podsetnici i mikro-ciljevi pomažu ti da čitanje postane navika kojoj se vraćaš svakog dana.',
    },
    {
        icon: Users,
        title: 'Zajednica koja inspiriše',
        description:
            'Pridruži se klubovima, razmeni utiske i upoznaj čitaoce koji dele tvoja interesovanja u tech i biznis temama.',
    },
];

const guaranteePoints = [
    {
        icon: ShieldCheck,
        title: 'Bez rizika',
        description: '3 dana besplatne probne verzije uz mogućnost otkazivanja bez dodatnih pitanja.',
    },
    {
        icon: Clock,
        title: 'Fleksibilno korišćenje',
        description: 'Čitaj kad ti odgovara – na telefonu, tabletu ili laptopu, čak i offline.',
    },
    {
        icon: MessageCircle,
        title: 'Podrška u realnom vremenu',
        description: 'Naš tim je tu za tebe putem chata i e-maila kad god zatreba pomoć ili preporuka.',
    },
];

const sharedButtonClasses =
    'rounded-full px-8 py-5 text-base font-semibold shadow-[0_18px_40px_rgba(228,179,76,0.25)] transition-transform hover:-translate-y-1';

export default function PricingPage() {
    return (
        <div className={cn(dt.layouts.mainPage, 'relative overflow-hidden text-reading-contrast')}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-library-highlight/30 to-transparent blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-[120vw] -translate-x-1/2 rounded-[50%] bg-library-gold/10 blur-3xl" />

            <main className="relative z-10">
                <section className="px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/30 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-library-slate">
                            Pricing & Plans
                        </div>
                        <h1 className="mt-6 font-display text-4xl font-semibold sm:text-5xl">
                            Odaberi tempo čitanja koji se uklapa u tvoj život
                        </h1>
                        <p className="mt-4 text-sm text-reading-contrast/70 sm:text-base">
                            Bez skrivenih troškova i komplikovanih uslova. Aktiviraš besplatnu probu, istražiš naš katalog i tek onda odlučiš da li ti više odgovara mesečna fleksibilnost ili godišnja ušteda.
                        </p>
                    </div>

                    <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-2">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={cn(
                                    'group relative flex h-full flex-col overflow-hidden rounded-[32px] border bg-white/90 p-10 text-left text-reading-text backdrop-blur',
                                    plan.accent
                                        ? 'border-library-gold/40 shadow-[0_36px_120px_rgba(12,25,58,0.45)]'
                                        : 'border-library-gold/20 shadow-[0_28px_80px_rgba(12,25,58,0.25)]'
                                )}
                            >
                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge className="rounded-full border-library-gold/20 bg-library-parchment/60 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-library-copper">
                                        {plan.label}
                                    </Badge>
                                    {plan.accent && (
                                        <Badge className="rounded-full border-library-gold/20 bg-library-gold/90 text-library-midnight">
                                            Najpopularniji izbor
                                        </Badge>
                                    )}
                                </div>

                                <h2 className="mt-8 font-display text-3xl font-semibold text-reading-text">{plan.name}</h2>
                                <p className="mt-3 text-sm text-reading-text/70">{plan.description}</p>

                                <div className="mt-8 flex items-baseline gap-3">
                                    <span className="font-display text-5xl font-semibold text-reading-text">{plan.price}</span>
                                    <span className="text-sm font-medium text-library-copper">{plan.billing}</span>
                                </div>
                                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-library-highlight/80">
                                    {plan.highlight}
                                </p>

                                <ul className="mt-8 space-y-4 text-sm text-reading-text/80">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-library-mint/15 text-library-mint shadow-inner">
                                                <Check className="h-4 w-4" />
                                            </span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-10 flex flex-1 flex-col justify-end gap-3">
                                    <Button
                                        asChild
                                        className={cn(
                                            sharedButtonClasses,
                                            plan.accent
                                                ? 'bg-library-gold text-library-midnight hover:bg-library-gold/90'
                                                : 'bg-library-highlight text-white hover:bg-library-highlight/90'
                                        )}
                                    >
                                        <Link href={plan.href}>{plan.cta}</Link>
                                    </Button>
                                    <p className="text-xs text-reading-text/60">{plan.meta}</p>
                                </div>

                                {plan.accent && (
                                    <div className="pointer-events-none absolute -top-24 right-[-10%] h-48 w-48 rounded-full bg-library-gold/20 blur-3xl transition duration-500 group-hover:scale-110" />
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="border-t border-white/10 bg-white/10 px-4 py-20 backdrop-blur-sm sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/30 bg-library-parchment/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-library-copper">
                                Šta dobijaš u oba plana
                            </div>
                            <h2 className="mt-6 font-display text-3xl font-semibold text-reading-contrast sm:text-4xl">
                                Dizajnirano da te vodi od prve strane do poslednje
                            </h2>
                            <p className="mt-4 text-sm text-reading-contrast/70">
                                Uz svaku pretplatu dobijaš iste premium alate koji te podstiču da čitaš, razumeš i deliš znanje sa ostatkom zajednice.
                            </p>
                        </div>

                        <div className="mt-12 grid gap-8 md:grid-cols-3">
                            {includedHighlights.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-[28px] border border-library-gold/20 bg-reading-background/40 p-8 shadow-[0_24px_80px_rgba(12,25,58,0.4)]"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-library-gold/25 bg-library-gold/10 text-library-gold">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mt-6 font-display text-xl font-semibold text-reading-contrast">{item.title}</h3>
                                    <p className="mt-3 text-sm text-reading-contrast/70">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-5xl rounded-[36px] border border-library-gold/25 bg-white/10 p-10 text-reading-contrast shadow-[0_28px_90px_rgba(12,25,58,0.4)] backdrop-blur">
                        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
                            <div>
                                <h2 className="font-display text-3xl font-semibold sm:text-4xl">Sigurna pretplata uz podršku tima koji razume čitaoce</h2>
                                <p className="mt-4 text-sm text-reading-contrast/70">
                                    Cilj nam je da ti omogućimo vreme za čitanje, a ne dodatnu administraciju. Zato je ceo proces – od aktivacije do otkazivanja – transparentan, brz i potpuno online.
                                </p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                {guaranteePoints.map((point) => (
                                    <div key={point.title} className="flex h-full flex-col gap-4 rounded-3xl border border-library-gold/20 bg-library-azure/30 p-6">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-library-gold/25 bg-library-gold/15 text-library-gold">
                                            <point.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-display text-lg font-semibold text-reading-contrast">{point.title}</h3>
                                            <p className="mt-2 text-sm text-reading-contrast/70">{point.description}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex h-full flex-col justify-between rounded-3xl border border-dashed border-library-gold/40 bg-library-parchment/20 p-6 text-reading-text">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-library-copper">
                                            Bonus za godišnji plan
                                        </div>
                                        <p className="mt-3 text-base font-semibold text-reading-text">
                                            Svake sezone dobijaš kurirane liste knjiga i live Q&A sesije sa autorima – samo za godišnje članove.
                                        </p>
                                    </div>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="mt-6 w-full rounded-full border-library-gold/40 bg-white/70 py-5 text-library-midnight hover:bg-white"
                                    >
                                        <Link href="/auth/register">Aktiviraj godišnju članarinu</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
