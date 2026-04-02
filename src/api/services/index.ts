import { useHttpClient, apiCache, type RequestOptions } from '@/api';
import type {
    FormSchema,
    User,
    UserListParams,
    Notification,
    NotificationListParams,
    DashboardStats,
    DashboardFilters,
    PaginatedResult
} from '@/api';

// ─────────────────────────────────────────────────────────────────────────────
// Forms service
// ─────────────────────────────────────────────────────────────────────────────

export const formsService = {
    /**
     * GET /forms/:id/schema
     * Form schema is stable — cache aggressively.
     */
    async getSchema(formId: number, options?: RequestOptions): Promise<FormSchema> {
        const client = useHttpClient();
        return client.get<FormSchema>(`/forms/${formId}/schema`, undefined, {
            cacheTtl: 5 * 60_000, // 5 min
            ...options
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Users service
// ─────────────────────────────────────────────────────────────────────────────

export const usersService = {
    /**
     * GET /users
     * Paginated user list. Scope enforced server-side by role.
     */
    async list(params?: UserListParams, options?: RequestOptions): Promise<PaginatedResult<User>> {
        const client = useHttpClient();
        return client.get<PaginatedResult<User>>('/users', params as Record<string, unknown>, {
            cacheTtl: 60_000, // 1 min
            ...options
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Notifications service
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard service
// ─────────────────────────────────────────────────────────────────────────────

export const dashboardService = {
    /**
     * GET /dashboard/stats
     * Role-scoped aggregated case counts.
     */
    async getStats(options?: RequestOptions): Promise<DashboardStats> {
        const client = useHttpClient();
        return client.get<DashboardStats>('/dashboard/stats', undefined, {
            cacheTtl: 30_000,
            ...options
        });
    },

    /**
     * GET /dashboard/filters
     * Taxonomy terms for filter dropdowns.
     */
    async getFilters(options?: RequestOptions): Promise<DashboardFilters> {
        const client = useHttpClient();
        return client.get<DashboardFilters>('/dashboard/filters', undefined, {
            cacheTtl: 5 * 60_000, // taxonomies change rarely
            ...options
        });
    }
};
