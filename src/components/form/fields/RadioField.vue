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
    <div class="gf-radio-group">
      <label 
        v-for="(choice, index) in field.choices" 
        :key="index"
        class="gf-radio-label"
        :class="{ 'is-selected': value === choice.value }"
      >
        <input 
          type="radio"
          :name="String(field.id)"
          :value="choice.value"
          v-model="value"
          class="gf-radio-input"
        />
        <div class="gf-radio-indicator"></div>
        <span class="gf-radio-text">{{ choice.text }}</span>
      </label>
    </div>
  </BaseField>
</template>

<style scoped>
.gf-radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.gf-radio-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.gf-radio-label:hover {
  background: #f8fafc;
  border-color: var(--accent-border);
}

.gf-radio-label.is-selected {
  border-color: var(--accent);
  background: var(--accent-bg);
  box-shadow: 0 0 0 1px var(--accent);
}

.gf-radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.gf-radio-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  background: #fff;
  transition: all 0.2s;
}

.gf-radio-label.is-selected .gf-radio-indicator {
  border-color: var(--accent);
}

.gf-radio-indicator::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 10px;
  height: 10px;
  background: var(--accent);
  border-radius: 50%;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.gf-radio-label.is-selected .gf-radio-indicator::after {
  transform: translate(-50%, -50%) scale(1);
}

.gf-radio-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-h);
}
</style>
