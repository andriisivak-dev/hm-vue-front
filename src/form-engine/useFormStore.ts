import { defineStore } from 'pinia'
import type { GFForm, GFField, GFEntry } from './types'
import { LogicEngine } from './LogicEngine'
import { FormulaEngine } from './FormulaEngine'

export const useCaseFormStore = defineStore('caseForm', {
  state: () => ({
    form: null as GFForm | null,
    values: {} as Record<string, any>,
    readonlyFields: {} as Record<string, boolean>, // fieldId -> boolean
    currentStep: 1,
    isInitialized: false,
    isLoading: false,

    // ── Case state ────────────────────────────────────────────────────────
    /** ID of the WP case post currently being edited (null = not yet created) */
    caseId: null as number | null,
    /** True while an async save/submit is in flight */
    isSaving: false,
    /** Human-readable error from the last save attempt */
    saveError: null as string | null,
    /** True after the case has been successfully submitted (status = in_review) */
    isSubmitted: false,
  }),

  getters: {
    /**
     * Determine if a field is readonly (calculation OR manual)
     */
    isFieldReadonly: (state) => (fieldId: string | number) => {
      const field = state.form?.fields.find((f) => String(f.id) === String(fieldId))
      if (field?.calculation?.enableCalculation) return true
      return !!state.readonlyFields[String(fieldId)]
    },
    /**
     * Total number of pages in the form
     */
    totalPages: (state) => {
      if (!state.form) return 0
      const pageFields = state.form.fields.filter((f) => f.type === 'page')
      return pageFields.length + 1 // +1 for the last page
    },

    /**
     * Fields belonging ONLY to the current step
     */
    currentStepFields: (state) => {
      if (!state.form) return []
      let stepCounter = 1
      const stepFields: GFField[] = []

      for (const field of state.form.fields) {
        if (field.type === 'page') {
          stepCounter++
          continue
        }
        if (stepCounter === state.currentStep) {
          stepFields.push(field)
        }
      }
      return stepFields
    },

    /**
     * All form values (read-only for external exposure)
     */
    formValues: (state) => state.values,

    /**
     * Get field visibility by ID (reactive)
     */
    isFieldVisible: (state) => (fieldId: string | number) => {
      const field = state.form?.fields.find((f) => String(f.id) === String(fieldId))
      if (!field) return false
      // If visibility prop is already hidden by GF, then respect it
      if (field.visibility === 'hidden') return false
      // Otherwise, evaluate conditional logic
      return LogicEngine.shouldShow(field.conditionalLogic, state.values)
    },

    /**
     * Flat snapshot of current values suitable for sending to the API.
     * Only includes non-empty values; page-break fields are excluded.
     */
    formDataSnapshot: (state): Record<string, any> => {
      const snapshot: Record<string, any> = {}
      Object.entries(state.values).forEach(([k, v]) => {
        // Skip page-break fields (they aren't real data)
        const isPage = state.form?.fields.find(f => String(f.id) === k && f.type === 'page')
        if (isPage) return
        snapshot[k] = v
      })
      return snapshot
    },
  },

  actions: {
    /**
     * Set a field as manually readonly or not
     */
    setFieldReadonly(fieldId: string | number, isReadonly: boolean) {
      this.readonlyFields[String(fieldId)] = isReadonly
    },

    /**
     * Initialize form schema and set default values.
     * Resets all case state.
     */
    initialize(form: GFForm) {
      this.form = form
      const initialValues: Record<string, any> = {}
      this.readonlyFields = {} // Reset on new form

      form.fields.forEach((field) => {
        // Initialize default values (prioritize field defaults)
        if (field.defaultValue !== undefined) {
          initialValues[String(field.id)] = field.defaultValue
        } else if (field.type === 'checkbox') {
          // Checkboxes might have sub-inputs. In GF, truthy means the label text.
          // But here, we'll store them by their specific checkbox input IDs like 17.1.
          if (field.inputs) {
            field.inputs.forEach((input) => {
              initialValues[input.id] = ''
            })
          }
        } else {
          initialValues[String(field.id)] = ''
        }
      })

      this.values = initialValues
      this.isInitialized = true
      this.currentStep = 1
      this.saveError = null
      this.isSubmitted = false
      this.caseId = null  // will be set after creation or load

      // Initial calculation run
      this.recalculateAll()
    },

    /**
     * Hydrate form with data from a specific GF entry (legacy path).
     */
    hydrate(entry: GFEntry) {
      if (!this.form) return

      // Use a consistent record of all form fields for initialization
      const allFieldIds = new Set(this.form.fields.map(f => String(f.id)))

      // Also include sub-inputs for checkboxes/radio/etc.
      this.form.fields.forEach(f => {
        if (f.inputs) {
          f.inputs.forEach(input => allFieldIds.add(input.id))
        }
      })

      // Entry fields are keyed by string ID like "10" or "17.1"
      Object.entries(entry.fields).forEach(([key, value]) => {
        let processedValue = value

        // 1. Handle JSON strings for file uploads/arrays
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
          try {
            processedValue = JSON.parse(value)
          } catch (e) {
            // Not a JSON, keep as is
          }
        }

        // 2. Set value
        this.values[key] = processedValue
      })

      // Recalculate visibility and formulas after hydrate
      this.recalculateAll()
    },

    /**
     * Hydrate form with data from `hm_form_data` (new path).
     * The payload is a flat { field_id: value } map already decoded from JSON.
     */
    hydrateFromFormData(formData: Record<string, any>) {
      if (!this.form) return

      Object.entries(formData).forEach(([key, value]) => {
        let processedValue = value

        // Handle JSON strings for file uploads/arrays
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
          try {
            processedValue = JSON.parse(value)
          } catch {
            // keep as-is
          }
        }

        this.values[key] = processedValue
      })

      this.recalculateAll()
    },

    /**
     * Update a single field value and trigger dependent logic
     */
    updateValue(fieldId: string | number, value: any) {
      this.values[String(fieldId)] = value

      // Cascade: recalculate all formulas because they could depend on this value
      this.recalculateAll()
    },

    /**
     * Logic recalculation hub
     */
    recalculateAll() {
      if (!this.form) return

      // 1. Recalculate Formulas
      this.form.fields.forEach((field) => {
        if (field.calculation && field.calculation.enableCalculation) {
          const result = FormulaEngine.calculate(field.calculation, this.values)
          this.values[String(field.id)] = result
        }
      })

      // 2. Note: Visibility is handled by the getter 'isFieldVisible' so it's reactive.
    },

    /**
     * Step navigation
     */
    nextStep() {
      if (this.currentStep < this.totalPages) {
        this.currentStep++
      }
    },

    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--
      }
    },

    setStep(step: number) {
      if (step >= 1 && step <= this.totalPages) {
        this.currentStep = step
      }
    },

    /** Store the WP case post ID after async creation */
    setCaseId(id: number | null) {
      this.caseId = id
    },

    clearSaveError() {
      this.saveError = null
    },
  },
})
