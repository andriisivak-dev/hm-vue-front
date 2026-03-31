<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue'
import { Field } from 'vee-validate'
import type { GFField } from '../../form-engine/types'
import { useCaseFormStore } from '../../form-engine/useFormStore'
import { ValidationAdapter } from '../../form-engine/ValidationAdapter'

const props = defineProps<{
  field: GFField
}>()

const store = useCaseFormStore()

// Mapping field types to components
const componentMap: Record<string, any> = {
  text: defineAsyncComponent(() => import('./fields/TextField.vue')),
  number: defineAsyncComponent(() => import('./fields/TextField.vue')), // Reuse TextField with numeric type
  select: defineAsyncComponent(() => import('./fields/SelectField.vue')),
  radio: defineAsyncComponent(() => import('./fields/RadioField.vue')),
  checkbox: defineAsyncComponent(() => import('./fields/CheckboxField.vue')),
  textarea: defineAsyncComponent(() => import('./fields/TextareaField.vue')),
  calculation: defineAsyncComponent(() => import('./fields/TextField.vue')), // Read-only text field
}

const component = computed(() => {
  // Specialized components by class
  const cssClass = props.field.cssClass || ''
  if (cssClass.includes('csp-client-autocomplete')) {
    return defineAsyncComponent(() => import('./fields/ClientAutocompleteField.vue'))
  }

  // Standard component mapping
  return componentMap[props.field.type] || null
})

const isVisible = computed(() => store.isFieldVisible(props.field.id))

// Use ValidationAdapter for dynamic rules — but only when the field is actually visible.
// Hidden fields (conditional logic) must NOT participate in validation or they block navigation.
const validationRules = computed(() =>
  isVisible.value ? ValidationAdapter.getRules(props.field) : ''
)

/**
 * Checkbox fields store values in sub-input keys (e.g. "17.1", "17.2") rather than
 * the parent key ("17"). We synthesise an aggreform-step-contentgate array so vee-validate can properly
 * evaluate `required` (non-empty array = at least one checked).
 */
const checkboxAggregateValue = computed<string[]>(() => {
  if (props.field.type !== 'checkbox' || !props.field.inputs) return []
  return props.field.inputs
    .map(input => store.values[input.id])
    .filter(v => v !== '' && v !== null && v !== undefined)
})

/**
 * The value that vee-validate `<Field>` should observe.
 * – checkbox → aggregate array of selected sub-values
 * – everything else → direct store value
 */
const fieldModelValue = computed(() =>
  props.field.type === 'checkbox'
    ? checkboxAggregateValue.value
    : store.values[String(props.field.id)]
)


const onUpdate = (value: any) => {
  store.updateValue(props.field.id, value)
}

const onCheckboxUpdate = (payload: { id: string, value: any }) => {
  store.updateValue(payload.id, payload.value)
}
</script>

<template>
  <transition 
    name="field-fade-slide"
    appear
  >
    <div
        v-show="isVisible"
        class="gf-field-container"
        :class="[` gf-field--${field.size}`]"
    >
      <template v-if="component">
        <!-- Vee-validate Field Wrapper
             v-model is bound to fieldModelValue:
             • checkbox → aggregate array of selected sub-inputs (for correct required check)
             • others   → store.values[field.id] directly
        -->
        <Field
          :name="String(field.id)"
          :rules="validationRules"
          :model-value="fieldModelValue"
          @update:model-value="onUpdate"
          v-slot="{ errorMessage }"
        >
          <component
            :is="component"
            :field="field"
            :model-value="store.values[String(field.id)]"
            :model-values="store.values"
            :error="errorMessage"
            @update:model-value="onUpdate"
            @update:value="onCheckboxUpdate"
          />
        </Field>
      </template>
      
      <!-- Static components -->
      <template v-else-if="field.type === 'section'">
         <div class="gf-section">
           <h3 class="gf-section-title">{{ field.label }}</h3>
           <p v-if="field.description" class="gf-section-desc">{{ field.description }}</p>
         </div>
      </template>

      <template v-else-if="field.type === 'html'">
         <div class="gf-html" v-html="field.content"></div>
      </template>
    </div>
  </transition>
</template>

<style scoped>
.gf-field-container {
  width: 100%;
}

/* Field Level Transitions */
.field-fade-slide-enter-active,
.field-fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-height: 1000px;
  overflow: hidden;
}

.field-fade-slide-enter-from,
.field-fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
  margin-bottom: 0;
}

.gf-section {
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgb(17, 35, 55);
  padding-bottom: 0.5rem;
}

.gf-section-title {
  font-size: 1.75rem;
  font-weight: 500;
  color: rgb(17, 35, 55);
  margin: 0;
}

.gf-section-desc {
  font-size: 0.9rem;
  color: rgb(17, 35, 55);
  margin-top: 4px;
}

.gf-html {
  margin: 1rem 0;
}

/* Sizes */
.gf-field--small {
  /*max-width: calc((100% / 3) - 2rem);*/
}

.gf-field--medium {
  /*max-width: calc((100% / 2) - 1rem);*/
}

.gf-field--large {
  /*max-width: 100%;*/
}
</style>
