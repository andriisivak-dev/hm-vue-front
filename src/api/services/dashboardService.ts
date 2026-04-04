import { useHttpClient, type RequestOptions } from '@/api/core/httpClient';
import type { DashboardStats, DashboardFilters } from '@/api/types';

export const dashboardService = {
    async getStats(options?: RequestOptions): Promise<DashboardStats> {
        const client = useHttpClient();
        return client.get<DashboardStats>('/dashboard/stats', undefined, {
            cacheTtl: 30_000,
            ...options
        });
    },

    async getFilters(options?: RequestOptions): Promise<DashboardFilters> {
        const client = useHttpClient();
        return client.get<DashboardFilters>('/dashboard/filters', undefined, {
            cacheTtl: 300_000,
            ...options
        });
    }
};
