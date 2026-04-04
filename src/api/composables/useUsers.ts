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
