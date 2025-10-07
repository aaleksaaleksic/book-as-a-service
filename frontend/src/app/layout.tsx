"use client";

import type { Metadata } from "next";
import { Inter, Playfair_Display, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { HttpClientProvider } from "@/context/HttpClientProvider";
import { QueryProvider } from "@/context/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
});
const bebasNeue = Bebas_Neue({
    subsets: ["latin"],
    variable: "--font-bebas",
    weight: "400",
});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const isReaderRoute = pathname?.startsWith('/reader');

    return (
        <html lang="sr" suppressHydrationWarning>
        <body className={cn("bg-reading-background text-foreground", inter.variable, playfair.variable, bebasNeue.variable, "font-ui") }>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <HttpClientProvider>
                <QueryProvider>
                    <AuthProvider>
                        {!isReaderRoute && <Navbar />}
                        {children}
                        <Toaster />
                    </AuthProvider>
                </QueryProvider>
            </HttpClientProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}