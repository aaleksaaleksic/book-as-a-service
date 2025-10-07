"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";

// Create a singleton queryClient instance that can be accessed globally
let globalQueryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
    if (!globalQueryClient) {
        globalQueryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        gcTime: 5 * 60 * 1000, // 5 minutes
                        // Retry configuration
                        retry: (failureCount, error: any) => {
                            // Don't retry on 4xx errors
                            if (error?.response?.status >= 400 && error?.response?.status < 500) {
                                return false;
                            }
                            // Retry up to 3 times for other errors
                            return failureCount < 3;
                        },
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        retry: false,
                    },
                },
            });
    }
    return globalQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => getQueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
}