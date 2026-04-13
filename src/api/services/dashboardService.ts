import { useHttpClient, type RequestOptions } from '@/api/core/httpClient';
import type {
    DashboardStats,
    DashboardFilters,
    UserHierarchy,
    ActivityItem,
    ActivityFeedParams,
} from '@/api/types';
import type { PaginatedResult, PaginationMeta, ApiSuccessResponse } from '@/api/types/common';

export const dashboardService = {
    async getStats(options?: RequestOptions): Promise<DashboardStats> {
        const client = useHttpClient();
        return client.get<DashboardStats>('/dashboard/stats', undefined, {
            cacheTtl: 30_000,
            ...options
        });
    },

    async getFilters(context?: string, options?: RequestOptions): Promise<DashboardFilters> {
        const client = useHttpClient();
        return client.get<DashboardFilters>(
            '/dashboard/filters',
            context ? { context } : undefined,
            {
                cacheTtl: 300_000,
                ...options
            }
        );
    },

    async getHierarchy(options?: RequestOptions): Promise<UserHierarchy> {
        const client = useHttpClient();
        return client.get<UserHierarchy>('/dashboard/hierarchy', undefined, options);
    },

    async getRecentActivity(
        params: ActivityFeedParams = {},
        options?: RequestOptions
    ): Promise<PaginatedResult<ActivityItem>> {
        const client = useHttpClient();
        const { baseUrl, nonce } = client as unknown as { baseUrl: string; nonce: string };

        const url = new URL(`${baseUrl}/dashboard/recent-activity`);
        if (params.page)     url.searchParams.set('page',     String(params.page));
        if (params.per_page) url.searchParams.set('per_page', String(params.per_page));

        const response = await fetch(url.toString(), {
            headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
            signal: options?.signal,
        });

        const envelope = (await response.json()) as ApiSuccessResponse<ActivityItem[]> & { meta?: PaginationMeta };
        return {
            items: envelope.data ?? [],
            meta:  envelope.meta ?? { total: 0, total_pages: 1, page: 1, per_page: 10 },
        };
    }
};
