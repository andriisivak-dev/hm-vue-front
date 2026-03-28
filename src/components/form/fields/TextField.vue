<script setup lang="ts">
import { computed } from 'vue'
import type { GFField } from '../../../form-engine/types'
import BaseField from './BaseField.vue'

const props = defineProps<{
  field: GFField
  modelValue: any
  error?: string
}>()

const emit = defineEmits(['update:modelValue'])

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isReadonly = computed(() => {
  return props.field.calculation?.enableCalculation === true
})
</script>

<template>
  <BaseField :field="field" :error="error">
    <input 
      :id="`input_${field.id}`"
      v-model="value"
      class="gf-input"
      :class="{ 'gf-readonly': isReadonly }"
      :placeholder="field.placeholder"
      :type="field.inputType || 'text'"
      :required="field.isRequired"
      :readonly="isReadonly"
      :tabindex="isReadonly ? -1 : 0"
    />
  </BaseField>
</template>

<style scoped>
.gf-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text-h);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.gf-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
}

.gf-readonly {
  background: #f1f5f9 !important;
  border-color: #e2e8f0;
  cursor: not-allowed;
  color: var(--text-soft);
}

.gf-input::placeholder {
  color: var(--text);
  opacity: 0.5;
}
</style>
