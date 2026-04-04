// import { ref } from 'vue';
import { ApiError } from '@/api';
import { dashboardService } from '@/api/services/dashboardService';
import type { DashboardStats, DashboardFilters } from '@/api/types';
import { createAsyncState, useAbortController } from './shared';

export function useDashboard() {
    const statsState = createAsyncState<DashboardStats>();
    const filtersState = createAsyncState<DashboardFilters>();
    const controller = useAbortController();

    async function fetchStats() {
        statsState.loading.value = true;
        statsState.error.value = null;
        try {
            statsState.data.value = await dashboardService.getStats({ signal: controller.signal });
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                statsState.error.value = err;
            }
        } finally {
            statsState.loading.value = false;
        }
    }

    async function fetchFilters() {
        filtersState.loading.value = true;
        filtersState.error.value = null;
        try {
            filtersState.data.value = await dashboardService.getFilters({
                signal: controller.signal
            });
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                filtersState.error.value = err;
            }
        } finally {
            filtersState.loading.value = false;
        }
    }

    return {
        stats: statsState.data,
        statsLoading: statsState.loading,
        statsError: statsState.error,
        fetchStats,
        filters: filtersState.data,
        filtersLoading: filtersState.loading,
        filtersError: filtersState.error,
        fetchFilters
    };
}
