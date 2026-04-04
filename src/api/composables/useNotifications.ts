import { ref } from 'vue';
import { ApiError, notificationsService } from '@/api';
import type { Notification, NotificationListParams, PaginationMeta } from '@/api/types';
import { createAsyncState, useAbortController } from './shared';

export function useNotifications() {
    const state = createAsyncState<Notification[]>();
    const meta = ref<PaginationMeta | null>(null);
    const unreadCount = ref<number>(0);
    const controller = useAbortController();

    async function fetch(params?: NotificationListParams) {
        state.loading.value = true;
        state.error.value = null;
        try {
            const result = await notificationsService.list(params, { signal: controller.signal });
            state.data.value = result.items;
            meta.value = result.meta;
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                state.error.value = err;
            }
        } finally {
            state.loading.value = false;
        }
    }

    async function fetchUnreadCount() {
        try {
            unreadCount.value = await notificationsService.getUnreadCount({
                signal: controller.signal
            });
        } catch {
            // Silently fail for badge updates
        }
    }

    async function markAsRead(id: number): Promise<void> {
        await notificationsService.markAsRead(id);
        if (state.data.value) {
            const n = state.data.value.find((n) => n.id === id);
            if (n) n.is_read = true;
        }
        unreadCount.value = Math.max(0, unreadCount.value - 1);
    }

    async function markAllAsRead(): Promise<void> {
        await notificationsService.markAllAsRead();
        state.data.value?.forEach((n) => (n.is_read = true));
        unreadCount.value = 0;
    }

    return { ...state, meta, unreadCount, fetch, fetchUnreadCount, markAsRead, markAllAsRead };
}
