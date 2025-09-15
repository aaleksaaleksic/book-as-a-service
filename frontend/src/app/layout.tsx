import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { HttpClientProvider } from "@/context/HttpClientProvider";
import { QueryProvider } from "@/context/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

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
        <body className={inter.className}>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <HttpClientProvider>
                <QueryProvider>
                    <AuthProvider>
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