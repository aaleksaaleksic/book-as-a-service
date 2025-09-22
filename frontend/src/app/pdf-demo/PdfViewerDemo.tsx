'use client';

import { FormEvent, useMemo, useState } from 'react';

const DEFAULT_BOOK_ID = 42;

const sanitizeBookId = (raw: string): number | null => {
    if (!raw) {
        return null;
    }

    const normalized = Number.parseInt(raw, 10);

    if (Number.isNaN(normalized) || normalized <= 0) {
        return null;
    }

    return normalized;
};

interface PdfViewerDemoProps {
    initialBookId?: number;
}

const PdfViewerDemo = ({ initialBookId = DEFAULT_BOOK_ID }: PdfViewerDemoProps) => {
    const [inputValue, setInputValue] = useState(() => String(initialBookId));
    const [activeBookId, setActiveBookId] = useState(initialBookId);
    const [error, setError] = useState<string | null>(null);
    const [refreshCounter, setRefreshCounter] = useState(0);

    const viewerSrc = useMemo(() => `/api/pdf-demo/local/${activeBookId}?refresh=${refreshCounter}`, [activeBookId, refreshCounter]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const sanitized = sanitizeBookId(inputValue.trim());
        if (sanitized === null) {
            setError('Unesi ispravan ID knjige (pozitivan broj).');
            return;
        }

        setActiveBookId(sanitized);
        setRefreshCounter((counter) => counter + 1);
        setError(null);
    };

    return (
        <div className="space-y-6">
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 rounded-xl border border-library-gold/20 bg-library-midnight/40 p-5 shadow-sm"
            >
                <div>
                    <label htmlFor="bookId" className="text-xs font-medium uppercase tracking-[0.32em] text-library-gold/70">
                        ID knjige u lokalnom storage-u
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                        <input
                            id="bookId"
                            name="bookId"
                            type="number"
                            min={1}
                            value={inputValue}
                            onChange={(event) => setInputValue(event.target.value)}
                            className="w-32 rounded-lg border border-library-gold/40 bg-library-midnight/60 px-3 py-2 text-sm text-reading-contrast focus:border-library-gold focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-library-gold px-4 py-2 text-sm font-medium text-library-midnight transition hover:bg-library-gold/80"
                        >
                            Učitaj PDF
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-reading-contrast/60">
                        U storage fascikli backenda očekuje se fajl pod nazivom <code className="rounded bg-library-midnight/80 px-1">book-{'{ID}'}.pdf</code>.
                    </p>
                </div>
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
            </form>

            <div className="h-[75vh] w-full overflow-hidden rounded-xl border border-library-gold/20 shadow-lg">
                <iframe key={`${activeBookId}-${refreshCounter}`} src={viewerSrc} title={`PDF za knjigu ${activeBookId}`} className="h-full w-full" />
            </div>
        </div>
    );
};

export default PdfViewerDemo;
