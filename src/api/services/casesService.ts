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
     * GET /case-library
     * Returns a paginated list of all approved cases.
     */
    async library(
        params?: CaseListParams,
        options?: RequestOptions
    ): Promise<PaginatedResult<CaseListItem>> {
        const client = useHttpClient();
        const { baseUrl, nonce } = client as unknown as { baseUrl: string; nonce: string };
        return fetchPaginated<CaseListItem>(
            baseUrl,
            nonce,
            '/case-library',
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

    /**
     * POST /wp/v2/media
     * Uploads a file natively to the WP Media library.
     *
     * Called by FileUploadField for immediate uploads and by flushQueue() as a
     * safety net before step-save if any pending uploads remain.
     *
     * Implementation notes:
     * - URL is derived from the configured baseUrl by replacing the custom
     *   namespace segment so the code works on any domain without hard-coding.
     * - The ?hmctx=case_media query param is forwarded so the PHP backend can
     *   route the attachment into a dedicated sub-folder and suppress thumbnails.
     * - We send a raw binary body + Content-Type + Content-Disposition header.
     *   This is the WP REST API canonical upload method and avoids server-side
     *   issues caused by mixing multipart FormData with Content-Disposition.
     * - XMLHttpRequest is used to expose real upload progress events.
     */
    async uploadMedia(
        file: File,
        options?: {
            onProgress?: (percent: number) => void;
            signal?: AbortSignal;
        }
    ): Promise<{ id: number; source_url: string }> {
        const client = useHttpClient();
        const { baseUrl, nonce } = client as unknown as { baseUrl: string; nonce: string };

        // Derive the WP core media endpoint from our custom namespace URL.
        // e.g. https://example.com/wp-json/csp/v1  -->  https://example.com/wp-json/wp/v2/media
        const parsedBase = new URL(baseUrl);
        const wpJsonPath = parsedBase.pathname.replace(/\/csp\/v1\/?$/, '');
        const mediaUrl = new URL(`${wpJsonPath}/wp/v2/media?hmctx=case_media`, parsedBase.origin);

        const { onProgress, signal } = options || {};

        return new Promise<{ id: number; source_url: string }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', mediaUrl.toString(), true);
            xhr.responseType = 'json';
            xhr.setRequestHeader('X-WP-Nonce', nonce);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.setRequestHeader(
                'Content-Disposition',
                `attachment; filename="${encodeURIComponent(file.name)}"`
            );

            const abortUpload = () => {
                xhr.abort();
            };

            if (signal) {
                if (signal.aborted) {
                    reject(new DOMException('Upload aborted', 'AbortError'));
                    return;
                }
                signal.addEventListener('abort', abortUpload, { once: true });
            }

            xhr.upload.onprogress = (event) => {
                if (!onProgress || !event.lengthComputable || event.total <= 0) return;
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(Math.min(100, Math.max(0, percent)));
            };

            xhr.onerror = () => {
                reject(new Error('Upload failed: network error'));
            };

            xhr.onabort = () => {
                reject(new DOMException('Upload aborted', 'AbortError'));
            };

            xhr.onload = () => {
                const response = xhr.response ?? {};
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(response as { id: number; source_url: string });
                    return;
                }
                const err = response as { message?: string };
                reject(new Error(err?.message ?? `Upload failed (HTTP ${xhr.status})`));
            };

            xhr.onloadend = () => {
                if (signal) {
                    signal.removeEventListener('abort', abortUpload);
                }
            };

            xhr.send(file);
        });
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
    },

    /**
     * GET /cases/activities
     * Returns activities statistics for the current user.
     */
    async getActivities(options?: RequestOptions): Promise<Record<string, number>> {
        const client = useHttpClient();
        return client.get<Record<string, number>>('/cases/activities', undefined, options);
    }
};
