<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AnyField } from '@/form-engine/types.ts';
import BaseField from './BaseField.vue';
import { IconEyeClose, IconEyeOpen } from '@/components/SVG';

const props = defineProps<{
    field: AnyField;
    modelValue: string | number | null | undefined;
    error?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const value = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const showPassword = ref(false);
</script>

<template>
    <BaseField :field="field" :error="error">
        <div class="gf-password-wrapper">
            <input
                :id="`input_${field.id}`"
                v-model="value"
                class="gf-input"
                :placeholder="field.placeholder"
                :type="showPassword ? 'text' : 'password'"
                :required="field.is_required"
            />
            <button
                class="gf-password-toggle"
                type="button"
                @click="showPassword = !showPassword"
                tabindex="-1"
            >
                <IconEyeOpen v-if="!showPassword" />
                <IconEyeClose v-else />
            </button>
        </div>
    </BaseField>
</template>

<style scoped>
.gf-password-wrapper {
    position: relative;
    width: 100%;
}
.gf-input {
    border-radius: 5px;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
    border: 1px solid transparent;
    padding: 10px 45px 10px 15px;
    min-height: 43px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    width: 100%;
    color: rgb(17, 35, 55);
}
.gf-input:focus {
    outline: none;
    box-shadow: 0 0 12px 0 rgba(111, 1, 255, 0.32);
}
.gf-input::placeholder {
    opacity: 0.5;
    color: rgb(17, 35, 55);
}
.gf-password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: #6c757d;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
}
</style>
