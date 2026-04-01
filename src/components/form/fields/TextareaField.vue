<script setup lang="ts">
import { computed } from 'vue';
import type { GFField } from '../../../form-engine/types';
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
        <textarea
            :id="`input_${field.id}`"
            v-model="value"
            class="gf-textarea"
            :placeholder="field.placeholder"
            :required="field.is_required"
            rows="4"
        ></textarea>
    </BaseField>
</template>

<style scoped>
.gf-textarea {
    border-radius: 5px;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
    border: 1px solid transparent;
    padding: 10px 15px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    width: 100%;
    color: rgb(17, 35, 55);
    resize: vertical;
    min-height: 100px;
}

.gf-textarea:focus {
    outline: none;
    box-shadow: 0 0 12px 0 rgba(111, 1, 255, 0.32);
}

.gf-textarea::placeholder {
    color: rgb(17, 35, 55);
    opacity: 0.5;
}
</style>
