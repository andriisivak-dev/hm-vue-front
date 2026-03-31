<script setup lang="ts">
import { computed } from 'vue'
import type { GFField } from '../../../form-engine/types'
import { useCaseFormStore } from '../../../form-engine/useFormStore'
import BaseField from './BaseField.vue'

const props = defineProps<{
  field: GFField
  modelValue: any
  error?: string
}>()

const store = useCaseFormStore()
const emit = defineEmits(['update:modelValue'])

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isReadonly = computed(() => {
  return store.isFieldReadonly(props.field.id)
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
  border-radius: 5px;
  background: linear-gradient(white, white) padding-box, linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
  border: 1px solid transparent;
  padding: 10px 15px;
  min-height: 43px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  width: 100%;
  color: rgb(17, 35, 55);
}

.gf-input:not(.gf-readonly):focus {
  outline: none;
  box-shadow: 0 0 12px 0 rgba(111, 1, 255, 0.32);
}

.gf-readonly {
  background: #f1f5f9 !important;
  cursor: not-allowed;
  color: rgb(100, 100, 100);
}

.gf-input::placeholder {
  opacity: 0.5;
  color: rgb(17, 35, 55);
}
</style>
