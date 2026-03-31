<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useForm } from 'vee-validate'
import { useCaseFormStore } from '../../form-engine/useFormStore'
import { formsService, casesService, ApiError } from '../../api'
import '../../assets/form-design.css'
import FieldSkeleton from './FieldSkeleton.vue'
import FieldDispatcher from './FieldDispatcher.vue'
import FormStepper from './FormStepper.vue'
import { ChevronRight, ChevronLeft, Check, AlertCircle, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  /** GF form ID (schema to load) */
  formId: number
  /**
   * Optional WP case post ID.
   * • undefined -> new case (will be created on mount)
   * • number    -> existing case (form pre-filled from hm_form_data)
   */
  caseId?: number
}>()

// ── Emits ────────────────────────────────────────────────────────────────────

/**
 * Fired after a new case is created so the parent can update the URL
 * without navigating away: emit('case-created', newCaseId)
 */
const emit = defineEmits<{
  (e: 'case-created', caseId: number): void
  (e: 'case-submitted', caseId: number): void
}>()

// ── Store & form ──────────────────────────────────────────────────────────────

const store = useCaseFormStore()
const { handleSubmit, validate, setValues } = useForm()

// ── Local state ───────────────────────────────────────────────────────────────

const isPageLoading = ref(true)
const loadError     = ref<string | null>(null)

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatApiError(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error)    return err.message
  return 'An unexpected error occurred.'
}

// ── Mount logic ───────────────────────────────────────────────────────────────

onMounted(async () => {
  isPageLoading.value = true
  loadError.value     = null

  try {
    const rawSchema = await formsService.getSchema(props.formId) as any
    const gfForm = {
      form_id: rawSchema.form_id || rawSchema.id,
      form_title: rawSchema.form_title || rawSchema.title,
      field_count: 0,
      fields: []
    } as import('../../form-engine/types').GFForm

    if (rawSchema.steps && Array.isArray(rawSchema.steps)) {
      rawSchema.steps.forEach((step: any, idx: number) => {
        if (idx > 0) {
          gfForm.fields.push({ id: `page_${idx}`, type: 'page' } as any)
        }
        if (step.fields && Array.isArray(step.fields)) {
          step.fields.forEach((f: any) => {
            gfForm.fields.push({
              ...f,
              isRequired: f.is_required,
              isHidden: f.is_hidden,
              conditionalLogic: f.conditional_logic || null,
              cssClass: f.css_class || '',
            })
          })
        }
      })
      gfForm.field_count = gfForm.fields.length
    }
    
    store.initialize(gfForm)

    // 2a. Existing case — load hm_form_data and hydrate
    if (props.caseId) {
      store.setCaseId(props.caseId)

      const caseData = await casesService.get(props.caseId)

      if (caseData.form_data && Object.keys(caseData.form_data).length > 0) {
        store.hydrateFromFormData(caseData.form_data)
      }

      setValues(store.values)

      // Restore the step the user last reached:
      // current_step stores the last completed step, so resume at current_step + 1.
      if (caseData.current_step > 0) {
        store.setStep(caseData.current_step + 1)
      }

      // If already submitted, mark accordingly
      if (caseData.status !== 'draft' && caseData.status !== 'returned') {
        store.isSubmitted = true
      }
    } else {
      // 2b. New case — create draft immediately so we always have a caseId
      const created = await casesService.create({ form_id: props.formId })
      store.setCaseId(created.id)
      emit('case-created', created.id)
    }
  } catch (err) {
    console.error('[FormRenderer] Load error:', err)
    loadError.value = formatApiError(err)
  } finally {
    // Small delay for premium skeleton feel
    setTimeout(() => { isPageLoading.value = false }, 600)
  }
})

// ── Navigation actions ────────────────────────────────────────────────────────

/** Save current step data to the API, then advance to next step. */
const nextStep = async () => {
  // Client-side validation first
  const result = await validate()
  if (!result.valid) return

  // Persist data + completed step number to API
  const saved = await saveFormData(store.currentStep)
  if (!saved) return

  store.nextStep()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const prevStep = () => {
  store.prevStep()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Save helpers ─────────────────────────────────────────────────────────────

/**
 * Persist current form data (and optionally the completed step) to the backend.
 * @param completedStep - the step number that was just completed; omit to save without step progression
 */
async function saveFormData(completedStep?: number): Promise<boolean> {
  if (!store.caseId) {
    store.saveError = 'Case ID is missing. Please reload the page.'
    return false
  }

  store.isSaving    = true
  store.saveError   = null

  try {
    await casesService.updateFormData(store.caseId, {
      fields: store.formDataSnapshot,
      current_step: completedStep ?? store.currentStep,
    })
    return true
  } catch (err) {
    store.saveError = formatApiError(err)
    return false
  } finally {
    store.isSaving = false
  }
}

// ── Final submit ──────────────────────────────────────────────────────────────

const onFinalSubmit = handleSubmit(async () => {
  if (!store.caseId) {
    store.saveError = 'Case ID is missing. Please reload the page.'
    return
  }

  // 1. Save latest form data
  const saved = await saveFormData()
  if (!saved) return

  // 2. Transition status -> in_review
  store.isSaving  = true
  store.saveError = null

  try {
    await casesService.submit(store.caseId)
    store.isSubmitted = true
    emit('case-submitted', store.caseId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    store.saveError = formatApiError(err)
  } finally {
    store.isSaving = false
  }
})
</script>

<template>
  <!-- ── Loading skeleton ──────────────────────────────────────────────────── -->
  <div v-if="isPageLoading" class="form-renderer-container glass-panel">
    <div class="form-body">
      <div class="skeleton-header skeleton" style="width: 50%; height: 32px; margin-bottom: 2rem;"></div>
      <FieldSkeleton v-for="i in 7" :key="i" />
    </div>
  </div>

  <!-- ── Load error ────────────────────────────────────────────────────────── -->
  <div v-else-if="loadError" class="form-renderer-container glass-panel">
    <div class="form-body error-state">
      <AlertCircle :size="48" class="error-icon" />
      <h3>Failed to load the form</h3>
      <p>{{ loadError }}</p>
      <button class="btn-primary" @click="() => { loadError = null; isPageLoading = true; $forceUpdate() }">
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
      <p>Your case study has been submitted for review. Your supervisor will be notified shortly.</p>
      <p class="case-id-note">Case ID: <strong>#{{ store.caseId }}</strong></p>
    </div>
  </div>

  <!-- ── Form ──────────────────────────────────────────────────────────────── -->
  <div v-else-if="store.form" class="form-renderer-container glass-panel">
    <FormStepper />

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
        <!-- Previous -->
        <button
          v-if="store.currentStep > 1"
          type="button"
          class="btn-secondary"
          :disabled="store.isSaving"
          @click="prevStep"
        >
          <ChevronLeft :size="18" />
          Previous
        </button>

        <div class="footer-spacer"></div>

        <!-- Saving indicator -->
        <transition name="fade">
          <span v-if="store.isSaving" class="saving-indicator">
            <Loader2 :size="16" class="spin" />
            Saving…
          </span>
        </transition>

        <!-- Next -->
        <button
          v-if="store.currentStep < store.totalPages"
          type="button"
          class="btn-primary"
          :disabled="store.isSaving"
          @click="nextStep"
        >
          Next Step
          <ChevronRight :size="18" />
        </button>

        <!-- Submit -->
        <button
          v-else
          type="button"
          class="btn-primary btn-submit"
          :disabled="store.isSaving"
          @click="onFinalSubmit"
        >
          <Loader2 v-if="store.isSaving" :size="18" class="spin" />
          <Check v-else :size="18" />
          Submit Case Study
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-renderer-container {
  max-width: 810px;
  margin: 2rem 0;
  background: linear-gradient(white, white) padding-box, linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
  border: 1px solid transparent;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border-radius: 5px;
  padding: 0;
}

.form-body {
  padding: 18px;
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
  gap: 1rem;
  min-height: 360px;
}

.form-step-content {
  /*display: flex;
  gap: 1rem;
  flex-wrap: wrap;*/
  display: grid;
  gap: 1rem;
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
  width: 80px;
  height: 80px;
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
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

.success-state h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.success-state p {
  color: #64748b;
  max-width: 400px;
  line-height: 1.6;
}

.case-id-note {
  font-size: 0.9rem;
  color: #94a3b8;
}

.case-id-note strong {
  color: var(--accent);
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
}

.footer-spacer { flex-grow: 1; }

.saving-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #94a3b8;
}

/* ── Buttons ────────────────────────────────────────────────────────────── */
.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  color: #fff;
  padding: 8px 14px;
  border-radius: 5px;
  font-size: 20px;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background-color: #262469;
  min-width: 132px;
  min-height: 43px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--accent-bg);
}

/*.btn-secondary {
  position: relative;
  color: #fff;
  background: linear-gradient(225deg, #f7931d 0%, #262469 55%) border-box;
  min-width: 158px;
  justify-content: flex-end;
}*/

.btn-secondary {
  background-color: #efefef;
  color: #262469;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
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
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
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
.fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }
</style>
