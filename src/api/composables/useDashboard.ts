// import { ref } from 'vue';
import { ApiError } from '@/api';
import { dashboardService } from '@/api/services/dashboardService';
import type { DashboardStats, DashboardFilters, UserHierarchy } from '@/api/types';
import { createAsyncState, useAbortController } from './shared';

export function useDashboard() {
    const statsState = createAsyncState<DashboardStats>();
    const filtersState = createAsyncState<DashboardFilters>();
    const controller = useAbortController();

    async function fetchStats(force = false) {
        statsState.loading.value = true;
        statsState.error.value = null;
        try {
            statsState.data.value = await dashboardService.getStats({
                signal: controller.signal,
                force
            });
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                statsState.error.value = err;
            }
        } finally {
            statsState.loading.value = false;
        }
    }

    async function fetchFilters(context?: string) {
        filtersState.loading.value = true;
        filtersState.error.value = null;
        try {
            filtersState.data.value = await dashboardService.getFilters(context, {
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

export function useUserHierarchy() {
    const state = createAsyncState<UserHierarchy>();
    const controller = useAbortController();

    async function fetchHierarchy() {
        state.loading.value = true;
        state.error.value = null;
        try {
            state.data.value = await dashboardService.getHierarchy({
                signal: controller.signal
            });
        } catch (err) {
            if (err instanceof ApiError && !err.isAborted) {
                state.error.value = err;
            }
        } finally {
            state.loading.value = false;
        }
    }

    return {
        hierarchy: state.data,
        hierarchyLoading: state.loading,
        hierarchyError: state.error,
        fetchHierarchy
    };
}
