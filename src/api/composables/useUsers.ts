import { ref } from 'vue';
import { ApiError, usersService } from '@/api';
import type { User, UserListParams, PaginationMeta } from '@/api/types';
import { createAsyncState, useAbortController } from './shared';

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

export function useUserMutations() {
    const loading = ref(false);
    const error = ref<ApiError | null>(null);
    const controller = useAbortController();

    async function create(data: Record<string, unknown>): Promise<User | null> {
        return run(() => usersService.create(data, { signal: controller.signal }));
    }

    async function update(id: number, data: Record<string, unknown>): Promise<User | null> {
        return run(() => usersService.update(id, data, { signal: controller.signal }));
    }

    async function remove(id: number): Promise<boolean> {
        const result = await run(() => usersService.delete(id, { signal: controller.signal }));
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

    return { loading, error, create, update, remove };
}
