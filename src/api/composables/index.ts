import { ref, onUnmounted, type Ref } from 'vue';
import { ApiError } from '@/api';
import { casesService } from '@/api';
import { formsService, usersService, notificationsService, dashboardService } from '@/api';
import type {
    CaseListItem,
    CaseDetail,
    CaseListParams,
    CreateCaseBody,
    UpdateFormDataBody,
    OverrideStatusBody,
    FormSchema,
    User,
    UserListParams,
    Notification,
    NotificationListParams,
    DashboardStats,
    DashboardFilters,
    // PaginatedResult,
    PaginationMeta
} from '@/api/types';

// ─────────────────────────────────────────────────────────────────────────────
// Shared composable primitives
// ─────────────────────────────────────────────────────────────────────────────

interface AsyncState<T> {
    data: Ref<T | null>;
    error: Ref<ApiError | null>;
    loading: Ref<boolean>;
}

function createAsyncState<T>(): AsyncState<T> {
    return {
        data: ref(null),
        error: ref(null),
        loading: ref(false)
    };
}

/**
 * Returns an AbortController that is automatically aborted when the
 * calling component is unmounted.
 */
function useAbortController(): AbortController {
    const controller = new AbortController();
    onUnmounted(() => controller.abort());
    return controller;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cases composables
// ─────────────────────────────────────────────────────────────────────────────

export function useCaseList() {
    const state = createAsyncState<CaseListItem[]>();
    const meta = ref<PaginationMeta | null>(null);
    const controller = useAbortController();

    async function fetch(params?: CaseListParams) {
        state.loading.value = true;
        state.error.value = null;
        try {
            const result = await casesService.list(params, { signal: controller.signal });
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

    return { ...state, meta, fetch };
}

export function useCaseDetail() {
    const state = createAsyncState<CaseDetail>();
    const controller = useAbortController();

    async function fetch(id: number) {
        state.loading.value = true;
        state.error.value = null;
        try {
            state.data.value = await casesService.get(id, { signal: controller.signal });
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                state.error.value = err;
            }
        } finally {
            state.loading.value = false;
        }
    }

    return { ...state, fetch };
}

export function useCaseFormData() {
    const state = createAsyncState<Record<string, unknown>>();
    const saving = ref(false);
    const saveError = ref<ApiError | null>(null);
    const controller = useAbortController();

    async function fetch(id: number) {
        state.loading.value = true;
        state.error.value = null;
        try {
            state.data.value = await casesService.getFormData(id, { signal: controller.signal });
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                state.error.value = err;
            }
        } finally {
            state.loading.value = false;
        }
    }

    async function save(id: number, body: UpdateFormDataBody): Promise<boolean> {
        saving.value = true;
        saveError.value = null;
        try {
            state.data.value = await casesService.updateFormData(id, body, {
                signal: controller.signal
            });
            return true;
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                saveError.value = err;
            }
            return false;
        } finally {
            saving.value = false;
        }
    }

    return { ...state, saving, saveError, fetch, save };
}

export function useCaseMutations() {
    const loading = ref(false);
    const error = ref<ApiError | null>(null);
    const controller = useAbortController();

    async function create(body: CreateCaseBody): Promise<CaseDetail | null> {
        return run(() => casesService.create(body, { signal: controller.signal }));
    }

    async function remove(id: number): Promise<boolean> {
        const result = await run(() => casesService.delete(id, { signal: controller.signal }));
        return result !== null;
    }

    async function submit(id: number): Promise<boolean> {
        const result = await run(() => casesService.submit(id, { signal: controller.signal }));
        return result !== null;
    }

    async function approve(id: number): Promise<boolean> {
        const result = await run(() => casesService.approve(id, { signal: controller.signal }));
        return result !== null;
    }

    async function reject(id: number, message: string): Promise<boolean> {
        const result = await run(() =>
            casesService.reject(id, message, { signal: controller.signal })
        );
        return result !== null;
    }

    async function returnForRevision(id: number, message: string): Promise<boolean> {
        const result = await run(() =>
            casesService.returnForRevision(id, message, { signal: controller.signal })
        );
        return result !== null;
    }

    async function overrideStatus(id: number, body: OverrideStatusBody): Promise<boolean> {
        const result = await run(() =>
            casesService.overrideStatus(id, body, { signal: controller.signal })
        );
        return result !== null;
    }

    async function run<T>(fn: () => Promise<T>): Promise<T | null> {
        loading.value = true;
        error.value = null;
        try {
            return await fn();
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                error.value = err;
            }
            return null;
        } finally {
            loading.value = false;
        }
    }

    return {
        loading,
        error,
        create,
        remove,
        submit,
        approve,
        reject,
        returnForRevision,
        overrideStatus
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Form schema composable
// ─────────────────────────────────────────────────────────────────────────────

export function useFormSchema() {
    const state = createAsyncState<FormSchema>();
    const controller = useAbortController();

    async function fetch(formId: number) {
        state.loading.value = true;
        state.error.value = null;
        try {
            state.data.value = await formsService.getSchema(formId, { signal: controller.signal });
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                state.error.value = err;
            }
        } finally {
            state.loading.value = false;
        }
    }

    return { ...state, fetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Users composable
// ─────────────────────────────────────────────────────────────────────────────

export function useUserList() {
    const state = createAsyncState<User[]>();
    const meta = ref<PaginationMeta | null>(null);
    const controller = useAbortController();

    async function fetch(params?: UserListParams) {
        state.loading.value = true;
        state.error.value = null;
        try {
            const result = await usersService.list(params, { signal: controller.signal });
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

    return { ...state, meta, fetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications composables
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard composables
// ─────────────────────────────────────────────────────────────────────────────

export function useDashboard() {
    const stats = ref<DashboardStats | null>(null);
    const filters = ref<DashboardFilters | null>(null);
    const loading = ref(false);
    const error = ref<ApiError | null>(null);
    const controller = useAbortController();

    async function fetchStats() {
        loading.value = true;
        error.value = null;
        try {
            stats.value = await dashboardService.getStats({ signal: controller.signal });
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) error.value = err;
        } finally {
            loading.value = false;
        }
    }

    async function fetchFilters() {
        try {
            filters.value = await dashboardService.getFilters({ signal: controller.signal });
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) error.value = err;
        }
    }

    async function fetchAll() {
        await Promise.all([fetchStats(), fetchFilters()]);
    }

    return { stats, filters, loading, error, fetchStats, fetchFilters, fetchAll };
}
