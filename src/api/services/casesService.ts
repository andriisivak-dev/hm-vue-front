import { useHttpClient, type RequestOptions, apiCache } from '@/api';
import type {
    CaseListItem,
    CaseDetail,
    PaginatedResult,
    CaseListParams,
    CreateCaseBody,
    UpdateFormDataBody,
    StatusActionBody,
    OverrideStatusBody,
    PaginationMeta,
    ApiSuccessResponse
} from '@/api';

// Cache TTL constants (ms)
const CASE_DETAIL_TTL = 60_000; // 1min

function caseKey(id: number): string {
    return `/cases/${id}`;
}

/**
 * Backend envelope: { success, data: T[], message, meta: PaginationMeta }
 * HttpClient unwraps only `data`. For paginated endpoints we read the full
 * envelope to extract `meta` alongside the items.
 */
async function fetchPaginated<T>(
    baseUrl: string,
    nonce: string,
    path: string,
    params?: Record<string, unknown>,
    signal?: AbortSignal
): Promise<PaginatedResult<T>> {
    const url = new URL(`${baseUrl}${path}`);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v === undefined || v === null || v === '') continue;
            if (Array.isArray(v)) v.forEach((i) => url.searchParams.append(k, String(i)));
            else url.searchParams.set(k, String(v));
        }
    }

    const response = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
        signal
    });

    const envelope = (await response.json()) as ApiSuccessResponse<T[]> & { meta?: PaginationMeta };
    return {
        items: envelope.data ?? [],
        meta: envelope.meta ?? { total: 0, total_pages: 1, page: 1, per_page: 20 }
    };
}

export const casesService = {
    /**
     * GET /cases
     * Returns a paginated list of cases scoped by the current user's role.
     */
    async list(
        params?: CaseListParams,
        options?: RequestOptions
    ): Promise<PaginatedResult<CaseListItem>> {
        const client = useHttpClient();
        // Access internals for raw fetch — needed to capture pagination meta
        const { baseUrl, nonce } = client as unknown as { baseUrl: string; nonce: string };
        return fetchPaginated<CaseListItem>(
            baseUrl,
            nonce,
            '/cases',
            params as Record<string, unknown>,
            options?.signal
        );
    },

    /**
     * GET /cases/:id
     * Fetches full case detail with permissions and review history.
     */
    async get(id: number, options?: RequestOptions): Promise<CaseDetail> {
        const client = useHttpClient();
        return client.get<CaseDetail>(`/cases/${id}`, undefined, {
            cacheTtl: CASE_DETAIL_TTL,
            ...options
        });
    },

    /**
     * POST /cases
     * Creates a new draft case.
     */
    async create(body: CreateCaseBody, options?: RequestOptions): Promise<CaseDetail> {
        const client = useHttpClient();
        const result = await client.post<CaseDetail>('/cases', body, options);
        apiCache.invalidate('/cases');
        return result;
    },

    /**
     * DELETE /cases/:id
     * Soft-deletes (trashes) a case.
     */
    async delete(id: number, options?: RequestOptions): Promise<void> {
        const client = useHttpClient();
        await client.delete(caseKey(id), options);
        apiCache.invalidate('/cases');
        apiCache.invalidate(caseKey(id));
    },

    // ── Form Data ─────────────────────────────────────────────────────────────

    /**
     * GET /cases/:id/form-data
     * Returns the raw GravityForms field values for a case.
     */
    async getFormData(id: number, options?: RequestOptions): Promise<Record<string, unknown>> {
        const client = useHttpClient();
        return client.get<Record<string, unknown>>(`/cases/${id}/form-data`, undefined, {
            cacheTtl: CASE_DETAIL_TTL,
            ...options
        });
    },

    /**
     * PATCH /cases/:id/form-data
     * Saves form fields and advances the current step.
     */
    async updateFormData(
        id: number,
        body: UpdateFormDataBody,
        options?: RequestOptions
    ): Promise<Record<string, unknown>> {
        const client = useHttpClient();
        const result = await client.patch<Record<string, unknown>>(
            `/cases/${id}/form-data`,
            body,
            options
        );
        apiCache.invalidate(caseKey(id));
        return result;
    },

    // ── Status transitions ────────────────────────────────────────────────────

    /**
     * POST /cases/:id/submit
     * Submits a draft case for review.
     */
    async submit(id: number, options?: RequestOptions): Promise<unknown> {
        return casesService._statusAction(id, 'submit', undefined, options);
    },

    /**
     * POST /cases/:id/approve
     * Approves a case in review.
     */
    async approve(id: number, options?: RequestOptions): Promise<unknown> {
        return casesService._statusAction(id, 'approve', undefined, options);
    },

    /**
     * POST /cases/:id/reject
     * Rejects a case. Requires a message.
     */
    async reject(id: number, message: string, options?: RequestOptions): Promise<unknown> {
        return casesService._statusAction(id, 'reject', { message }, options);
    },

    /**
     * POST /cases/:id/return
     * Returns a case for revision. Requires a message.
     */
    async returnForRevision(
        id: number,
        message: string,
        options?: RequestOptions
    ): Promise<unknown> {
        return casesService._statusAction(id, 'return', { message }, options);
    },

    /**
     * PATCH /cases/:id/status
     * Admin-only: override status directly.
     */
    async overrideStatus(
        id: number,
        body: OverrideStatusBody,
        options?: RequestOptions
    ): Promise<unknown> {
        const client = useHttpClient();
        const result = await client.patch<unknown>(`/cases/${id}/status`, body, options);
        apiCache.invalidate(caseKey(id));
        apiCache.invalidate('/cases');
        return result;
    },

    // ── Private helpers ───────────────────────────────────────────────────────

    async _statusAction(
        id: number,
        action: 'submit' | 'approve' | 'reject' | 'return',
        body?: StatusActionBody,
        options?: RequestOptions
    ): Promise<unknown> {
        const client = useHttpClient();
        const result = await client.post<unknown>(`/cases/${id}/${action}`, body, options);
        apiCache.invalidate(caseKey(id));
        apiCache.invalidate('/cases');
        return result;
    }
};
