import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { HttpClientProvider } from "@/context/HttpClientProvider";
import { QueryProvider } from "@/context/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
});

export const metadata: Metadata = {
    title: "ReadBookHub - Your Digital Library",
    description: "Premium online book reading platform with subscription model",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="sr" suppressHydrationWarning>
        <body className={cn("bg-reading-background text-foreground", inter.variable, playfair.variable, "font-ui") }>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <HttpClientProvider>
                <QueryProvider>
                    <AuthProvider>
                        <Navbar />
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