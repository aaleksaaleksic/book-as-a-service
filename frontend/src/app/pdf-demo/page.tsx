import Link from 'next/link';

import PdfViewerDemo from './PdfViewerDemo';

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
                        Ova stranica služi kao sledeći korak – proveravamo da PDF fajl koji se nalazi u lokalnom storage-u
                        backenda može da se učita kroz proxy rutu na frontendu. Ovo simulira način na koji će čitač u praksi
                            dolaziti do fajla.
                    </p>
                    <PdfViewerDemo />

                    <div className="rounded-xl border border-library-gold/10 bg-library-midnight/40 p-5 text-sm text-reading-contrast/80">
                        <p>
                            Za demonstraciju je spremljen fajl <code className="rounded bg-library-midnight/80 px-1">book-42.pdf</code>{' '}
                            u <code className="rounded bg-library-midnight/80 px-1">backend/readify/storage/books</code>. Kada backend radi
                            sa <code className="rounded bg-library-midnight/80 px-1">LocalFileStorageService</code>,
                            demo endpoint <code className="rounded bg-library-midnight/80 px-1">/api/v1/files/demo/local/42</code>{' '}
                            vraća taj PDF, a frontend ga prikazuje preko iframe-a.
                        </p>
                        <p className="mt-3 text-xs text-reading-contrast/60">
                            Za druge ID vrednosti potrebno je da u istoj fascikli postoji odgovarajući fajl{' '}
                            <code className="rounded bg-library-midnight/80 px-1">book-{'{ID}'}.pdf</code>.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
