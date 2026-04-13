/**
 * @file stores/fileUploadQueue.ts
 *
 * Centralised Pinia store for files that have been selected by the user but
 * not yet uploaded to the WP Media Library.
 *
 * WHY PINIA INSTEAD OF A MODULE SINGLETON:
 * The previous implementation kept `queue` and `resolvedMap` as module-level
 * variables in a composable.  In development (Vite HMR), every module is
 * cached centrally — so both FormRenderer and FileUploadField share the same
 * instance.  In a production Vite bundle however, FileUploadField is loaded
 * via defineAsyncComponent (a separate JS chunk).  Rollup can then place the
 * composable module in the async chunk, creating TWO independent instances of
 * `queue`.  FormRenderer writes to one, FileUploadField reads from another →
 * flushQueue() always sees an empty queue → no upload request is ever sent.
 *
 * Pinia stores are attached to the Vue app instance (not to a JS module), so
 * they are always a single shared instance regardless of code-splitting.
 */

import { defineStore } from 'pinia';
import { casesService } from '@/api/services/casesService';
import { useCaseFormStore } from '@/form-engine/useFormStore';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PendingFile {
    /** Unique local ID (used by FileUploadField to track UI state) */
    localId: string;
    file: File;
    /** Blob URL for preview — will be revoked on flush / removal */
    previewUrl: string | null;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useFileUploadQueueStore = defineStore('fileUploadQueue', {
    state: () => ({
        /**
         * fieldId → array of pending files.
         * Plain object (not Map) so Pinia can make it reactive.
         */
        queue: {} as Record<string, PendingFile[]>,

        /**
         * resolvedMap[fieldId][localId] = uploadedUrl
         * Populated by flushQueue as each file upload completes.
         */
        resolvedMap: {} as Record<string, Record<string, string>>
    }),

    actions: {
        // ── Queue management ────────────────────────────────────────────────

        /**
         * Called by FileUploadField when the user adds a file.
         */
        enqueuePending(fieldId: string, pending: PendingFile): void {
            if (!this.queue[fieldId]) {
                this.queue[fieldId] = [];
            }
            this.queue[fieldId].push(pending);
        },

        /**
         * Called by FileUploadField when the user removes a file that hasn't
         * been uploaded yet.  The blob URL is revoked to free memory.
         */
        dequeuePending(fieldId: string, localId: string): void {
            const list = this.queue[fieldId];
            if (!list) return;

            const idx = list.findIndex((p) => p.localId === localId);
            if (idx !== -1) {
                const [removed] = list.splice(idx, 1);
                if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
            }

            if (list.length === 0) {
                delete this.queue[fieldId];
            }
        },

        /**
         * Called by FormRenderer right before it persists form data to the
         * backend.
         *
         * Uploads all pending files concurrently per field, then updates the
         * form store with real remote URLs.
         *
         * @throws Rethrows the first upload error so FormRenderer can surface it.
         */
        async flushQueue(
            onProgress?: (fieldId: string, localId: string, percent: number) => void
        ): Promise<void> {
            const entries = Object.entries(this.queue);
            if (entries.length === 0) return;

            const formStore = useCaseFormStore();

            /** True only for real remote URLs — excludes blob: and pending: provisionals */
            const isRemoteUrl = (v: unknown): v is string =>
                typeof v === 'string' && !v.startsWith('blob:') && !v.startsWith('pending:');

            /** Normalise a store value to an array of remote-only strings */
            const toRemoteArray = (v: unknown): string[] => {
                if (Array.isArray(v)) return v.filter(isRemoteUrl);
                if (isRemoteUrl(v)) return [v as string];
                return [];
            };

            await Promise.all(
                entries.map(async ([fieldId, pendingList]) => {
                    const newUrls = await Promise.all(
                        pendingList.map(async (pending) => {
                            const response = await casesService.uploadMedia(
                                pending.file,
                                (percent) => onProgress?.(fieldId, pending.localId, percent)
                            );

                            if (!this.resolvedMap[fieldId]) {
                                this.resolvedMap[fieldId] = {};
                            }
                            this.resolvedMap[fieldId][pending.localId] = response.source_url;

                            // Revoke blob preview — we now have the real URL
                            if (pending.previewUrl) URL.revokeObjectURL(pending.previewUrl);

                            return response.source_url;
                        })
                    );

                    const existingRemote = toRemoteArray(formStore.values[fieldId]);
                    const merged = [...existingRemote, ...newUrls];
                    formStore.updateValue(fieldId, merged.length === 1 ? merged[0] : merged);

                    // Clear the queue for this field
                    delete this.queue[fieldId];
                })
            );
        },

        /**
         * Resets the entire queue (called on FormRenderer unmount).
         */
        clearAll(): void {
            Object.values(this.queue).forEach((list) => {
                list.forEach((p) => {
                    if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
                });
            });
            this.queue = {};
            this.resolvedMap = {};
        }
    }
});
