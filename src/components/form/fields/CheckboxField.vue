<script setup lang="ts">

import type { GFField } from '../../../form-engine/types'
import BaseField from './BaseField.vue'

const props = defineProps<{
  field: GFField
  modelValues: Record<string, any> // The whole values object from store
  error?: string
}>()

const emit = defineEmits(['update:value'])

// For checkboxes, we update individual sub-input IDs like 17.1, 17.2
const toggleValue = (inputId: string, text: string, isChecked: boolean) => {
  // In GF, 'checked' usually means the value is the text of the checkbox choice
  emit('update:value', { id: inputId, value: isChecked ? text : '' })
}
</script>

<template>
  <BaseField :field="field" :error="error">
    <div class="gf-checkbox-group">
      <label 
        v-for="(choice, index) in field.choices" 
        :key="index"
        class="gf-checkbox-label"
        :class="{ 'is-selected': !!modelValues[choice.inputId!] }"
      >
        <input 
          type="checkbox"
          :value="choice.value"
          :checked="!!modelValues[choice.inputId!]"
          @change="(e) => toggleValue(choice.inputId!, choice.text, (e.target as HTMLInputElement).checked)"
          class="gf-checkbox-input"
        />
        <div class="gf-checkbox-indicator">
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" v-if="!!modelValues[choice.inputId!]">
             <path d="M1 5L4.5 8.5L10.5 1.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="gf-checkbox-text">{{ choice.text }}</span>
      </label>
    </div>
  </BaseField>
</template>

<style scoped>
.gf-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.gf-checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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
