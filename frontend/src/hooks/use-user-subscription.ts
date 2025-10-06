"use client";

import { useQuery } from "@tanstack/react-query";
import { useHttpClient } from "@/context/HttpClientProvider";
import { subscriptionsApi } from "@/api/subscriptions";
import type { Subscription } from "@/types/subscription";
import { useAuth } from "@/hooks/useAuth";

export function useUserSubscription() {
    const client = useHttpClient();
    const { isAuthenticated } = useAuth();

    return useQuery<Subscription | null>({
        queryKey: ["user", "subscription"],
        queryFn: async () => {
            try {
                const response = await subscriptionsApi.getCurrentUserSubscription(client);
                return response.data?.subscription || null;
            } catch (error) {
                console.error('Failed to fetch user subscription:', error);
                return null;
            }
        },
        enabled: isAuthenticated, // Only fetch when user is authenticated
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false, // Don't retry on auth errors
    });
}
