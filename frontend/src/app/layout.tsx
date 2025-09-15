import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'ReadBookHub - Your Digital Library',
    description: 'Read unlimited books with our premium subscription service',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
            {children}
        </AuthProvider>
        </body>
        </html>
    );
}