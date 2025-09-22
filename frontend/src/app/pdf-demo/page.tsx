import Link from 'next/link';

export const metadata = {
    title: 'PDF Demo | ReadBookHub',
};

export default function PdfDemoPage() {
    return (
        <div className="flex min-h-screen flex-col bg-reading-background text-reading-contrast">
            <header className="border-b border-library-gold/20 bg-library-midnight/80 py-6">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-library-gold/80">Demo prikaz</p>
                        <h1 className="mt-2 font-display text-2xl font-semibold text-reading-contrast">
                            Jednostavan prikaz PDF dokumenta
                        </h1>
                    </div>
                    <Link
                        href="/"
                        className="rounded-full border border-library-gold/30 px-4 py-2 text-sm font-medium text-reading-contrast transition hover:border-library-gold hover:text-library-gold"
                    >
                        ← Nazad na početnu
                    </Link>
                </div>
            </header>

            <main className="flex flex-1 flex-col items-center px-4 py-10">
                <div className="w-full max-w-5xl space-y-6">
                    <p className="text-sm text-reading-contrast/80">
                        Ova stranica služi kao jednostavan primer da proverimo da se PDF fajl uspešno učitava i da se kroz
                        njega može listati. Dokument se učitava direktno iz javne fascikle aplikacije.
                    </p>

                    <div className="h-[75vh] w-full overflow-hidden rounded-xl border border-library-gold/20 shadow-lg">
                        <iframe
                            src="/sample.pdf"
                            title="Primer PDF dokumenta"
                            className="h-full w-full"
                        />
                    </div>

                    <p className="text-xs text-reading-contrast/60">
                        Ukoliko vidiš prikaz dokumenta iznad i možeš da ga skroluješ, PDF prikaz radi ispravno.
                    </p>
                </div>
            </main>
        </div>
    );
}
