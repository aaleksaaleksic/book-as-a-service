'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dt } from '@/lib/design-tokens';

interface BookSuggestionFormProps {
    className?: string;
    compact?: boolean;
}

export const BookSuggestionForm = ({ className, compact = false }: BookSuggestionFormProps) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            setError('Molimo unesite predlog');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/propositions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message.trim() }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setShowSuccess(true);
                setMessage('');

                // Hide success message after 3 seconds
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
            } else {
                setError(data.message || 'Došlo je do greške pri slanju predloga');
            }
        } catch (err) {
            setError('Došlo je do greške. Molimo pokušajte ponovo.');
            console.error('Error submitting proposition:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div className={cn(
                'flex items-center gap-3 rounded-2xl border border-green-400/40 bg-green-100/80 px-6 py-4 text-green-800 shadow-sm',
                className
            )}>
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <p className="font-ui font-semibold">Uspešno poslat predlog</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
            {!compact && (
                <label
                    htmlFor="book-suggestion"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-sky-950/70"
                >
                    Predložite knjigu koju biste sledeće hteli da vidite na platformi
                </label>
            )}

            <div className="relative">
                <textarea
                    id="book-suggestion"
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        setError(null);
                    }}
                    placeholder={compact ?
                        "Predložite knjigu koju biste sledeće hteli da vidite na platformi" :
                        "Npr. 'Voleo bih da vidim više knjiga o Python-u...'"
                    }
                    rows={compact ? 2 : 3}
                    maxLength={1000}
                    disabled={isSubmitting}
                    className={cn(
                        'w-full rounded-2xl border-library-highlight/30 bg-white/80 px-4 py-3 font-ui text-base text-sky-950 placeholder:text-sky-950/40 shadow-[0_12px_30px_rgba(11,29,58,0.08)] transition-all focus:border-library-gold/60 focus:outline-none focus:ring-2 focus:ring-library-gold/25 resize-none',
                        error && 'border-red-400/70 focus:border-red-500 focus:ring-red-200',
                        isSubmitting && 'opacity-60 cursor-not-allowed'
                    )}
                />
                {message.length > 0 && (
                    <div className="absolute bottom-3 right-3 text-xs text-sky-950/40">
                        {message.length}/1000
                    </div>
                )}
            </div>

            {error && (
                <p className="text-sm font-medium text-red-600">{error}</p>
            )}

            <Button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className={cn(
                    'w-full justify-center gap-2 rounded-full bg-library-gold px-8 py-6 font-ui text-base font-semibold uppercase tracking-[0.18em] text-library-midnight shadow-[0_18px_40px_rgba(228,179,76,0.25)] transition-all hover:-translate-y-1 hover:bg-library-gold/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
                    compact && 'py-4 text-sm'
                )}
            >
                {isSubmitting ? (
                    'Šaljem...'
                ) : (
                    <>
                        <Send className={cn('h-4 w-4', compact && 'h-3.5 w-3.5')} />
                        Pošalji predlog
                    </>
                )}
            </Button>
        </form>
    );
};
