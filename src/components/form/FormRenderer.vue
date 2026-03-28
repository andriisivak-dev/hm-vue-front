<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useForm } from 'vee-validate'
import { useCaseFormStore } from '../../form-engine/useFormStore'
import '../../assets/form-design.css'
import FieldSkeleton from './FieldSkeleton.vue'
import FieldDispatcher from './FieldDispatcher.vue'
import FormStepper from './FormStepper.vue'
import { ChevronRight, ChevronLeft, Check } from 'lucide-vue-next'

const props = defineProps<{
  formId: number
  entryId?: number
}>()

const store = useCaseFormStore()
const isPageLoading = ref(true)

const { handleSubmit, validate, setValues } = useForm()

onMounted(async () => {
  // 1. Avoid duplicate initialization if form is already loaded
  if (store.form && String(store.form.form_id) === String(props.formId)) {
    isPageLoading.value = false
    return
  }

  isPageLoading.value = true
  try {
    const fetchOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'X-WP-Nonce': (window as any).GFConfig?.nonce || ''
      }
    }

    // 2. Fetch Form Fields
    const formRes = await fetch(`https://heman-tools.localhost/wp-json/hemant/v1/forms/${props.formId}/fields`, fetchOptions)
    
    if (formRes.status === 401) {
       console.error('REST API 401: Authentication failed. Please check your login session or Nonce.')
    }

    const formData = await formRes.json()
    store.initialize(formData)

    // 3. Fetch Entry data if exists
    if (props.entryId) {
      const entryRes = await fetch(`https://heman-tools.localhost/wp-json/hemant/v1/entries/${props.entryId}`, fetchOptions)
      const entryData = await entryRes.json()
      store.hydrate(entryData)
      setValues(store.values)
    }
  } catch (err) {
    console.error('Failed to load form:', err)
  } finally {
    // Artificial delay for premium feel / seeing skeleton
    setTimeout(() => {
        isPageLoading.value = false
    }, 800)
  }
})

const nextStep = async () => {
  const result = await validate()
  if (result.valid) {
    store.nextStep()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const prevStep = () => {
  store.prevStep()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onFinalSubmit = handleSubmit((values) => {
  console.log('Final Submit:', values)
  alert('Form submitted successfully!')
})
</script>

<template>
  <div v-if="isPageLoading" class="form-renderer-container glass-panel">
     <div class="form-body">
        <div class="skeleton-header skeleton" style="width: 50%; height: 32px; margin-bottom: 2rem;"></div>
        <FieldSkeleton v-for="i in 5" :key="i" />
     </div>
  </div>

  <div v-else-if="store.form" class="form-renderer-container glass-panel">
    <FormStepper />

    <form @submit.prevent class="form-body">
      <transition 
        name="fade-slide" 
        mode="out-in"
      >
        <div :key="store.currentStep" class="form-step-content">
          <FieldDispatcher 
            v-for="field in store.currentStepFields" 
            :key="field.id"
            :field="field"
          />
        </div>
      </transition>

      <div class="form-footer">
        <button 
          v-if="store.currentStep > 1"
          type="button" 
          class="btn-secondary" 
          @click="prevStep"
        >
          <ChevronLeft :size="18" />
          Previous
        </button>
        
        <div class="footer-spacer"></div>

        <button 
          v-if="store.currentStep < store.totalPages"
          type="button" 
          class="btn-primary" 
          @click="nextStep"
        >
          Next Step
          <ChevronRight :size="18" />
        </button>

        <button 
          v-else
          type="button" 
          class="btn-primary btn-submit" 
          @click="onFinalSubmit"
        >
          <Check :size="18" />
          Submit Case Study
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-renderer-container {
  max-width: 800px;
  margin: 2rem auto;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  padding: 0;
}

.form-body {
  padding: 2.5rem;
  min-height: 400px;
}

.form-footer {
  display: flex;
  align-items: center;
  padding: 1.5rem 2.5rem;
  background: var(--bg);
  border-top: 1px solid var(--border);
}

.footer-spacer { flex-grow: 1; }

.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: var(--accent);
  color: white;
  box-shadow: 0 4px 12px var(--accent-bg);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--accent-bg);
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-submit {
  background: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

/* Animations */
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

/* Loader */
.form-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem;
  gap: 1rem;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
