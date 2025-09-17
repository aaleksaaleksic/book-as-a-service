'use client';

import {Suspense, useEffect} from 'react';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { BookCarousel } from '@/components/landing/BookCarousel';
import { CategoryGrid } from '@/components/landing/CategoryGrid';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { dt } from '@/lib/design-tokens';
import {useAuth} from "@/hooks/useAuth";

const featuredBook = {
  id: 1,
  title: "Ponoćna biblioteka",
  author: "Met Haig",
  description: "Između života i smrti postoji biblioteka, a u toj biblioteci, police se protežu zauvek. Svaka knjiga pruža priliku da probaš drugi život koji si mogao da živiš.",
  coverImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
  category: "Književnost",
  rating: 4.5,
};

const featuredBooks = [
  {
    id: 2,
    title: "Atomske navike",
    author: "Džejms Klir",
    coverImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop",
    category: "Samopomoć",
    rating: 4.8,
    popular: true,
  },
  {
    id: 3,
    title: "Kapa",
    author: "Frenk Herbert",
    coverImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    category: "Naučna fantastika",
    rating: 4.6,
    featured: true,
  },
  {
    id: 4,
    title: "Psihologija novca",
    author: "Morgan Hauzel",
    coverImageUrl: "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=300&h=400&fit=crop",
    category: "Finansije",
    rating: 4.7,
  },
  {
    id: 5,
    title: "Obrazovanje",
    author: "Tara Vestover",
    coverImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    category: "Biografija",
    rating: 4.9,
    popular: true,
  },
  {
    id: 6,
    title: "Tihi pacijent",
    author: "Aleks Mihaelides",
    coverImageUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=300&h=400&fit=crop",
    category: "Triler",
    rating: 4.4,
  },
];

const popularBooks = [
  {
    id: 7,
    title: "Sedam muževa Evelin Hugo",
    author: "Tejlor Dženkins Rid",
    coverImageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&h=400&fit=crop",
    category: "Romans",
    rating: 4.6,
    popular: true,
  },
  {
    id: 8,
    title: "Sapijens",
    author: "Juval Noa Harari",
    coverImageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=400&fit=crop",
    category: "Istorija",
    rating: 4.5,
  },
  {
    id: 9,
    title: "Četvrtkov klub ubica",
    author: "Ričard Ozman",
    coverImageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop",
    category: "Misterija",
    rating: 4.3,
  },
  {
    id: 10,
    title: "Postajanje",
    author: "Mišel Obama",
    coverImageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop",
    category: "Biografija",
    rating: 4.8,
  },
];

export default function LandingPage() {

  const { isAuthenticated, isLoading, refreshUser } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('readbookhub_auth_token');

      if (token && !isAuthenticated) {
        refreshUser();
      }
    }
  }, []);

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-book-green-50 via-book-green-100 to-book-green-200">
          <LoadingSpinner size="lg" />
        </div>
    );
  }

  return (
      <div className={dt.layouts.mainPage}>
        <Header />

        <main>
          <HeroSection featuredBook={featuredBook} />

          <div className={dt.layouts.pageContainer}>
            <Suspense fallback={<LoadingSpinner size="lg" text="Učitavam izdvojene knjige..." />}>
              <BookCarousel
                  title="Izdvojene knjige"
                  books={featuredBooks}
                  viewAllHref="/browse?featured=true"
              />
            </Suspense>

            <Suspense fallback={<LoadingSpinner size="lg" text="Učitavam popularne knjige..." />}>
              <BookCarousel
                  title="Popularne ovog meseca"
                  books={popularBooks}
                  viewAllHref="/browse?popular=true"
              />
            </Suspense>

            <Suspense fallback={<LoadingSpinner size="lg" text="Učitavam kategorije..." />}>
              <CategoryGrid />
            </Suspense>
          </div>
        </main>

        <footer className="bg-reading-surface border-t border-reading-accent/10 mt-16">
          <div className={dt.layouts.pageContainer}>
            <div className="py-12">
              <div className="grid md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                  <h3 className={`${dt.typography.cardTitle} text-reading-text mb-4`}>
                    ReadBookHub
                  </h3>
                  <p className={`${dt.typography.body} text-reading-text/70 max-w-md`}>
                    Vaša premium digitalna biblioteka. Čitajte neograničeno knjiga uz našu pretplatu.
                    Počnite svoje čitalačko putovanje danas.
                  </p>
                </div>

                <div>
                  <h4 className={`${dt.typography.body} font-semibold text-reading-text mb-4`}>
                    Brze veze
                  </h4>
                  <ul className="space-y-2">
                    <li>
                      <a href="/browse" className={`${dt.typography.small} text-reading-text/60 hover:text-reading-accent transition-colors`}>
                        Pretraži knjige
                      </a>
                    </li>
                    <li>
                      <a href="/categories" className={`${dt.typography.small} text-reading-text/60 hover:text-reading-accent transition-colors`}>
                        Kategorije
                      </a>
                    </li>
                    <li>
                      <a href="/pricing" className={`${dt.typography.small} text-reading-text/60 hover:text-reading-accent transition-colors`}>
                        Cene
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className={`${dt.typography.body} font-semibold text-reading-text mb-4`}>
                    Podrška
                  </h4>
                  <ul className="space-y-2">
                    <li>
                      <a href="/help" className={`${dt.typography.small} text-reading-text/60 hover:text-reading-accent transition-colors`}>
                        Pomoć
                      </a>
                    </li>
                    <li>
                      <a href="/contact" className={`${dt.typography.small} text-reading-text/60 hover:text-reading-accent transition-colors`}>
                        Kontakt
                      </a>
                    </li>
                    <li>
                      <a href="/privacy" className={`${dt.typography.small} text-reading-text/60 hover:text-reading-accent transition-colors`}>
                        Privatnost
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-reading-accent/10 mt-8 pt-8 text-center">
                <p className={`${dt.typography.small} text-reading-text/60`}>
                  © 2024 ReadBookHub. Sva prava zadržana.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}