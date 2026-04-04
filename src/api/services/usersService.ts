import { useHttpClient, type RequestOptions } from '@/api';
import type { User, UserListParams, PaginatedResult } from '@/api/types';

import type { ApiSuccessResponse, PaginationMeta } from '@/api';

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

export const usersService = {
    /**
     * GET /users
     * Paginated user list. Scope enforced server-side by role.
     */
    async list(params?: UserListParams, options?: RequestOptions): Promise<PaginatedResult<User>> {
        const client = useHttpClient();
        const { baseUrl, nonce } = client as unknown as { baseUrl: string; nonce: string };
        return fetchPaginated<User>(
            baseUrl,
            nonce,
            '/users',
            params as Record<string, unknown>,
            options?.signal
        );
    },

    async create(data: Record<string, unknown>, options?: RequestOptions): Promise<User> {
        const client = useHttpClient();
        return client.post<User>('/users', data, options);
    },

    async update(
        id: number,
        data: Record<string, unknown>,
        options?: RequestOptions
    ): Promise<User> {
        const client = useHttpClient();
        return client.patch<User>(`/users/${id}`, data, options);
    },

    async delete(id: number, options?: RequestOptions): Promise<void> {
        const client = useHttpClient();
        return client.delete<void>(`/users/${id}`, options);
    },

    /**
     * POST /profile/avatar
     * Upload user avatar using FormData
     */
    async updateAvatar(
        formData: FormData,
        options?: RequestOptions
    ): Promise<{ updated: boolean; avatar_id: number; avatar_url: string }> {
        const client = useHttpClient();
        return client.post<{ updated: boolean; avatar_id: number; avatar_url: string }>(
            '/profile/avatar',
            formData,
            options
        );
    }
};
