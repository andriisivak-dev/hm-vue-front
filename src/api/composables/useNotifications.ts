import { ref, computed } from 'vue';
import { ApiError, notificationsService } from '@/api';
import type { Notification, NotificationListParams, PaginationMeta } from '@/api/types';
import { createAsyncState, useAbortController } from './shared';

export function useNotifications() {
    const state = createAsyncState<Notification[]>();
    const meta = ref<PaginationMeta | null>(null);
    const unreadCount = ref<number>(0);
    const currentPage = ref<number>(1);
    const loadingMore = ref<boolean>(false);
    const controller = useAbortController();

    async function fetch(params?: NotificationListParams) {
        const isLoadMore = (params?.page ?? 1) > 1;

        if (!isLoadMore) {
            state.loading.value = true;
        }
        state.error.value = null;
        currentPage.value = params?.page ?? 1;

        try {
            const result = await notificationsService.list(params, { signal: controller.signal });
            if (currentPage.value === 1) {
                state.data.value = result.items;
            } else {
                state.data.value = [...(state.data.value ?? []), ...result.items];
            }
            meta.value = result.meta;
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                state.error.value = err;
            }
        } finally {
            state.loading.value = false;
            loadingMore.value = false;
        }
    }

    async function fetchNextPage(perPage = 5) {
        if (!meta.value) return;
        if (currentPage.value >= meta.value.total_pages) return;

        loadingMore.value = true;
        await fetch({ page: currentPage.value + 1, per_page: perPage });
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

    const hasMore = computed(() => !!meta.value && currentPage.value < meta.value.total_pages);

    return {
        ...state,
        meta,
        unreadCount,
        currentPage,
        loadingMore,
        hasMore,
        fetch,
        fetchNextPage,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead
    };
}
