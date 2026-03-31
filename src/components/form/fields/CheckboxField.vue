<script setup lang="ts">
import { computed } from 'vue'
import type { GFField } from '../../../form-engine/types'
import BaseField from './BaseField.vue'

const props = defineProps<{
  field: GFField
  modelValues: Record<string, any>
  error?: string
}>()

const emit = defineEmits(['update:value'])

// Decode HTML entities like &amp; → &
const decodeHTML = (str: string): string => {
  const txt = document.createElement('textarea')
  txt.innerHTML = str
  return txt.value
}

const toggleValue = (inputId: string, text: string, isChecked: boolean) => {
  emit('update:value', { id: inputId, value: isChecked ? text : '' })
}

// All checked = every input has a truthy value in the store
const allChecked = computed(() => {
  if (!props.field.choices || !props.field.inputs) return false
  return props.field.inputs.every(input => !!props.modelValues[input.id])
})

const toggleAll = () => {
  if (!props.field.choices || !props.field.inputs) return
  const shouldCheck = !allChecked.value
  props.field.choices.forEach((choice, idx) => {
    const input = props.field.inputs![idx]
    if (input) {
      emit('update:value', { id: input.id, value: shouldCheck ? choice.text : '' })
    }
  })
}
</script>

<template>
  <BaseField :field="field" :error="error">
    <div class="gf-checkbox-wrapper">

      <div class="gf-checkbox-group">
        <label
          v-for="(choice, index) in field.choices"
          :key="index"
          class="gf-checkbox-label"
          :class="{ 'is-selected': !!modelValues[field.inputs?.[index]?.id ?? ''] }"
        >
          <input
            type="checkbox"
            :value="choice.value"
            :checked="!!modelValues[field.inputs?.[index]?.id ?? '']"
            @change="(e) => toggleValue(field.inputs?.[index]?.id ?? '', choice.text, (e.target as HTMLInputElement).checked)"
            class="gf-checkbox-input"
          />
          <div class="gf-checkbox-indicator">
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" v-if="!!modelValues[field.inputs?.[index]?.id ?? '']">
               <path d="M1 5L4.5 8.5L10.5 1.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <!-- decodeHTML fixes double-encoding like &amp;amp; → & -->
          <span class="gf-checkbox-text">{{ decodeHTML(choice.text) }}</span>
        </label>
      </div>

       <!-- Select All / Deselect All button -->
      <button
        v-if="field.choices && field.choices.length > 1"
        type="button"
        class="gf-select-all-btn"
        @click="toggleAll"
      >
        {{ allChecked ? 'Deselect All' : 'Select All' }}
      </button>
    </div>
  </BaseField>
</template>

<style scoped>
.gf-checkbox-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.gf-select-all-btn {
  align-self: flex-start;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: #f8fafc;
  color: var(--text-h);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.gf-select-all-btn:hover {
  color: rgb(17, 35, 55);
}

.gf-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gf-checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.gf-checkbox-label:hover {
  background: #f8fafc;
  border-color: var(--accent-border);
}

.gf-checkbox-label.is-selected {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.gf-checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.gf-checkbox-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff;
  transition: all 0.2s;
}

.gf-checkbox-label.is-selected .gf-checkbox-indicator {
  border-color: var(--accent);
  background: var(--accent);
}

.gf-checkbox-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-h);
}
</style>
