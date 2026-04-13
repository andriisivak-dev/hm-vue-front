<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import type { GFField } from '@/form-engine/types.ts';
import { X, UploadCloud, File as FileIcon } from 'lucide-vue-next';
import { useFileUploadQueueStore, type PendingFile } from '@/stores/fileUploadQueue';
import { useCaseFormStore } from '@/form-engine/useFormStore.ts';
import BaseField from './BaseField.vue';

const store = useCaseFormStore();

type FileStatus = 'pending' | 'uploaded' | 'error';

interface LocalFile {
    id: string;
    /** The raw File object — null for 'uploaded' entries loaded from modelValue */
    file: File | null;
    /** Blob URL (pending/image) or remote URL (uploaded image) — null for non-images */
    previewUrl: string | null;
    progress: number;
    status: FileStatus;
    errorMessage?: string;
    /** Remote URL — set once uploaded */
    uploadedUrl?: string;
}

const props = defineProps<{
    field: GFField;
    modelValue?: string | string[];
    error?: string;
}>();

const emit = defineEmits<{
    (e: 'update:model-value', value: string | string[] | null): void;
}>();

const fieldId = String(props.field.id);
const uploadQueue = useFileUploadQueueStore();
const { enqueuePending, dequeuePending, uploadPendingFile } = uploadQueue;

const isReadonly = computed(() => {
    return store.isFieldReadonly(props.field.id);
});

const files = ref<LocalFile[]>([]);
const uploadWarnings = ref<string[]>([]);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const uploadControllers = new Map<string, AbortController>();

/**
 * Sync watcher on resolvedMap[fieldId]
 */
watch(
    () => uploadQueue.resolvedMap[fieldId],
    (resolved) => {
        if (!resolved) return;
        Object.entries(resolved).forEach(([localId, url]) => {
            const f = files.value.find((f) => f.id === localId);
            if (f && !f.uploadedUrl) {
                f.uploadedUrl = url;
                f.progress = 100;
                f.status = 'uploaded';
            }
        });
        updateModelValue();
    },
    { deep: true, flush: 'sync' }
);

// ── Hydrate from modelValue (pre-filled data from existing case) ────────────────

const isRemoteUrl = (url: string): boolean =>
    !url.startsWith('blob:') && !url.startsWith('pending:');

watch(
    () => props.modelValue,
    (newVal) => {
        if (!newVal) return;

        let urls: string[] = [];
        if (Array.isArray(newVal)) {
            urls = newVal as string[];
        } else if (typeof newVal === 'string') {
            try {
                const parsed = JSON.parse(newVal);
                urls = Array.isArray(parsed) ? parsed : [newVal];
            } catch {
                urls = [newVal];
            }
        }

        urls.forEach((url) => {
            if (typeof url !== 'string') return;
            if (!isRemoteUrl(url)) return;

            const exists = files.value.some((f) => f.uploadedUrl === url);
            if (!exists) {
                const extMatch = url.split('.').pop()?.toLowerCase();
                const isImg =
                    !!extMatch && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extMatch);

                files.value.push({
                    id: crypto.randomUUID(),
                    file: null,
                    previewUrl: isImg ? url : null,
                    progress: 100,
                    status: 'uploaded',
                    uploadedUrl: url
                });
            }
        });
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    uploadControllers.forEach((controller) => controller.abort());
    uploadControllers.clear();
    // Revoke any remaining blob URLs that weren't flushed
    files.value.forEach((f) => {
        if (f.previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(f.previewUrl);
        }
    });
});

const triggerFileSelect = () => fileInput.value?.click();

const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = true;
};
const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;
};
const onDrop = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;
    if (e.dataTransfer?.files) handleFiles(Array.from(e.dataTransfer.files));
};
const onFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files) handleFiles(Array.from(input.files));
    input.value = ''; // allow re-selecting the same file
};

const allowedExtensionsList = computed(() => {
    if (!props.field.allowedExtensions) return [];
    return props.field.allowedExtensions
        .split(',')
        .map((ext) => ext.trim().toLowerCase())
        .filter((ext) => ext.length > 0);
});

const acceptTypes = computed(() => {
    if (allowedExtensionsList.value.length > 0) {
        return allowedExtensionsList.value.map((ext) => `.${ext}`).join(',');
    }
    return 'image/*,video/*';
});

const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (props.field.maxFileSize) {
        const limitMB = parseFloat(String(props.field.maxFileSize));
        if (!isNaN(limitMB) && limitMB > 0 && file.size > limitMB * 1024 * 1024) {
            return { valid: false, error: `File size exceeds ${limitMB} MB` };
        }
    }

    const extensions = allowedExtensionsList.value;
    if (extensions.length > 0) {
        const extMatch = file.name.split('.').pop();
        const ext = extMatch ? extMatch.toLowerCase() : '';
        if (!extensions.includes(ext)) {
            return { valid: false, error: `File type .${ext} is not allowed` };
        }
    }

    return { valid: true };
};

const startUpload = async (localId: string) => {
    const target = files.value.find((f) => f.id === localId);
    if (!target || target.status === 'error') return;
    if (uploadControllers.has(localId)) return;

    const controller = new AbortController();
    uploadControllers.set(localId, controller);
    target.status = 'pending';
    target.progress = Math.max(target.progress, 1);
    target.errorMessage = undefined;

    try {
        const uploadedUrl = await uploadPendingFile(fieldId, localId, {
            signal: controller.signal,
            onProgress: (percent) => {
                const file = files.value.find((f) => f.id === localId);
                if (!file || file.status === 'error') return;
                file.progress = Math.max(file.progress, percent);
            }
        });

        const file = files.value.find((f) => f.id === localId);
        if (!file) return;

        file.uploadedUrl = uploadedUrl;
        if (file.file?.type.startsWith('image/')) {
            file.previewUrl = uploadedUrl;
        }
        file.progress = 100;
        file.status = 'uploaded';
        file.errorMessage = undefined;
        updateModelValue();
    } catch (error: unknown) {
        const file = files.value.find((f) => f.id === localId);
        if (!file) return;

        if (error instanceof DOMException && error.name === 'AbortError') {
            return;
        }

        file.status = 'error';
        file.progress = 0;
        file.errorMessage = error instanceof Error ? error.message : 'Upload failed';
        updateModelValue();
    } finally {
        uploadControllers.delete(localId);
    }
};

const retryUpload = async (id: string) => {
    const file = files.value.find((f) => f.id === id);
    if (!file || !file.file) return;
    await startUpload(id);
};

const handleFiles = (newFiles: File[]) => {
    uploadWarnings.value = [];

    // Single-file field guard
    if (!props.field.multipleFiles && files.value.length > 0) {
        uploadWarnings.value.push('Only one file is allowed.');
        return;
    }

    // Duplicate detection (by name + size within local list)
    const duplicates = newFiles.filter((f) =>
        files.value.some((ex) => ex.file && ex.file.name === f.name && ex.file.size === f.size)
    );
    if (duplicates.length > 0) {
        uploadWarnings.value.push(`Already added: ${duplicates.map((f) => f.name).join(', ')}`);
    }

    const unique = newFiles.filter(
        (f) =>
            !files.value.some((ex) => ex.file && ex.file.name === f.name && ex.file.size === f.size)
    );
    if (unique.length === 0) return;

    // Max-files cap
    const maxFiles = parseInt(String(props.field.maxFiles || '0'), 10);
    let allowedCount = unique.length;
    if (maxFiles > 0) {
        const remaining = maxFiles - files.value.length;
        allowedCount = Math.min(unique.length, Math.max(0, remaining));
        if (unique.length > remaining) {
            uploadWarnings.value.push(`Max ${maxFiles} file(s) allowed. Some files were skipped.`);
        }
    }

    const toProcess = unique.slice(0, allowedCount);

    toProcess.forEach((file) => {
        const localId = crypto.randomUUID();
        const isImage = file.type.startsWith('image/');
        const validation = validateFile(file);

        const localFile: LocalFile = {
            id: localId,
            file,
            previewUrl: isImage ? URL.createObjectURL(file) : null,
            progress: 0,
            status: validation.valid ? 'pending' : 'error',
            errorMessage: validation.valid ? undefined : validation.error
        };

        files.value.push(localFile);

        // Register in the queue and upload immediately.
        // flushQueue() still acts as a final safety net before step save.
        if (validation.valid) {
            const pending: PendingFile = {
                localId,
                file,
                previewUrl: localFile.previewUrl
            };
            enqueuePending(fieldId, pending);
            void startUpload(localId);
        }
    });

    updateModelValue();
};

const removeFile = (id: string) => {
    const index = files.value.findIndex((f) => f.id === id);
    if (index === -1) return;

    const localFile = files.value[index];

    const controller = uploadControllers.get(localFile.id);
    if (controller) {
        controller.abort();
        uploadControllers.delete(localFile.id);
    }

    if (localFile.file && !localFile.uploadedUrl) {
        dequeuePending(fieldId, localFile.id);
    }

    files.value.splice(index, 1);
    updateModelValue();
};

/**
 * Emits the current logical value for vee-validate / the form store.
 */
const updateModelValue = () => {
    const values = files.value
        .filter((f) => f.status !== 'error')
        .map((f) => {
            if (f.status === 'uploaded' && f.uploadedUrl) return f.uploadedUrl;
            // Keep required validation satisfied while upload is in-flight.
            if (f.file) return `pending:${f.file.name}`;
            return null;
        })
        .filter((v): v is string => v !== null);

    if (values.length === 0) {
        emit('update:model-value', null);
    } else if (props.field.multipleFiles === false) {
        emit('update:model-value', values[0]);
    } else {
        emit('update:model-value', values);
    }
};
</script>

<template>
    <BaseField :field="field" :error="error">
        <div
            v-if="!isReadonly"
            class="fileupload-container"
            :class="{ 'is-dragging': isDragging }"
            @dragenter="onDragEnter"
            @dragover.prevent="onDragEnter"
            @dragleave="onDragLeave"
            @drop="onDrop"
            @click="triggerFileSelect"
        >
            <input
                type="file"
                ref="fileInput"
                class="file-input"
                :multiple="field.multipleFiles !== false"
                @change="onFileSelect"
                :accept="acceptTypes"
            />

            <div class="drop-content">
                <UploadCloud class="upload-icon" :size="32" />
                <p class="drop-text">Drag & drop files here or <span>browse</span></p>
                <p class="drop-hint">
                    {{ field.allowedExtensions ? `Allowed: ${field.allowedExtensions}. ` : '' }}
                    {{
                        field.maxFileSize
                            ? `Max size: ${field.maxFileSize} MB.`
                            : 'Max size: 10 MB.'
                    }}
                    {{ field.maxFiles ? `(Max files: ${field.maxFiles})` : '' }}
                </p>
            </div>
        </div>

        <!-- Warnings (duplicates, cap exceeded) -->
        <transition-group name="upload-list">
            <div
                v-for="(warning, idx) in uploadWarnings"
                :key="'warn-' + idx"
                class="gf-warning-message"
            >
                {{ warning }}
            </div>
        </transition-group>

        <!-- File list -->
        <div v-if="files.length > 0" class="file-list">
            <transition-group name="upload-list">
                <div
                    v-for="file in files"
                    :key="file.id"
                    class="file-item"
                    :class="{ 'file-item--error': file.status === 'error' }"
                >
                    <div class="preview-box">
                        <img v-if="file.previewUrl" :src="file.previewUrl" class="preview-img" />
                        <FileIcon v-else class="fallback-icon" :size="24" />
                    </div>

                    <div class="file-info">
                        <span
                            class="file-name"
                            :title="file.file ? file.file.name : file.uploadedUrl || 'File'"
                        >
                            {{ file.file ? file.file.name : file.uploadedUrl?.split('/').pop() }}
                        </span>

                        <div
                            v-if="file.status === 'pending' || file.status === 'uploaded'"
                            class="progress-bar-wrapper"
                        >
                            <div class="progress-bar-container">
                                <div
                                    class="progress-bar"
                                    :class="{ 'progress-bar--done': file.status === 'uploaded' }"
                                    :style="{ width: Math.max(file.progress, 3) + '%' }"
                                ></div>
                            </div>
                            <div
                                class="progress-label"
                                :class="file.status === 'uploaded' ? 'progress-label--done' : ''"
                            >
                                <template v-if="file.status === 'uploaded'">
                                    Uploaded{{
                                        file.file
                                            ? ` (${(file.file.size / 1024 / 1024).toFixed(1)} MB)`
                                            : ''
                                    }}
                                </template>
                                <template v-else> {{ Math.round(file.progress) }}% </template>
                            </div>
                        </div>

                        <div v-if="file.status === 'error'" class="upload-error">
                            {{ file.errorMessage || 'Upload failed' }}
                            <button
                                v-if="!isReadonly && file.file"
                                type="button"
                                class="retry-btn"
                                @click.stop="retryUpload(file.id)"
                            >
                                Retry
                            </button>
                        </div>
                    </div>

                    <button
                        v-if="!isReadonly"
                        type="button"
                        class="remove-btn"
                        @click.stop="removeFile(file.id)"
                        aria-label="Remove file"
                    >
                        <X :size="18" />
                    </button>
                </div>
            </transition-group>
        </div>
    </BaseField>
</template>

<style scoped>
/* Drag & Drop Area */
.fileupload-container {
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    background-color: #f8fafc;
    padding: 2.5rem 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}

.fileupload-container:hover {
    border-color: #94a3b8;
    background-color: #f1f5f9;
}

.fileupload-container.is-dragging {
    border-color: #3b82f6;
    background-color: #eff6ff;
}

.file-input {
    display: none;
}

.drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    pointer-events: none;
}

.upload-icon {
    color: #64748b;
    margin-bottom: 0.25rem;
    transition: transform 0.2s ease;
}

.fileupload-container:hover .upload-icon {
    transform: translateY(-2px);
    color: #3b82f6;
}

.fileupload-container.is-dragging .upload-icon {
    transform: scale(1.1);
    color: #3b82f6;
}

.drop-text {
    font-size: 1rem;
    margin: 0;
    font-weight: 400;
}

.drop-text span {
    color: #3b82f6;
    text-decoration: underline;
    font-weight: 500;
}

.drop-hint {
    font-size: 0.8rem;
    margin: 0;
    color: #94a3b8;
}

/* File List */
.file-list {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.file-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    transition: all 0.2s ease;
}

.file-item:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.file-item--error {
    border-color: #fca5a5;
    background: #fef2f2;
}

.preview-box {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    background: #f1f5f9;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid #e2e8f0;
}

.preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.fallback-icon {
    color: #94a3b8;
}

.file-info {
    flex-grow: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.file-name {
    font-size: 0.9rem;
    font-weight: 500;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.progress-bar-container {
    height: 4px;
    background: #e2e8f0;
    border-radius: 2px;
    overflow: hidden;
    width: 100%;
}

.progress-bar {
    height: 100%;
    background: #10b981;
    transition: width 0.1s linear;
}

/* Status badges */
.file-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 500;
}

.file-status--pending {
    color: #f59e0b;
}

.progress-bar-wrapper {
    width: 100%;
}

.progress-bar--done {
    background: #10b981;
    width: 100% !important;
}

.progress-label {
    margin-top: 10px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    color: #64748b;
    min-width: 32px;
}

.progress-label--done {
    color: #10b981;
}

.upload-error {
    margin-top: 6px;
    font-size: 0.75rem;
    color: #dc2626;
    display: flex;
    align-items: center;
    gap: 8px;
}

.retry-btn {
    border: none;
    background: transparent;
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
}

.retry-btn:hover {
    color: #1d4ed8;
}

.file-status--error {
    color: #ef4444;
}

.remove-btn {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.remove-btn:hover {
    background: #fee2e2;
    color: #ef4444;
}

.gf-error-message {
    color: #ef4444;
    font-size: 0.85rem;
    margin-top: 0.5rem;
}

.gf-warning-message {
    color: #d97706;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 4px;
}

.gf-field--error .fileupload-container {
    border-color: #ef4444;
    background-color: #fef2f2;
}

/* List Transitions */
.upload-list-enter-active,
.upload-list-leave-active {
    transition: all 0.3s ease;
}
.upload-list-enter-from {
    opacity: 0;
    transform: translateY(10px);
}
.upload-list-leave-to {
    opacity: 0;
    transform: translateX(20px);
}
</style>
