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
</script>

<template>
  <BaseField :field="field" :error="error">
    <textarea 
      :id="`input_${field.id}`"
      v-model="value"
      class="gf-textarea"
      :placeholder="field.placeholder"
      :required="field.isRequired"
      rows="4"
    ></textarea>
  </BaseField>
</template>

<style scoped>
.gf-textarea {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text-h);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  resize: vertical;
  min-height: 100px;
}

.gf-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
}

.gf-textarea::placeholder {
  color: var(--text);
  opacity: 0.5;
}
</style>
