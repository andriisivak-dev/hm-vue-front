import { useHttpClient, type RequestOptions } from '@/api/core/httpClient';
import type { Customer, CustomerListParams, CustomerStats } from '@/api/types/customers';
import type { ApiSuccessResponse, PaginationMeta, PaginatedResult } from '@/api/types/common';

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
            url.searchParams.set(k, String(v));
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

export const customersService = {
    async list(
        params?: CustomerListParams,
        options?: RequestOptions
    ): Promise<PaginatedResult<Customer>> {
        const client = useHttpClient();
        const { baseUrl, nonce } = client as unknown as { baseUrl: string; nonce: string };
        return fetchPaginated<Customer>(
            baseUrl,
            nonce,
            '/customers',
            params as Record<string, unknown>,
            options?.signal
        );
    },

    async stats(options?: RequestOptions): Promise<CustomerStats> {
        const client = useHttpClient();
        return client.get<CustomerStats>('/customers/stats', undefined, options);
    },

    async get(id: number, options?: RequestOptions): Promise<Customer> {
        const client = useHttpClient();
        return client.get<Customer>(`/customers/${id}`, undefined, options);
    },

    async create(data: FormData, options?: RequestOptions): Promise<Customer> {
        const client = useHttpClient();
        return client.post<Customer>('/customers', data, options);
    },

    async update(
        id: number,
        data: Record<string, unknown>,
        options?: RequestOptions
    ): Promise<Customer> {
        const client = useHttpClient();
        return client.patch<Customer>(`/customers/${id}`, data, options);
    },

    async delete(id: number, options?: RequestOptions): Promise<void> {
        const client = useHttpClient();
        return client.delete<void>(`/customers/${id}`, options);
    },

    async uploadLogo(id: number, formData: FormData, options?: RequestOptions): Promise<Customer> {
        const client = useHttpClient();
        return client.post<Customer>(`/customers/${id}/logo`, formData, options);
    }
};
