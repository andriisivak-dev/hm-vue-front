import { ApiError, formsService } from '@/api';
import type { FormSchema } from '@/api/types';
import { createAsyncState, useAbortController } from './shared';

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
