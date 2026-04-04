import { defineStore } from 'pinia';
import { casesService } from '@/api';

interface ActivitiesState {
    stats: Record<string, number>;
    loading: boolean;
    error: Error | null;
}

export const useActivitiesStore = defineStore('activities', {
    state: (): ActivitiesState => ({
        stats: {
            pending_review: 0,
            returned: 0,
            approved: 0,
            rejected: 0,
            draft: 0
        },
        loading: false,
        error: null
    }),
    actions: {
        async fetchActivities() {
            this.loading = true;
            this.error = null;
            try {
                const data = await casesService.getActivities();
                this.stats = { ...this.stats, ...data };
            } catch (err) {
                this.error = err as Error;
            } finally {
                this.loading = false;
            }
        }
    }
});
