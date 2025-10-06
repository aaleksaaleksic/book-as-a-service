import type { AxiosInstance } from 'axios';
import type { Subscription } from '@/types/subscription';

export interface UserSubscriptionResponse {
    success: boolean;
    subscription: Subscription | null;
}

export const subscriptionsApi = {
    getCurrentUserSubscription: (client: AxiosInstance) =>
        client.get<UserSubscriptionResponse>('/api/v1/subscriptions/my'),
};
