import type { AxiosInstance } from 'axios';
import type { Subscription } from '@/types/subscription';

export interface UserSubscriptionResponse {
    success: boolean;
    subscription: Subscription | null;
}

export interface CancelSubscriptionResponse {
    success: boolean;
    message: string;
    subscription: Subscription;
}

export const subscriptionsApi = {
    getCurrentUserSubscription: (client: AxiosInstance) =>
        client.get<UserSubscriptionResponse>('/api/v1/subscriptions/my'),

    cancelSubscription: (client: AxiosInstance, subscriptionId: number) =>
        client.post<CancelSubscriptionResponse>(`/api/v1/subscriptions/${subscriptionId}/cancel`),
};
