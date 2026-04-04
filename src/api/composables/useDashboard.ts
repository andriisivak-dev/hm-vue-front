import { ref } from 'vue';
import { ApiError } from '@/api';
import type { DashboardStats, DashboardFilters } from '@/api/types';

export function useDashboard() {
    const stats = ref<DashboardStats | null>(null);
    const filters = ref<DashboardFilters | null>(null);
    const loading = ref(false);
    const error = ref<ApiError | null>(null);

    return { stats, filters, loading, error };
}
