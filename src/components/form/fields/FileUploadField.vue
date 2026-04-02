<script setup lang="ts">
import { ref, computed } from 'vue';
import type { GFField } from '@/form-engine/types.ts';
import { X, UploadCloud, File as FileIcon } from 'lucide-vue-next';

interface LocalFile {
    id: string;
    file: File;
    previewUrl: string | null;
    progress: number;
    hasError: boolean;
    errorMessage?: string;
    isUploaded: boolean;
}

const props = defineProps<{
    field: GFField;
    modelValue?: File[];
    error?: string;
}>();

const emit = defineEmits<{
    (e: 'update:model-value', value: File[] | null): void;
}>();

const files = ref<LocalFile[]>([]);
const uploadWarnings = ref<string[]>([]);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileSelect = () => {
    fileInput.value?.click();
};

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
    if (e.dataTransfer?.files) {
        handleFiles(Array.from(e.dataTransfer.files));
    }
};

const onFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files) {
        handleFiles(Array.from(input.files));
    }
    input.value = ''; // Reset input to allow selecting same file again
};

const allowedExtensionsList = computed(() => {
    if (!props.field.allowedExtensions) return [];
    return props.field.allowedExtensions
        .split(',')
        .map((ext) => ext.trim().toLowerCase())
        .filter((ext) => ext.length > 0);
});

const isFileAllowed = (file: File): { valid: boolean; error?: string } => {
    // 1. Max File Size Validation
    if (props.field.maxFileSize) {
        // limit is provided in MB
        const limitMB = parseFloat(String(props.field.maxFileSize));
        if (!isNaN(limitMB) && limitMB > 0) {
            const limitBytes = limitMB * 1024 * 1024;
            if (file.size > limitBytes) {
                return { valid: false, error: `File size exceeds ${limitMB} MB` };
            }
        }
    }

    // 2. Extensions Validation
    const extensions = allowedExtensionsList.value;
    if (extensions.length > 0) {
        // get extension
        const extMatch = file.name.split('.').pop();
        const ext = extMatch ? extMatch.toLowerCase() : '';
        if (!extensions.includes(ext)) {
            return { valid: false, error: `File type .${ext} is not allowed` };
        }
    }

    return { valid: true };
};

const acceptTypes = computed(() => {
    if (allowedExtensionsList.value.length > 0) {
        return allowedExtensionsList.value.map((ext) => `.${ext}`).join(',');
    }
    return 'image/*,video/*';
});

const handleFiles = (newFiles: File[]) => {
    uploadWarnings.value = [];

    // If not multiple, limit to 1
    if (!props.field.multipleFiles && files.value.length > 0) {
        uploadWarnings.value.push('Only one file is allowed.');
        return;
    }

    // Identify duplicates
    const duplicateFiles = newFiles.filter((newFile) => {
        return files.value.some(
            (existing) => existing.file.name === newFile.name && existing.file.size === newFile.size
        );
    });

    if (duplicateFiles.length > 0) {
        uploadWarnings.value.push(
            `File(s) already added: ${duplicateFiles.map((f) => f.name).join(', ')}`
        );
    }

    // Filter out duplicates (same name and size)
    const uniqueFiles = newFiles.filter((newFile) => {
        return !files.value.some(
            (existing) => existing.file.name === newFile.name && existing.file.size === newFile.size
        );
    });

    if (uniqueFiles.length === 0) return;

    // Check max files limit
    const maxFiles = parseInt(String(props.field.maxFiles || '0'), 10);
    let allowedCount = uniqueFiles.length;
    if (maxFiles > 0) {
        const remaining = maxFiles - files.value.length;
        allowedCount = Math.min(uniqueFiles.length, Math.max(0, remaining));
        if (uniqueFiles.length > remaining) {
            uploadWarnings.value.push(
                `You can only upload up to ${maxFiles} files. Some files were skipped.`
            );
        }
    }

    const filesToProcess = uniqueFiles.slice(0, allowedCount);

    const newLocalFiles = filesToProcess.map((file) => {
        const id = Math.random().toString(36).substring(7);
        const isImage = file.type.startsWith('image/');

        let hasError = false;
        let errorMsg = '';
        const validation = isFileAllowed(file);

        if (!validation.valid) {
            hasError = true;
            errorMsg = validation.error || '';
        }

        return {
            id,
            file,
            previewUrl: isImage ? URL.createObjectURL(file) : null,
            progress: 0,
            hasError,
            errorMessage: errorMsg,
            isUploaded: false
        };
    });

    files.value.push(...newLocalFiles);

    // Simulate upload progress
    newLocalFiles.forEach((localFile) => {
        if (!localFile.hasError) {
            simulateUpload(localFile.id);
        }
    });
};

const simulateUpload = (id: string) => {
    let progress = 0;
    const interval = setInterval(() => {
        const fileRef = files.value.find((f) => f.id === id);
        if (!fileRef) {
            clearInterval(interval);
            return;
        }

        progress += Math.random() * 20;
        if (progress >= 100) {
            fileRef.progress = 100;
            fileRef.isUploaded = true;
            clearInterval(interval);
            updateModelValue();
        } else {
            fileRef.progress = progress;
        }
    }, 200);
};

const removeFile = (id: string) => {
    const index = files.value.findIndex((f) => f.id === id);
    if (index !== -1) {
        const localFile = files.value[index];
        if (localFile.previewUrl) {
            URL.revokeObjectURL(localFile.previewUrl);
        }
        files.value.splice(index, 1);
        updateModelValue();
    }
};

const updateModelValue = () => {
    // Collect valid uploaded files to emit.
    // In actual implementation, we might emit IDs or URLs returned from the API.
    const validFiles = files.value.filter((f) => f.isUploaded && !f.hasError).map((f) => f.file);
    emit('update:model-value', validFiles.length > 0 ? validFiles : null);
};
</script>

<template>
    <div class="gf-field" :class="{ 'gf-field--error': error }">
        <label class="gf-label">
            {{ field.label }}
            <span v-if="field.is_required" class="gf-required">*</span>
        </label>

        <div
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
                    {{
                        field.allowedExtensions
                            ? `Allowed file extensions: ${field.allowedExtensions}. `
                            : ''
                    }}
                    {{
                        field.maxFileSize
                            ? `Max file size: ${field.maxFileSize}MB.`
                            : 'Max file size: 10MB.'
                    }}
                    {{ field.maxFiles ? `(Max files: ${field.maxFiles})` : '' }}
                </p>
            </div>
        </div>

        <transition-group name="upload-list">
            <div
                v-for="(warning, idx) in uploadWarnings"
                :key="'warn-' + idx"
                class="gf-warning-message"
            >
                {{ warning }}
            </div>
        </transition-group>

        <div v-if="files.length > 0" class="file-list">
            <transition-group name="upload-list">
                <div v-for="file in files" :key="file.id" class="file-item">
                    <div class="preview-box">
                        <img v-if="file.previewUrl" :src="file.previewUrl" class="preview-img" />
                        <FileIcon v-else class="fallback-icon" :size="24" />
                    </div>

                    <div class="file-info">
                        <span class="file-name" :title="file.file.name">{{ file.file.name }}</span>

                        <div
                            v-if="!file.isUploaded && !file.hasError"
                            class="progress-bar-container"
                        >
                            <div class="progress-bar" :style="{ width: file.progress + '%' }"></div>
                        </div>

                        <span v-else-if="file.hasError" class="file-error"
                            >Error: {{ file.errorMessage || 'Upload failed' }}</span
                        >
                        <span v-else class="file-success"
                            >Uploaded ({{ (file.file.size / 1024 / 1024).toFixed(1) }} MB)</span
                        >
                    </div>

                    <button
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

        <p v-if="error" class="gf-error-message">{{ error }}</p>
    </div>
</template>

<style scoped>
.gf-field {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
}

.gf-label {
    font-size: 0.95rem;
    font-weight: 500;
    color: rgb(17, 35, 55);
    margin-bottom: 8px;
    display: inline-block;
}

.gf-required {
    color: #ef4444;
    margin-left: 2px;
}

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

.file-success {
    font-size: 0.75rem;
    color: #10b981;
    font-weight: 500;
}

.file-error {
    font-size: 0.75rem;
    color: #ef4444;
    font-weight: 500;
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
