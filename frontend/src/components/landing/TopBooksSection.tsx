'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, Flame } from 'lucide-react';
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
    const displayedBooks = books.slice(0, 5);
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
                    <div className="inline-flex items-center gap-2 rounded-full border border-library-gold/20 bg-library-linen/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-library-copper">
                        Top 5 knjiga poslednjih 30 dana
                    </div>
                    <h2 className="mt-6 font-display text-3xl font-semibold text-reading-text sm:text-4xl">
                        Najčitanije priče koje ne smete propustiti
                    </h2>
                    {/*<p className="mx-auto mt-4 max-w-2xl text-sm text-reading-text/70">*/}
                    {/*    Naša zajednica je u poslednjih 30 dana provela preko{' '}*/}
                    {/*    <span className="font-semibold text-reading-text">{totalReads.toLocaleString('sr-RS')}</span>{' '}*/}
                    {/*    čitanja na ovim naslovima. Otkrijte zašto svi pričaju baš o njima.*/}
                    {/*</p>*/}
                </div>

                <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {isLoading
                        ? Array.from({ length: 5 }).map((_, index) => (
                              <div
                                  key={`skeleton-${index}`}
                                  className="flex animate-pulse flex-col gap-4 rounded-3xl border border-library-gold/10 bg-library-linen/60 p-6"
                              >
                                  <div className="h-8 w-12 rounded-full bg-library-azure/20" />
                                  <div className="h-40 w-full rounded-3xl bg-library-azure/20" />
                                  <div className="space-y-3">
                                      <div className="h-5 w-3/4 rounded bg-library-azure/10" />
                                      <div className="h-4 w-1/2 rounded bg-library-azure/10" />
                                      <div className="h-16 w-full rounded bg-library-azure/10" />
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
                                      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-library-gold/15 bg-white/90 p-6 shadow-[0_18px_45px_rgba(31,41,51,0.12)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_80px_rgba(31,41,51,0.2)]"
                                      onClick={() => handleViewBook(book.id)}
                                  >
                                      <div className="absolute right-6 top-4 text-5xl font-display font-semibold text-library-slate">
                                          {String(index + 1).padStart(2, '0')}
                                      </div>

                                      <div className="relative flex flex-1 flex-col gap-6">
                                          <div className="flex flex-col gap-6 sm:flex-row">
                                              <div className="relative mx-auto w-40 shrink-0 sm:mx-0">
                                                  <div className="absolute inset-0 scale-95 rounded-[28px] bg-library-highlight/20 opacity-0 blur-xl transition group-hover:opacity-100" />
                                                  <div className="relative overflow-hidden rounded-[28px] shadow-xl transition group-hover:rotate-1 group-hover:scale-[1.03]">
                                                      {coverUrl ? (
                                                          <img
                                                              src={coverUrl}
                                                              alt={book.title}
                                                              className="h-48 w-full object-cover"
                                                          />
                                                      ) : (
                                                          <div className="flex h-48 items-center justify-center bg-library-fog text-sm text-reading-text/60">
                                                              Naslovnica u pripremi
                                                          </div>
                                                      )}
                                                  </div>
                                              </div>

                                              <div className="flex flex-1 flex-col justify-between gap-4">
                                                  <div className="space-y-2">
                                                      <Badge className="w-fit rounded-full bg-library-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-library-copper">
                                                          {book.category}
                                                      </Badge>
                                                      <h3 className="font-display text-xl font-semibold text-reading-text">{book.title}</h3>
                                                      <p className="text-sm text-reading-text/70">{book.author}</p>
                                                      {book.description && (
                                                          <p className="text-sm text-reading-text/70 line-clamp-3">{book.description}</p>
                                                      )}
                                                  </div>

                                                  {/*<div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.32em] text-reading-text/60">*/}
                                                  {/*    <span className="flex items-center gap-2 text-library-copper">*/}
                                                  {/*        <Flame className="h-4 w-4" />*/}
                                                  {/*        {book.readCount?.toLocaleString('sr-RS') ?? 0} čitanja*/}
                                                  {/*    </span>*/}
                                                  {/*    <span className="flex items-center gap-2">*/}
                                                  {/*        <BarChart3 className="h-4 w-4 text-library-highlight" />*/}
                                                  {/*        Ocena {book.averageRating?.toFixed(1) ?? '—'}/5*/}
                                                  {/*    </span>*/}
                                                  {/*</div>*/}
                                              </div>
                                          </div>

                                          <div className="mt-auto flex items-center justify-between">
                                              <span className="text-xs uppercase tracking-[0.32em] text-reading-text/50">
                                                  #{index + 1} u poslednjih 30 dana
                                              </span>
                                              <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="rounded-full border border-library-gold/25 px-4 text-reading-text transition hover:bg-library-highlight/15"
                                                  onClick={(event) => {
                                                      event.stopPropagation();
                                                      handleViewBook(book.id);
                                                  }}
                                              >
                                                  Vidi knjigu
                                                  <ArrowRight className="ml-1 h-4 w-4" />
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
