<script setup lang="ts">
import { computed } from 'vue';
import type { GFField } from '@/form-engine/types';
import { useCaseFormStore } from '@/form-engine/useFormStore';

const props = defineProps<{
    field: GFField;
    error?: string;
}>();

const store = useCaseFormStore();

const isRequired = computed(() => props.field.isRequired);
const displayedLabel = computed(() => store.getFormattedLabel(props.field));
const isSuggestedField = computed(() => props.field.label?.includes('(Suggested)'));
</script>

<template>
    <div
        :id="`field_wrapper_${field.id}`"
        class="gf-field-wrapper"
        :class="[field.cssClass, { 'has-error': error }]"
        :data-is-suggested="isSuggestedField"
    >
        <label v-if="field.type !== 'section'" :for="`input_${field.id}`" class="gf-label">
            {{ displayedLabel }}
            <span v-if="isRequired" class="gf-required">*</span>
        </label>

        <div class="gf-input-container">
            <slot />
        </div>

        <p v-if="field.description" class="gf-description">{{ field.description }}</p>
        <p v-if="error" class="gf-error-message">{{ error }}</p>
    </div>
</template>

<style scoped>
.gf-field-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
    width: 100%;
}

.gf-label {
    font-weight: 700;
    font-size: 18px;
    color: #262469;
    display: flex;
    align-items: center;
    gap: 4px;
}

.gf-required {
    color: #ef4444;
}

.gf-description {
    font-size: 0.85rem;
    color: #585e6a;
    margin-top: 0.25rem;
}

.gf-error-message {
    font-size: 0.85rem;
    color: #ef4444;
    margin-top: 0.25rem;
}

.has-error :deep(input),
.has-error :deep(select),
.has-error :deep(.gf-checkbox-indicator),
.has-error :deep(.gf-radio-indicator),
.has-error :deep(textarea) {
    border-color: #ef4444;
    background: #fef2f2;
}
</style>
