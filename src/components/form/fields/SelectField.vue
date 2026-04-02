<script setup lang="ts">
import { computed } from 'vue';
import type { GFField } from '@/form-engine/types.ts';
import BaseField from './BaseField.vue';

const props = defineProps<{
    field: GFField;
    modelValue: string | number | null | undefined;
    error?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const value = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});
</script>

<template>
    <BaseField :field="field" :error="error">
        <div class="gf-select-wrapper">
            <select
                :id="`input_${field.id}`"
                v-model="value"
                class="gf-select"
                :required="field.is_required"
            >
                <option v-if="field.placeholder" value="" disabled selected>
                    {{ field.placeholder }}
                </option>
                <option
                    v-for="choice in field.choices"
                    :key="choice.value"
                    :value="choice.value"
                    v-html="choice.text"
                ></option>
            </select>
        </div>
    </BaseField>
</template>

<style scoped>
.gf-select-wrapper {
    position: relative;
    width: 100%;
}

.gf-select-wrapper::after {
    content: '';
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 6px;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    pointer-events: none;
}

.gf-select {
    width: 100%;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
    border: 1px solid transparent;
    padding: 10px 40px 10px 14px;
    border-radius: 8px;
    font-size: 1rem;
    color: #262469;
    appearance: none;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    cursor: pointer;
}

.gf-select:focus {
    outline: none;
    box-shadow: 0 0 12px 0 rgba(111, 1, 255, 0.32);
}

.gf-select:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    opacity: 0.6;
}
</style>
