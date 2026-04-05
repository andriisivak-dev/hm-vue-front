<script setup lang="ts">
import { computed } from 'vue';
import type { GFField } from '@/form-engine/types.ts';
import { useCaseFormStore } from '@/form-engine/useFormStore.ts';
import BaseField from './BaseField.vue';

const props = defineProps<{
    field: GFField;
    modelValue: string | number | null | undefined;
    error?: string;
}>();

const store = useCaseFormStore();
const emit = defineEmits(['update:modelValue']);

const value = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const isReadonly = computed(() => {
    return store.isFieldReadonly(props.field.id);
});
</script>

<template>
    <BaseField :field="field" :error="error">
        <div class="gf-radio-group">
            <template v-for="(choice, index) in field.choices" :key="index">
                <label
                    v-if="typeof choice !== 'string'"
                    class="gf-radio-label"
                    :class="{ 'is-selected': value === choice.value, 'gf-readonly': isReadonly }"
                >
                    <input
                        type="radio"
                        :name="String(field.id)"
                        :value="choice.value"
                        v-model="value"
                        class="gf-radio-input"
                        :disabled="isReadonly"
                    />
                    <div class="gf-radio-indicator"></div>
                    <span class="gf-radio-text" v-html="choice.text"></span>
                </label>
            </template>
        </div>
    </BaseField>
</template>

<style scoped>
.gf-radio-group {
    display: flex;
    gap: 20px;
}

.gf-radio-label {
    min-width: 180px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}

.gf-radio-label.is-selected {
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
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
    border: 1px solid transparent;
    border-radius: 50%;
    position: relative;
    flex-shrink: 0;
    transition: all 0.2s;
}

.gf-radio-label.is-selected .gf-radio-indicator {
}

.gf-radio-indicator::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 8px;
    height: 8px;
    background-color: #262469;
    border-radius: 50%;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.gf-radio-label.is-selected .gf-radio-indicator::after {
    transform: translate(-50%, -50%) scale(1);
}

.gf-radio-text {
    font-size: 14px;
    font-weight: 400;
    color: #112337;
}
</style>
