import { useHttpClient, type RequestOptions } from '@/api';
import type { FormSchema } from '@/api/types';

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
