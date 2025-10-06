import { useQuery } from '@tanstack/react-query';
import { useHttpClient } from '@/context/HttpClientProvider';
import { analyticsApi, DashboardAnalytics } from '@/api/analytics';

export function useDashboardAnalytics() {
  const client = useHttpClient();

  return useQuery<DashboardAnalytics>({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      const response = await analyticsApi.getDashboardAnalytics(client);
      return response.data.analytics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
