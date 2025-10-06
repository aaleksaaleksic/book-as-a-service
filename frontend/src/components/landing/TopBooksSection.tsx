'use client';

import { useRouter } from 'next/navigation';
import { Clock3 } from 'lucide-react';
import type { BookResponseDTO } from '@/api/types/books.types';
import { dt } from '@/lib/design-tokens';
import { resolveApiFileUrl } from '@/lib/asset-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TopBooksSectionProps {
    books: BookResponseDTO[];
    isLoading: boolean;
}

export const TopBooksSection = ({ books, isLoading }: TopBooksSectionProps) => {
    const router = useRouter();
    const displayedBooks = books.slice(0, 6);
    const totalReads = displayedBooks.reduce((acc, book) => acc + (book.readCount ?? 0), 0);

    const handleViewBook = (bookId: number) => {
        router.push(`/book/${bookId}`);
    };

    const handleViewAll = () => {
        router.push('/browse?sort=popular');
    };

    return (
        <section className={cn(dt.spacing.pageSections, 'relative overflow-hidden bg-library-parchment/95')}>
            <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 mx-auto h-80 w-11/12 max-w-5xl rounded-[56px] bg-library-highlight/10 blur-3xl" />

            <div className={cn(dt.layouts.pageContainer, 'relative')}>
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/20 bg-library-linen/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-sky-950">
                        Top 6 knjiga poslednjih 30 dana
                    </div>
                    <h2 className="mt-6 font-display text-3xl font-semibold text-reading-text sm:text-4xl">
                        Najčitanije knjige koje ne smete propustiti
                    </h2>
                    {/*<p className="mx-auto mt-4 max-w-2xl text-sm text-reading-text/70">*/}
                    {/*    Naša zajednica je u poslednjih 30 dana provela preko{' '}*/}
                    {/*    <span className="font-semibold text-reading-text">{totalReads.toLocaleString('sr-RS')}</span>{' '}*/}
                    {/*    čitanja na ovim naslovima. Otkrijte zašto svi pričaju baš o njima.*/}
                    {/*</p>*/}
                </div>

                <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, index) => (
                              <div
                                  key={`skeleton-${index}`}
                                  className="flex animate-pulse flex-col gap-5 rounded-[32px] border border-library-highlight/30 bg-library-parchment/95 p-6"
                              >
                                  <div className="h-64 w-full rounded-3xl bg-library-azure/30" />
                                  <div className="space-y-3">
                                      <div className="h-6 w-3/4 rounded bg-library-azure/40" />
                                      <div className="h-4 w-1/2 rounded bg-library-azure/40" />
                                      <div className="h-20 w-full rounded bg-library-azure/30" />
                                  </div>
                              </div>
                          ))
                        : displayedBooks.map((book, index) => {
                              const coverUrl = book.coverImageUrl
                                  ? resolveApiFileUrl(book.coverImageUrl) ?? book.coverImageUrl
                                  : undefined;

                              return (
                                  <article
                                      key={book.id}
                                      className="relative cursor-pointer rounded-[32px] border border-library-highlight/30 bg-library-parchment/95 p-6 text-reading-text shadow-[0_30px_80px_rgba(4,12,28,0.45)] backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(4,12,28,0.55)]"
                                      onClick={() => handleViewBook(book.id)}
                                  >
                                      <div className="absolute -top-3 right-6 rounded-full border border-library-gold/20 bg-library-parchment px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-950 shadow-lg">
                                          #{index + 1} u poslednjih 30 dana
                                      </div>

                                      <div className="space-y-6">
                                          <div className="relative overflow-hidden rounded-3xl bg-library-parchment/95 p-4 shadow-xl">
                                              {coverUrl ? (
                                                  <div className="flex min-h-[18rem] items-center justify-center sm:min-h-[22rem]">
                                                      <img
                                                          src={coverUrl}
                                                          alt={book.title}
                                                          className="max-h-[18rem] w-auto object-contain drop-shadow-xl sm:max-h-[22rem]"
                                                      />
                                                  </div>
                                              ) : (
                                                  <div className="flex min-h-[18rem] w-full items-center justify-center rounded-2xl bg-library-azure/15 text-reading-text/60 sm:min-h-[22rem]">
                                                      Nema dostupne naslovnice
                                                  </div>
                                              )}
                                          </div>

                                          <div className="space-y-4">
                                              <div className="flex items-start justify-between gap-4">
                                                  <div>
                                                      <h3 className="font-display text-2xl font-semibold text-reading-text">{book.title}</h3>
                                                      <p className="mt-1 text-sm text-reading-text/70">{book.author}</p>
                                                  </div>
                                                  <Badge className="rounded-full bg-library-gold/15 text-sky-950">
                                                      {book.category?.name || 'N/A'}
                                                  </Badge>
                                              </div>

                                              {book.description && (
                                                  <p className="text-sm text-reading-text/70 line-clamp-4">
                                                      {book.description}
                                                  </p>
                                              )}

                                              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-reading-text/60">
                                                  <div className="flex items-center gap-2 rounded-full border border-library-gold/25 px-3 py-1">
                                                      <Clock3 className="h-3.5 w-3.5 text-library-gold" />
                                                      {book.pages} strana
                                                  </div>
                                              </div>

                                              <Button
                                                  size="lg"
                                                  variant="ghost"
                                                  onClick={(event) => {
                                                      event.stopPropagation();
                                                      handleViewBook(book.id);
                                                  }}
                                                  className="w-full rounded-full border border-library-gold/25 bg-library-azure/10 py-5 text-reading-text transition hover:bg-library-highlight/10"
                                              >
                                                  Otvori detalje knjige
                                              </Button>
                                          </div>
                                      </div>
                                  </article>
                              );
                          })}
                </div>

                <div className="mt-12 flex justify-center">
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={handleViewAll}
                        className="rounded-full border border-library-gold/30 bg-white/70 px-10 py-6 text-reading-text transition hover:bg-library-highlight/15"
                    >
                        Vidi sve popularne naslove
                    </Button>
                </div>
            </div>
        </section>
    );
};
