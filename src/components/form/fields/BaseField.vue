<script setup lang="ts">
import { computed } from 'vue';
import type { AnyField } from '@/form-engine/types';
import { useCaseFormStore } from '@/form-engine/useFormStore';

const props = defineProps<{
    field: AnyField;
    error?: string;
}>();

const store = useCaseFormStore();

const isRequired = computed(() => props.field.is_required);
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
            {{ displayedLabel }}&nbsp;<span v-if="isRequired" class="gf-required">*</span>
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
    text-align: left;
    width: 100%;
}

.gf-input-container {
    position: relative;
}

.gf-label {
    font-weight: 700;
    font-size: 16px;
    color: #262469;
    display: inline-block;
    gap: 2px;
    margin-bottom: 4px;
}

.gf-required {
    color: #262469;
    font-weight: 500;
}

.gf-description {
    font-size: 0.85rem;
    color: #585e6a;
    margin-top: 0.25rem;
}

.gf-error-message {
    margin-top: 0.25rem;
    font-size: 14px;
    color: #ef4444;
}

.has-error :deep(input),
.has-error :deep(select),
.has-error :deep(.gf-checkbox-indicator),
.has-error :deep(.gf-radio-indicator),
.has-error :deep(textarea) {
    border-color: #ef4444;
    background: #fef2f2;
}

@media (min-width: 767px) {
    .gf-label {
        font-size: 17px;
        margin-bottom: 8px;
        gap: 4px;
    }
}
</style>
