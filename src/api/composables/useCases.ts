import { ref } from 'vue';
import { ApiError } from '@/api';
import { casesService } from '@/api';
import type {
    CaseListItem,
    CaseDetail,
    CaseListParams,
    CreateCaseBody,
    UpdateFormDataBody,
    OverrideStatusBody,
    PaginationMeta
} from '@/api/types';
import { createAsyncState, useAbortController } from './shared';

export function useCaseList() {
    const state = createAsyncState<CaseListItem[]>();
    const meta = ref<PaginationMeta | null>(null);
    const controller = useAbortController();

    async function fetch(params?: CaseListParams, isLibrary = false) {
        state.loading.value = true;
        state.error.value = null;
        try {
            const result = isLibrary
                ? await casesService.library(params, { signal: controller.signal })
                : await casesService.list(params, { signal: controller.signal });
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
