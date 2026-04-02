/**
 * Centralised registry for files that have been selected by the user but not
 * yet uploaded to the WP Media Library.
 */

import { reactive } from 'vue';
import { casesService } from '@/api/services/casesService';
import { useCaseFormStore } from '@/form-engine/useFormStore';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PendingFile {
    /** Unique local ID (used by FileUploadField to track UI state) */
    localId: string;
    file: File;
    /** Blob URL for preview — will be revoked on flush / removal */
    previewUrl: string | null;
}

/** Internal registry: fieldId → array of pending files */
type QueueMap = Map<string, PendingFile[]>;

// ── Singletons (shared across the whole form session) ──────────────────────────

const queue = reactive<QueueMap>(new Map());

/** resolvedMap[fieldId][localId] = uploadedUrl */
const resolvedMap = reactive<Record<string, Record<string, string>>>({});

// ── Public API ─────────────────────────────────────────────────────────────────

export function useFileUploadQueue() {
    const store = useCaseFormStore();

    /**
     * Called by FileUploadField when the user adds a file to a field.
     */
    function enqueuePending(fieldId: string, pending: PendingFile): void {
        if (!queue.has(fieldId)) queue.set(fieldId, []);
        queue.get(fieldId)!.push(pending);
    }

    /**
     * Called by FileUploadField when the user removes a file that hasn't been
     * uploaded yet. The blob URL is revoked to free memory immediately.
     */
    function dequeuePending(fieldId: string, localId: string): void {
        const list = queue.get(fieldId);
        if (!list) return;

        const idx = list.findIndex((p) => p.localId === localId);
        if (idx !== -1) {
            const [removed] = list.splice(idx, 1);
            if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
        }

        if (list.length === 0) queue.delete(fieldId);
    }

    /**
     * Called by FormRenderer right before it persists form data to the backend.
     *
     * Works per-field: all files for the same field are uploaded in parallel.
     * After each upload:
     *   1. resolvedMap[fieldId][localId] = url <- FileUploadField sync-watcher
     *      fires here and updates the pending entry in-place.
     *   2. store.updateValue() is called with real remote URLs only (provisional
     *      blob:/pending: markers are stripped out).
     *
     * @param onProgress - optional per-file progress callback (0-100)
     * @throws Rethrows the first upload error so FormRenderer can surface it.
     */
    async function flushQueue(
        onProgress?: (fieldId: string, localId: string, percent: number) => void
    ): Promise<void> {
        const entries = [...queue.entries()]; // snapshot before mutation
        if (entries.length === 0) return;

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
                // Upload all files for this field concurrently
                const newUrls = await Promise.all(
                    pendingList.map(async (pending) => {
                        const response = await casesService.uploadMedia(pending.file, (percent) =>
                            onProgress?.(fieldId, pending.localId, percent)
                        );

                        if (!resolvedMap[fieldId]) resolvedMap[fieldId] = {};
                        resolvedMap[fieldId][pending.localId] = response.source_url;

                        // Revoke blob preview URL — we now have the real URL
                        if (pending.previewUrl) URL.revokeObjectURL(pending.previewUrl);

                        return response.source_url;
                    })
                );

                const existingRemote = toRemoteArray(store.values[fieldId]);
                const merged = [...existingRemote, ...newUrls];
                store.updateValue(fieldId, merged.length === 1 ? merged[0] : merged);

                // Clear the queue for this field
                queue.delete(fieldId);
            })
        );
    }

    /**
     * Resets the entire queue (e.g. on form unmount or navigation away).
     */
    function clearAll(): void {
        queue.forEach((list) => {
            list.forEach((p) => {
                if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
            });
        });
        queue.clear();

        Object.keys(resolvedMap).forEach((k) => delete resolvedMap[k]);
    }

    return {
        queue,
        resolvedMap,
        enqueuePending,
        dequeuePending,
        flushQueue,
        clearAll
    };
}
