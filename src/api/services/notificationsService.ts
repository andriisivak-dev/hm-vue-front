import { useHttpClient, apiCache, type RequestOptions } from '@/api';
import type { Notification, NotificationListParams, PaginatedResult } from '@/api/types';
import type { ApiSuccessResponse, PaginationMeta } from '@/api';

const NOTIFICATIONS_CACHE_KEY = '/notifications';

async function fetchPaginated<T>(
    baseUrl: string,
    nonce: string,
    path: string,
    params?: Record<string, unknown>,
    signal?: AbortSignal
): Promise<PaginatedResult<T>> {
    const url = new URL(`${baseUrl}${path}`);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v === undefined || v === null || v === '') continue;
            if (Array.isArray(v)) v.forEach((i) => url.searchParams.append(k, String(i)));
            else url.searchParams.set(k, String(v));
        }
    }

    const response = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
        signal
    });

    const envelope = (await response.json()) as ApiSuccessResponse<T[]> & { meta?: PaginationMeta };
    return {
        items: envelope.data ?? [],
        meta: envelope.meta ?? { total: 0, total_pages: 1, page: 1, per_page: 20 }
    };
}

export const notificationsService = {
    /**
     * GET /notifications
     * Short cache — notifications are time-sensitive.
     */
    async list(
        params?: NotificationListParams,
        options?: RequestOptions
    ): Promise<PaginatedResult<Notification>> {
        const client = useHttpClient();
        const { baseUrl, nonce } = client as unknown as { baseUrl: string; nonce: string };
        return fetchPaginated<Notification>(
            baseUrl,
            nonce,
            NOTIFICATIONS_CACHE_KEY,
            params as Record<string, unknown>,
            options?.signal
        );
    },

    /**
     * GET /notifications/unread-count
     * Lightweight poll endpoint for badge counter.
     */
    async getUnreadCount(options?: RequestOptions): Promise<number> {
        const client = useHttpClient();
        const result = await client.get<{ unread_count: number }>(
            '/notifications/unread-count',
            undefined,
            { cacheTtl: 15_000, ...options }
        );
        return result.unread_count;
    },

    /**
     * PATCH /notifications/:id/read
     */
    async markAsRead(id: number, options?: RequestOptions): Promise<void> {
        const client = useHttpClient();
        await client.patch(`/notifications/${id}/read`, undefined, options);
        apiCache.invalidate(NOTIFICATIONS_CACHE_KEY);
        apiCache.invalidate('/notifications/unread-count');
    },

    /**
     * POST /notifications/read-all
     */
    async markAllAsRead(options?: RequestOptions): Promise<void> {
        const client = useHttpClient();
        await client.post('/notifications/read-all', undefined, options);
        apiCache.invalidate(NOTIFICATIONS_CACHE_KEY);
        apiCache.invalidate('/notifications/unread-count');
    }
};
