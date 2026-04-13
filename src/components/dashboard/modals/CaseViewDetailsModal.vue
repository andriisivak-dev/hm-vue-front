<script setup lang="ts">
/**
 * CaseViewDetailsModal
 *
 * Renders the Step 5 (media) fields of a case in read-only view inside an
 * AppModal.  It independently loads the form schema + case form-data so it
 * never touches the shared useCaseFormStore singleton (which belongs to the
 * multi-step form editor).
 *
 * Media files are grouped by their originating field label (e.g. "Before
 * Photos", "After Photos", "Video"), preserving the semantic context that
 * exists in the form definition.
 */
import { ref, computed } from 'vue';
import AppModal from '@/components/common/AppModal.vue';
import { casesService, formsService } from '@/api';
import type { GFField } from '@/form-engine/types.ts';

// ── Constants ─────────────────────────────────────────────────────────────
/** GF form ID that drives all case studies (GF form 4 — see AppForm.vue). */
const FORM_ID = 4;
/** Step number that contains the media upload fields. */
const MEDIA_STEP = 5;

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp']);
const VIDEO_EXTS = new Set(['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv']);

// ── Types ─────────────────────────────────────────────────────────────────

interface MediaFile {
    url: string;
    type: 'image' | 'video';
    name: string;
}

interface FieldGroup {
    label: string;
    files: MediaFile[];
}

// ── State ─────────────────────────────────────────────────────────────────

const baseModal = ref<InstanceType<typeof AppModal> | null>(null);
const caseTitle = ref('');
const loading = ref(false);
const errorMsg = ref('');
const fieldGroups = ref<FieldGroup[]>([]);
const lightboxItem = ref<MediaFile | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────

function getExt(url: string): string {
    try {
        return new URL(url).pathname.split('.').pop()?.toLowerCase() ?? '';
    } catch {
        return url.split('.').pop()?.toLowerCase() ?? '';
    }
}

function classifyUrl(url: string): 'image' | 'video' | null {
    const ext = getExt(url);
    if (IMAGE_EXTS.has(ext)) return 'image';
    if (VIDEO_EXTS.has(ext)) return 'video';
    return null;
}

function extractUrls(value: unknown): string[] {
    if (!value) return [];
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed))
                return parsed.filter((v): v is string => typeof v === 'string');
        } catch {
            /* plain string */
        }
        return value ? [value] : [];
    }
    if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
    return [];
}

function buildMediaFile(url: string): MediaFile | null {
    const type = classifyUrl(url);
    if (!type) return null;
    return { url, type, name: decodeURIComponent(url.split('/').pop() ?? url) };
}

// ── Public API ────────────────────────────────────────────────────────────

async function open(config: { caseId: number; caseTitle: string }) {
    caseTitle.value = config.caseTitle;
    errorMsg.value = '';
    fieldGroups.value = [];
    lightboxItem.value = null;
    loading.value = true;
    baseModal.value?.show();

    try {
        // Parallel: schema (cached 5 min) + form data
        const [schema, formData] = await Promise.all([
            formsService.getSchema(FORM_ID),
            casesService.getFormData(config.caseId)
        ]);

        // Locate step 5 from the schema (by step_number)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawSchema = schema as any;
        const steps: { step_number?: number; fields?: unknown[] }[] = rawSchema.steps ?? [];
        const mediaStep = steps.find((s) => (s.step_number ?? 0) === MEDIA_STEP);

        if (!mediaStep?.fields?.length) {
            errorMsg.value = `Step ${MEDIA_STEP} not found in this form's schema.`;
            return;
        }

        // Extract the flat field values
        // formData from API: { current_step, total_steps, progress, fields: { "fieldId": value } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData = formData as any;
        const flatValues: Record<string, unknown> = rawData.fields ?? rawData ?? {};

        // Build groups: only fileupload fields that have at least 1 media URL
        const groups: FieldGroup[] = [];

        for (const rawField of mediaStep.fields) {
            const field = rawField as GFField;
            if (field.type !== 'fileupload') continue;

            const fieldId = String(field.id);
            const rawValue = flatValues[fieldId];
            const urls = extractUrls(rawValue);

            const files: MediaFile[] = urls
                .map(buildMediaFile)
                .filter((f): f is MediaFile => f !== null);

            if (files.length > 0) {
                groups.push({ label: field.label || `Field ${fieldId}`, files });
            }
        }

        // If no labeled groups found (e.g. schema mismatch), fall back to
        // scanning ALL fields in the form data for stray media URLs.
        if (groups.length === 0) {
            const fallbackFiles: MediaFile[] = [];
            const seen = new Set<string>();
            for (const value of Object.values(flatValues)) {
                for (const url of extractUrls(value)) {
                    if (seen.has(url)) continue;
                    const mf = buildMediaFile(url);
                    if (mf) {
                        fallbackFiles.push(mf);
                        seen.add(url);
                    }
                }
            }
            if (fallbackFiles.length > 0) {
                groups.push({ label: 'Media Files', files: fallbackFiles });
            }
        }

        fieldGroups.value = groups;
    } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to load case media.';
    } finally {
        loading.value = false;
    }
}

defineExpose({ open });

// ── Computed ──────────────────────────────────────────────────────────────

const hasMedia = computed(() => fieldGroups.value.some((g) => g.files.length > 0));

// ── Lightbox ──────────────────────────────────────────────────────────────

function openLightbox(item: MediaFile) {
    lightboxItem.value = item;
}

function closeLightbox() {
    lightboxItem.value = null;
}

function onHidden() {
    fieldGroups.value = [];
    errorMsg.value = '';
    lightboxItem.value = null;
}
</script>

<template>
    <AppModal
        id="caseViewDetailsModal"
        :title="`Case '${caseTitle}'`"
        @hidden="onHidden"
        ref="baseModal"
    >
        <!-- ── Loading ─────────────────────────────────────────── -->
        <div v-if="loading" class="vd-loading">
            <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span class="visually-hidden">Loading…</span>
            </div>
            <span>Loading media…</span>
        </div>

        <!-- ── Error ──────────────────────────────────────────── -->
        <div v-else-if="errorMsg" class="alert alert-danger" role="alert">
            {{ errorMsg }}
        </div>

        <!-- ── Empty ──────────────────────────────────────────── -->
        <div v-else-if="!hasMedia" class="vd-empty">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
            <p>No photos or videos have been uploaded for this case.</p>
        </div>

        <!-- ── Field Groups ───────────────────────────────────── -->
        <template v-else>
            <section v-for="group in fieldGroups" :key="group.label" class="vd-section">
                <!-- Section header -->
                <h5 class="vd-section-title">{{ group.label }}</h5>

                <!-- Images grid -->
                <div v-if="group.files.some((f) => f.type === 'image')" class="vd-grid">
                    <button
                        v-for="file in group.files.filter((f) => f.type === 'image')"
                        :key="file.url"
                        type="button"
                        class="vd-thumb"
                        :title="file.name"
                        @click="openLightbox(file)"
                    >
                        <img :src="file.url" :alt="file.name" loading="lazy" />
                        <span class="vd-thumb-overlay">
                            <!-- zoom icon -->
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="11" y1="8" x2="11" y2="14" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </span>
                    </button>
                </div>

                <!-- Video list -->
                <div v-if="group.files.some((f) => f.type === 'video')" class="vd-video-list">
                    <div
                        v-for="file in group.files.filter((f) => f.type === 'video')"
                        :key="file.url"
                        class="vd-video-item"
                    >
                        <video :src="file.url" controls preload="metadata" class="vd-video-player">
                            Your browser does not support video playback.
                        </video>
                        <p class="vd-video-name">{{ file.name }}</p>
                    </div>
                </div>
            </section>
        </template>

        <!-- ── Lightbox ──────────────────────────────────────── -->
        <Teleport to="body">
            <transition name="lightbox-fade">
                <div v-if="lightboxItem" class="vd-lightbox" @click.self="closeLightbox">
                    <button
                        class="vd-lightbox-close"
                        type="button"
                        @click="closeLightbox"
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                    <p class="vd-lightbox-name">{{ lightboxItem.name }}</p>
                    <img :src="lightboxItem.url" :alt="lightboxItem.name" class="vd-lightbox-img" />
                </div>
            </transition>
        </Teleport>
    </AppModal>
</template>

<style scoped>
/* ── Loading / Empty ─────────────────────────────────────────────────────── */
.vd-loading {
    display: flex;
    align-items: center;
    padding: 2.5rem 1rem;
    color: #6c757d;
    font-size: 0.95rem;
}

.vd-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
    padding: 3rem 1rem;
    color: #adb5bd;
    text-align: center;
}

.vd-empty p {
    margin: 0;
    font-size: 0.95rem;
}

/* ── Section ─────────────────────────────────────────────────────────────── */
.vd-section {
    margin-bottom: 1.75rem;
}

.vd-section:last-child {
    margin-bottom: 0;
}

.vd-section-title {
    font-size: 0.82rem;
    font-weight: 700;
    color: #262469;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin: 0 0 0.65rem;
    padding-bottom: 0.4rem;
    border-bottom: 2px solid #ede9fe;
}

/* ── Photo Grid ──────────────────────────────────────────────────────────── */
.vd-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
    margin-bottom: 0.75rem;
}

.vd-thumb {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    border: none;
    padding: 0;
    cursor: pointer;
    background: #f3f4f6;
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease;
}

.vd-thumb:hover {
    transform: scale(1.04);
    box-shadow: 0 6px 20px rgba(38, 36, 105, 0.2);
}

.vd-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: filter 0.18s ease;
}

.vd-thumb:hover img {
    filter: brightness(0.7);
}

.vd-thumb-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    opacity: 0;
    transition: opacity 0.18s ease;
}

.vd-thumb:hover .vd-thumb-overlay {
    opacity: 1;
}

/* ── Video List ──────────────────────────────────────────────────────────── */
.vd-video-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.vd-video-item {
    background: #f8f9fa;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #dee2e6;
}

.vd-video-player {
    width: 100%;
    max-height: 300px;
    display: block;
    background: #000;
}

.vd-video-name {
    font-size: 0.78rem;
    color: #6c757d;
    margin: 0;
    padding: 5px 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ── Lightbox ────────────────────────────────────────────────────────────── */
.vd-lightbox {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(0, 0, 0, 0.93);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.5rem 1.5rem;
    gap: 0.75rem;
}

.vd-lightbox-img {
    max-width: 100%;
    max-height: 80vh;
    border-radius: 6px;
    object-fit: contain;
    box-shadow: 0 8px 48px rgba(0, 0, 0, 0.6);
    user-select: none;
}

.vd-lightbox-name {
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.8rem;
    margin: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    order: 1;
}

.vd-lightbox-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #fff;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease;
}

.vd-lightbox-close:hover {
    background: rgba(255, 255, 255, 0.22);
}

/* ── Lightbox transition ─────────────────────────────────────────────────── */
.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
    transition: opacity 0.2s ease;
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
    opacity: 0;
}

@media (min-width: 767px) {
    .vd-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }

    .vd-video-list {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>
