<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue';
import { useForm } from 'vee-validate';
import { useRouter } from 'vue-router';
import { useCaseFormStore } from '@/form-engine/useFormStore.ts';
import { useUserStore } from '@/stores/user';
import { useFileUploadQueueStore } from '@/stores/fileUploadQueue';
import { formsService, casesService, ApiError } from '@/api';
import '../../assets/form-design.css';
import FieldSkeleton from './FieldSkeleton.vue';
import FieldDispatcher from './FieldDispatcher.vue';
import FormStepper from './FormStepper.vue';
import { ChevronRight, ChevronLeft, Check, AlertCircle, Loader2 } from 'lucide-vue-next';
import type { GFField, GFForm } from '@/form-engine/types.ts';

// -- Types & Interfaces -------------------------------------------------------

interface RawField {
    is_required?: boolean;
    is_hidden?: boolean;
    conditional_logic?: unknown; // use unknown rather then any
    css_class?: string;
    [key: string]: unknown; // accept safe spread (...f)
}

interface RawStep {
    step_number?: number;
    label?: string;
    fields?: RawField[];
}

interface RawSchema {
    form_id?: number;
    id?: number;
    form_title?: string;
    title?: string;
    steps?: RawStep[];
}

const props = defineProps<{
    /** GF form ID (schema to load) */
    formId: number;
    /**
     * Optional WP case post ID.
     * • undefined -> new case (will be created on mount)
     * • number    -> existing case (form pre-filled from hm_form_data)
     */
    caseId?: number;
    /**
     * If true, the form is completely read-only and no save/submit occurs.
     */
    isViewMode?: boolean;
    /**
     * If true, the form is in supervisor/admin edit mode:
     * - All steps unlocked for free navigation
     * - No per-step auto-validation on Next
     * - Footer shows "Save Changes" and "Save & Approve"
     */
    isEditMode?: boolean;
}>();

// ── Emits ────────────────────────────────────────────────────────────────────

/**
 * Fired after a new case is created so the parent can update the URL
 * without navigating away: emit('case-created', newCaseId)
 */
const emit = defineEmits<{
    (e: 'case-created', caseId: number): void;
    (e: 'case-submitted', caseId: number): void;
}>();

// ── Store & form ──────────────────────────────────────────────────────────────

const store = useCaseFormStore();
const userStore = useUserStore();
const router = useRouter();
const { handleSubmit, validate, setValues } = useForm();
const { flushQueue, clearAll } = useFileUploadQueueStore();

// ── Local state ───────────────────────────────────────────────────────────────

const isPageLoading = ref(true);
const loadError = ref<string | null>(null);
const showDraftSaved = ref(false);
const caseStatus = ref<string>(''); // status of the loaded case
const isSaveApproving = ref(false); // spinner for Save & Approve
const isApproveSuccessful = ref(false); // show approve success screen
let autosaveInterval: ReturnType<typeof setInterval> | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatApiError(err: unknown): string {
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error) return err.message;
    return 'An unexpected error occurred.';
}

async function scrollToFirstError(errors: Partial<Record<string, string | undefined>>) {
    await nextTick();
    const errorIds = Object.keys(errors).map((id) => `field_wrapper_${id}`);

    let firstElement: HTMLElement | null = null;
    let minTop = Infinity;

    errorIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top < minTop) {
                minTop = rect.top;
                firstElement = el;
            }
        }
    });

    if (firstElement) {
        const y = (firstElement as HTMLElement).getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
}

// ── Mount logic ───────────────────────────────────────────────────────────────

onMounted(async () => {
    isPageLoading.value = true;
    loadError.value = null;

    try {
        const rawSchema = (await formsService.getSchema(props.formId)) as RawSchema;
        const gfForm: GFForm = {
            form_id: rawSchema.form_id ?? rawSchema.id ?? 0,
            form_title: rawSchema.form_title ?? rawSchema.title ?? '',
            total_steps: rawSchema.steps?.length ?? 0,
            non_data_field_types: [],
            steps: (rawSchema.steps ?? []).map((step, idx) => ({
                step_number: step.step_number ?? idx + 1,
                label: step.label ?? '',
                fields: (step.fields ?? []).map(
                    (f) =>
                        ({
                            ...f,
                            is_required: f.is_required ?? false,
                            is_hidden: f.is_hidden ?? false,
                            visibility: f.is_hidden ? 'hidden' : 'visible',
                            conditionalLogic: f.conditional_logic ?? null,
                            css_class: f.css_class ?? ''
                        }) as unknown as GFField
                )
            }))
        };

        store.initialize(gfForm);
        if (props.isViewMode) {
            store.setViewMode(true);
        }

        // 2a. Existing case — load hm_form_data and hydrate
        if (props.caseId) {
            store.setCaseId(props.caseId);

            // ── Load case data ─────────────────────────────────────────────
            const caseData = await casesService.get(props.caseId);
            store.authorId = caseData.author?.id ?? null;
            caseStatus.value = caseData.status;

            if (caseData.form_data && Object.keys(caseData.form_data).length > 0) {
                store.hydrateFromFormData(caseData.form_data);
            }

            setValues(store.values);

            // Restore the step the user last reached:
            // current_step stores the last completed step, so resume at current_step + 1.
            if (caseData.current_step > 0) {
                // Unlock all steps up to and including the resume point
                store.setHighestReachedStep(caseData.current_step + 1);
                store.setStep(caseData.current_step + 1);
            }

            // If already submitted, mark accordingly
            if (caseData.status !== 'draft' && caseData.status !== 'returned') {
                store.isSubmitted = true;
            }

            // In view mode, do not show the success message because they are just viewing, not submitting right now.
            if (store.isViewMode) {
                store.isSubmitted = false;
            }

            // ── Edit mode setup ────────────────────────────────────────────
            if (props.isEditMode) {
                store.isSubmitted = false;
                // Unlock ALL steps so supervisor can navigate freely
                store.setHighestReachedStep(store.totalPages);

                // Access guard: redirect to view if status doesn't allow editing
                const isAdmin = ['administrator', 'hm_administrator'].includes(
                    userStore.user?.role ?? ''
                );
                const allowedStatuses = isAdmin
                    ? ['returned', 'in_review', 'approved']
                    : ['returned', 'in_review'];

                if (!allowedStatuses.includes(caseData.status)) {
                    router.replace({
                        path: '/case-study',
                        query: { cid: String(props.caseId), mode: 'view' }
                    });
                    return;
                }
            }
        } else {
            // 2b. New case — create draft immediately so we always have a caseId
            const created = await casesService.create({
                form_id: props.formId,
                total_steps: gfForm.total_steps
            });
            store.setCaseId(created.id);
            emit('case-created', created.id);
        }
    } catch (err) {
        console.error('[FormRenderer] Load error:', err);
        loadError.value = formatApiError(err);
    } finally {
        // Small delay for premium skeleton feel
        setTimeout(() => {
            isPageLoading.value = false;
        }, 600);

        // Setup autosave
        resetAutosaveTimer();
    }
});

// ── Cleanup ────────────────────────────────────────────────────────────────────

// Revoke any remaining pending file blob URLs if the user navigates away
onBeforeUnmount(() => {
    clearAll();
    if (autosaveInterval) clearInterval(autosaveInterval);
});

// ── Navigation actions ────────────────────────────────────────────────────────

/** Save current step data to the API, then advance to next step. */
const nextStep = async () => {
    if (props.isEditMode) {
        // Edit mode: free navigation, no validation, no per-step save
        store.nextStep();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (!store.isViewMode) {
        // Client-side validation first
        const result = await validate();
        if (!result.valid) {
            await scrollToFirstError(result.errors);
            return;
        }

        // Persist data + completed step number to API
        const saved = await saveFormData(store.currentStep);
        if (!saved) return;
    }

    store.nextStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const prevStep = () => {
    store.prevStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const resetAutosaveTimer = () => {
    if (autosaveInterval) {
        clearInterval(autosaveInterval);
        autosaveInterval = null;
    }
    // Autosave is only for regular (author) mode.
    // In edit mode supervisors save explicitly; in view mode nothing is saved.
    if (!store.isViewMode && !props.isEditMode) {
        autosaveInterval = setInterval(() => {
            if (!store.isSaving && !store.isSubmitted && store.caseId) {
                saveDraft();
            }
        }, 30000);
    }
};

const saveDraft = async () => {
    // Only attempt save if not viewing, not submitting, and form is loaded
    if (store.isViewMode || store.isSaving || store.isSubmitted || !store.caseId) return;

    resetAutosaveTimer();

    // Bypass strict global validation (which highlights required fields on empty inputs).
    // Just save whatever valid/invalid state currently exists.
    const saved = await saveFormData(Math.max(0, store.currentStep - 1));

    if (saved) {
        showDraftSaved.value = true;
        setTimeout(() => {
            showDraftSaved.value = false;
        }, 2000);
    }
};

// ── Edit mode save actions ────────────────────────────────────────────────

/**
 * Edit mode: save current form data without changing the case status.
 */
const saveEdited = async () => {
    if (store.isSaving || isSaveApproving.value || !store.caseId) return;

    const saved = await saveFormData(store.currentStep);
    if (saved) {
        showDraftSaved.value = true;
        setTimeout(() => (showDraftSaved.value = false), 2500);
    }
};

/**
 * Edit mode: validate ALL steps by stepping through them, then save + approve.
 * If any step has errors, jumps to the first failing step and stops.
 */
const saveAndApprove = async () => {
    if (store.isSaving || isSaveApproving.value || !store.caseId) return;

    store.saveError = null;
    const originalStep = store.currentStep;
    const failingSteps: number[] = [];
    let firstErrors: Record<string, string> = {};

    // Traverse all steps to validate each one
    for (let step = 1; step <= store.totalPages; step++) {
        store.setStep(step);
        await nextTick(); // let Vue render this step's fields
        const result = await validate();
        if (!result.valid) {
            failingSteps.push(step);
            if (failingSteps.length === 1) {
                firstErrors = result.errors as Record<string, string>;
            }
        }
    }

    if (failingSteps.length > 0) {
        // Jump to the first step with errors and highlight them
        store.setStep(failingSteps[0]);
        await nextTick();
        await scrollToFirstError(firstErrors);
        store.saveError = `Please fix the errors on step(s): ${failingSteps.join(', ')} before approving.`;
        return;
    }

    // All steps valid — restore original position, save, approve
    store.setStep(originalStep);

    const saved = await saveFormData(store.currentStep);
    if (!saved) return;

    isSaveApproving.value = true;
    store.saveError = null;
    try {
        await casesService.approve(store.caseId!);
        caseStatus.value = 'approved';
        // Kill autosave immediately — approved case returns 403 on form-data writes
        if (autosaveInterval) {
            clearInterval(autosaveInterval);
            autosaveInterval = null;
        }
        isApproveSuccessful.value = true;
    } catch (err) {
        store.saveError = formatApiError(err);
    } finally {
        isSaveApproving.value = false;
    }
};

// ── Save helpers ─────────────────────────────────────────────────────────────

/**
 * Persist current form data (and optionally the completed step) to the backend.
 * @param completedStep - the step number that was just completed; omit to save without step progression
 */
async function saveFormData(completedStep?: number): Promise<boolean> {
    if (!store.caseId) {
        store.saveError = 'Case ID is missing. Please reload the page.';
        return false;
    }

    store.isSaving = true;
    store.saveError = null;

    try {
        // flush pending file uploads so their URLs land in store.values
        await flushQueue();

        // persist form data (now includes uploaded file URLs)
        await casesService.updateFormData(store.caseId, {
            fields: store.formDataSnapshot,
            current_step: completedStep ?? store.currentStep
        });
        return true;
    } catch (err) {
        store.saveError = formatApiError(err);
        return false;
    } finally {
        store.isSaving = false;
    }
}

// ── Final submit ──────────────────────────────────────────────────────────────

const onFinalSubmit = handleSubmit(
    async () => {
        if (!store.caseId) {
            store.saveError = 'Case ID is missing. Please reload the page.';
            return;
        }

        // 1. Save latest form data
        const saved = await saveFormData();
        if (!saved) return;

        // 2. Transition status -> in_review
        store.isSaving = true;
        store.saveError = null;

        try {
            await casesService.submit(store.caseId);
            store.isSubmitted = true;
            emit('case-submitted', store.caseId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            store.saveError = formatApiError(err);
        } finally {
            store.isSaving = false;
        }
    },
    async ({ errors }) => {
        await scrollToFirstError(errors);
    }
);
</script>

<template>
    <!-- ── Loading skeleton ──────────────────────────────────────────────────── -->
    <div v-if="isPageLoading" class="form-renderer-container glass-panel">
        <div class="form-body">
            <div
                class="skeleton-header skeleton"
                style="width: 50%; height: 32px; margin-bottom: 2rem"
            ></div>
            <FieldSkeleton v-for="i in 7" :key="i" />
        </div>
    </div>

    <!-- ── Load error ────────────────────────────────────────────────────────── -->
    <div v-else-if="loadError" class="form-renderer-container glass-panel">
        <div class="form-body error-state">
            <AlertCircle :size="48" class="error-icon" />
            <h3>Failed to load the form</h3>
            <p>{{ loadError }}</p>
            <button
                class="btn-primary"
                @click="
                    () => {
                        loadError = null;
                        isPageLoading = true;
                        $forceUpdate();
                    }
                "
            >
                Retry
            </button>
        </div>
    </div>

    <!-- ── Submitted success ──────────────────────────────────────────────────── -->
    <div v-else-if="store.isSubmitted" class="form-renderer-container glass-panel">
        <div class="form-body success-state">
            <div class="success-icon-wrap">
                <Check :size="40" />
            </div>
            <h3>Case Study Submitted!</h3>
            <p v-if="['administrator', 'hm_manager'].includes(userStore.user?.role || '')">
                Your case study has been published in the Case Library.
                <router-link to="/"> Go to Dashboard </router-link>
            </p>
            <p v-else>
                Your case study has been submitted for review. Your supervisor will be notified
                shortly.
                <router-link to="/"> Go to Dashboard </router-link>
            </p>
            <p class="case-id-note">
                Case ID: <strong>#{{ store.caseId }}</strong>
            </p>
            <div>
                <router-link
                    :to="`/case-study/?cid=${store.caseId}&mode=view`"
                    class="btn-primary"
                    style="text-decoration: none; display: inline-flex; justify-content: center"
                >
                    View Case
                </router-link>
            </div>
        </div>
    </div>

    <!-- ── Edit mode: Approve success ───────────────────────────────────────── -->
    <div v-else-if="isApproveSuccessful" class="form-renderer-container glass-panel">
        <div class="form-body success-state">
            <div class="success-icon-wrap">
                <Check :size="40" />
            </div>
            <h3>Case Study Approved!</h3>
            <p>
                Case <strong>#{{ store.caseId }}</strong> has been approved and added to the Case
                Library.
            </p>
            <div class="d-flex gap-3 justify-content-center" style="margin-top: 1rem">
                <router-link
                    :to="`/case-study/?cid=${store.caseId}&mode=view`"
                    class="btn-primary"
                    style="text-decoration: none; display: inline-flex; justify-content: center"
                >
                    View Case
                </router-link>
                <router-link
                    to="/"
                    class="btn-secondary"
                    style="
                        text-decoration: none;
                        display: inline-flex;
                        justify-content: center;
                        padding: 8px 14px;
                    "
                >
                    Go to Dashboard
                </router-link>
            </div>
        </div>
    </div>

    <!-- ── Form ──────────────────────────────────────────────────────────────── -->
    <div v-else-if="store.form" class="form-renderer-container glass-panel">
        <FormStepper :is-view-mode="store.isViewMode" />

        <!-- Save error banner -->
        <transition name="fade-slide">
            <div v-if="store.saveError" class="save-error-banner">
                <AlertCircle :size="16" />
                <span>{{ store.saveError }}</span>
                <button class="dismiss-btn" @click="store.clearSaveError()">✕</button>
            </div>
        </transition>

        <form @submit.prevent class="form-body">
            <transition name="fade-slide" mode="out-in">
                <div :key="store.currentStep" class="form-step-content">
                    <FieldDispatcher
                        v-for="field in store.currentStepFields"
                        :key="field.id"
                        :field="field"
                    />
                </div>
            </transition>

            <div class="form-footer">
                <!-- Previous (both modes) -->
                <button
                    v-if="store.currentStep > 1"
                    type="button"
                    class="btn-secondary"
                    :disabled="store.isSaving || isSaveApproving"
                    @click="prevStep"
                >
                    <ChevronLeft :size="18" />
                    Previous
                </button>

                <div class="save-btn-wrap">
                    <!-- Edit mode: Save Changes -->
                    <button
                        v-if="props.isEditMode"
                        type="button"
                        class="add-new-user-btn btn"
                        :disabled="store.isSaving || isSaveApproving"
                        @click="saveEdited"
                    >
                        Save Changes
                    </button>

                    <!-- Regular mode: Save draft -->
                    <button
                        v-else-if="!store.isViewMode"
                        type="button"
                        class="add-new-user-btn btn"
                        :disabled="store.isSaving"
                        @click="saveDraft"
                    >
                        Save
                    </button>

                    <!-- Saving indicator (both modes) -->
                    <transition name="fade">
                        <span v-if="store.isSaving || isSaveApproving" class="saving-indicator">
                            <Loader2 :size="16" class="spin" />
                            Saving…
                        </span>
                        <span v-else-if="showDraftSaved" class="saving-indicator text-success">
                            <Check :size="16" />
                            Saved
                        </span>
                    </transition>
                </div>

                <!-- Next Step (both modes — edit uses free navigation) -->
                <button
                    v-if="store.currentStep < store.totalPages"
                    type="button"
                    class="btn-primary"
                    :disabled="store.isSaving || isSaveApproving"
                    @click="nextStep"
                >
                    Next Step
                    <ChevronRight :size="18" />
                </button>

                <!-- Edit mode: Save & Approve (last step, only for in_review / returned) -->
                <button
                    v-else-if="props.isEditMode && ['in_review', 'returned'].includes(caseStatus)"
                    type="button"
                    class="btn-primary btn-submit"
                    :disabled="store.isSaving || isSaveApproving"
                    @click="saveAndApprove"
                >
                    <Loader2 v-if="isSaveApproving" :size="18" class="spin" />
                    Save &amp; Approve
                </button>

                <!-- Edit mode last step for 'approved': only Save Changes is available -->

                <!-- Regular mode: Submit -->
                <button
                    v-else-if="!store.isViewMode && !props.isEditMode"
                    type="button"
                    class="btn-primary"
                    :disabled="store.isSaving"
                    @click="onFinalSubmit"
                >
                    <Loader2 v-if="store.isSaving" :size="18" class="spin" />
                    Submit Case Study
                </button>
            </div>
        </form>
    </div>
</template>

<style scoped>
.form-renderer-container {
    max-width: 810px;
    margin: 1rem 0;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
    border: 1px solid transparent;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    border-radius: 5px;
    padding: 0;
}

.form-body {
    padding: 12px 12px 22px;
    min-height: 400px;
}

/* ── Error & Success states ─────────────────────────────────────────────── */
.error-state,
.success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.5rem;
    min-height: 360px;
}

.error-state p,
.success-state p {
    margin: 0;
}

.form-step-content {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 10px;
    align-items: start;
}

.form-step-content .gf-field-container:first-child {
    position: relative;
    z-index: 100;
}

.error-icon {
    color: #ef4444;
}

.error-state h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
}

.error-state p {
    color: #64748b;
    max-width: 400px;
}

.success-icon-wrap {
    padding: 8px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
    animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pop-in {
    from {
        transform: scale(0);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.success-state h3 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #262469;
}

.success-state p {
    color: #262469;
    max-width: 400px;
    line-height: 1.6;
}

.case-id-note {
    font-size: 0.9rem;
    color: #262469;
}

.case-id-note strong {
    color: #262469;
}

/* ── Save error banner ──────────────────────────────────────────────────── */
.save-error-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #fef2f2;
    border-bottom: 1px solid #fecaca;
    color: #dc2626;
    font-size: 0.875rem;
}

.dismiss-btn {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    color: #dc2626;
    font-size: 1rem;
    line-height: 1;
    padding: 0 4px;
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
.form-footer {
    margin-top: 24px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: space-between;
}

.footer-spacer {
    flex-grow: 1;
}

.saving-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: #94a3b8;
}

/* ── Buttons ────────────────────────────────────────────────────────────── */
.btn-primary,
.btn-secondary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-weight: 300;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    color: #fff;
    border-radius: 5px;
    font-size: 16px;
    min-height: 40px;
}

.btn-primary:disabled,
.btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
}

.btn-primary {
    background-color: #262469;
    padding: 6px 8px 6px 12px;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px var(--accent-bg);
}

.btn-secondary {
    background-color: #efefef;
    color: #262469;
    border-radius: 5px;
    border: 1px solid #262469;
    padding: 6px 12px 6px 8px;
}

.btn-submit {
    background: #10b981;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.btn-submit:hover:not(:disabled) {
    background: #059669;
}

/* ── Spinner ────────────────────────────────────────────────────────────── */
.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* ── Transitions ────────────────────────────────────────────────────────── */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s ease-out;
}

.fade-slide-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.add-new-user-btn {
    font-size: 16px;
    min-height: 40px;
}

.save-btn-wrap {
    position: relative;
}

.saving-indicator {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 100%;
}

@media (min-width: 767px) {
    .form-renderer-container {
        margin: 2rem 0;
    }

    .form-step-content {
        gap: 1.5rem;
    }

    .form-body {
        padding: 18px 18px 24px;
    }

    .btn-primary {
        min-width: 132px;
    }

    .btn-primary,
    .btn-secondary {
        font-size: 18px;
        padding: 8px 14px;
        min-height: 43px;
    }

    .success-icon-wrap {
        width: 80px;
        height: 80px;
        padding: 0;
    }

    .error-state,
    .success-state {
        gap: 1rem;
    }

    .add-new-user-btn {
        font-size: 18px;
        min-height: 43px;
    }
}
</style>
