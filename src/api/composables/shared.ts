import { ref, onUnmounted, type Ref } from 'vue';
import { ApiError } from '@/api';

export interface AsyncState<T> {
    data: Ref<T | null>;
    error: Ref<ApiError | null>;
    loading: Ref<boolean>;
}

export function createAsyncState<T>(): AsyncState<T> {
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
export function useAbortController(): AbortController {
    const controller = new AbortController();
    onUnmounted(() => controller.abort());
    return controller;
}
