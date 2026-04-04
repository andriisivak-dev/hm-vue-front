import { useHttpClient, apiCache, type RequestOptions } from '@/api';
import type { Notification, NotificationListParams, PaginatedResult } from '@/api/types';

const NOTIFICATIONS_CACHE_KEY = '/notifications';

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
        return client.get<PaginatedResult<Notification>>(
            NOTIFICATIONS_CACHE_KEY,
            params as Record<string, unknown>,
            { cacheTtl: 20_000, ...options }
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
