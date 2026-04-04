import { useHttpClient, type RequestOptions } from '@/api';
import type { User, UserListParams, PaginatedResult } from '@/api/types';

export const usersService = {
    /**
     * GET /users
     * Paginated user list. Scope enforced server-side by role.
     */
    async list(params?: UserListParams, options?: RequestOptions): Promise<PaginatedResult<User>> {
        const client = useHttpClient();
        return client.get<PaginatedResult<User>>('/users', params as Record<string, unknown>, {
            cacheTtl: 60_000, // 1 min
            ...options
        });
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
