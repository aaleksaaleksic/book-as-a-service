'use client';

import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { BookCarousel } from '@/components/landing/BookCarousel';
import { CategoryGrid } from '@/components/landing/CategoryGrid';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { dt } from '@/lib/design-tokens';

const featuredBook = {
  id: 1,
  title: "The Midnight Library",
  author: "Matt Haig",
  description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
  coverImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
  category: "Fiction",
  rating: 4.5,
};

const featuredBooks = [
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    coverImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop",
    category: "Self-Help",
    rating: 4.8,
    popular: true,
  },
  {
    id: 3,
    title: "Dune",
    author: "Frank Herbert",
    coverImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    category: "Science Fiction",
    rating: 4.6,
    featured: true,
  },
  {
    id: 4,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    coverImageUrl: "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=300&h=400&fit=crop",
    category: "Finance",
    rating: 4.7,
  },
  {
    id: 5,
    title: "Educated",
    author: "Tara Westover",
    coverImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    category: "Biography",
    rating: 4.9,
    popular: true,
  },
  {
    id: 6,
    title: "The Silent Patient",
    author: "Alex Michaelides",
    coverImageUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=300&h=400&fit=crop",
    category: "Thriller",
    rating: 4.4,
  },
];

const popularBooks = [
  {
    id: 7,
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    coverImageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&h=400&fit=crop",
    category: "Romance",
    rating: 4.6,
    popular: true,
  },
  {
    id: 8,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    coverImageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=400&fit=crop",
    category: "History",
    rating: 4.5,
  },
  {
    id: 9,
    title: "The Thursday Murder Club",
    author: "Richard Osman",
    coverImageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop",
    category: "Mystery",
    rating: 4.3,
  },
  {
    id: 10,
    title: "Becoming",
    author: "Michelle Obama",
    coverImageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop",
    category: "Biography",
    rating: 4.8,
  },
];

export default function LandingPage() {
  return (
      <div className={dt.layouts.mainPage}>
        <Header />

        <main>
          <HeroSection featuredBook={featuredBook} />

          <div className={dt.layouts.pageContainer}>
            <Suspense fallback={<LoadingSpinner size="lg" text="Loading featured books..." />}>
              <BookCarousel
                  title="Featured Books"
                  books={featuredBooks}
                  viewAllHref="/browse?featured=true"
              />
            </Suspense>

            <Suspense fallback={<LoadingSpinner size="lg" text="Loading popular books..." />}>
              <BookCarousel
                  title="Popular This Month"
                  books={popularBooks}
                  viewAllHref="/browse?popular=true"
              />
            </Suspense>

            <Suspense fallback={<LoadingSpinner size="lg" text="Loading categories..." />}>
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
                    Your premium digital library. Read unlimited books with our subscription service.
                    Start your reading journey today.
                  </p>
                </div>

                <div>
                  <h4 className={`${dt.typography.body} font-semibold text-reading-text mb-4`}>
                    Quick Links
                  </h4>
                  <ul className="space-y-2">
                    {['Browse Books', 'Categories', 'Pricing', 'About'].map((link) => (
                        <li key={link}>
                          <a href="#" className={`${dt.typography.small} text-reading-text/60 hover:text-reading-accent transition-colors`}>
                            {link}
                          </a>
                        </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className={`${dt.typography.body} font-semibold text-reading-text mb-4`}>
                    Support
                  </h4>
                  <ul className="space-y-2">
                    {['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((link) => (
                        <li key={link}>
                          <a href="#" className={`${dt.typography.small} text-reading-text/60 hover:text-reading-accent transition-colors`}>
                            {link}
                          </a>
                        </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-reading-accent/10 mt-8 pt-8 text-center">
                <p className={`${dt.typography.small} text-reading-text/60`}>
                  © 2025 ReadBookHub. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}