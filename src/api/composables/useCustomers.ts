import { ref } from 'vue';
import { ApiError } from '@/api';
import { customersService } from '@/api/services/customersService';
import type { Customer, CustomerListParams } from '@/api/types/customers';
import type { PaginationMeta } from '@/api/types/common';
import { createAsyncState, useAbortController } from './shared';

export function useCustomerList() {
    const state = createAsyncState<Customer[]>();
    const meta = ref<PaginationMeta | null>(null);
    const controller = useAbortController();

    async function fetch(params?: CustomerListParams) {
        state.loading.value = true;
        state.error.value = null;
        try {
            const result = await customersService.list(params, { signal: controller.signal });
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

export function useCustomerMutations() {
    const loading = ref(false);
    const error = ref<ApiError | null>(null);
    const controller = useAbortController();

    async function create(data: FormData): Promise<Customer | null> {
        return run(() => customersService.create(data, { signal: controller.signal }));
    }

    async function update(id: number, data: Record<string, unknown>): Promise<Customer | null> {
        return run(() => customersService.update(id, data, { signal: controller.signal }));
    }

    async function remove(id: number): Promise<boolean> {
        const result = await run(() => customersService.delete(id, { signal: controller.signal }));
        return result !== null;
    }

    async function uploadLogo(id: number, formData: FormData): Promise<Customer | null> {
        return run(() => customersService.uploadLogo(id, formData, { signal: controller.signal }));
    }

    async function getCustomer(id: number): Promise<Customer | null> {
        return run(() => customersService.get(id, { signal: controller.signal }));
    }

    async function run<T>(fn: () => Promise<T>): Promise<T | null> {
        loading.value = true;
        error.value = null;
        try {
            return await fn();
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                error.value = err;
                throw err;
            }
            return null;
        } finally {
            loading.value = false;
        }
    }

    return { loading, error, create, update, remove, uploadLogo, getCustomer };
}

export function useCustomerStats() {
    const total = ref<number>(0);
    const loading = ref(false);
    const controller = useAbortController();

    async function fetch() {
        loading.value = true;
        try {
            const result = await customersService.stats({ signal: controller.signal });
            total.value = result.total;
        } catch {
            // silent
        } finally {
            loading.value = false;
        }
    }

    return { total, loading, fetch };
}
