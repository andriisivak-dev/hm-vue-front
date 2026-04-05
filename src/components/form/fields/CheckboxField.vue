<script setup lang="ts">
import { computed } from 'vue';
import type { GFField } from '@/form-engine/types.ts';
import { useCaseFormStore } from '@/form-engine/useFormStore.ts';
import BaseField from './BaseField.vue';

const props = defineProps<{
    field: GFField;
    modelValues: Record<string, unknown>;
    error?: string;
}>();

const store = useCaseFormStore();
const emit = defineEmits(['update:value']);

const isReadonly = computed(() => {
    return store.isFieldReadonly(props.field.id);
});

const toggleValue = (inputId: string, text: string, isChecked: boolean) => {
    if (isReadonly.value) return;
    emit('update:value', { id: inputId, value: isChecked ? text : '' });
};

// All checked = every input has a truthy value in the store
const allChecked = computed(() => {
    if (!props.field.choices || !props.field.inputs) return false;
    return props.field.inputs.every((input) => !!props.modelValues[input.id]);
});

const toggleAll = () => {
    if (isReadonly.value) return;
    if (!props.field.choices || !props.field.inputs || typeof props.field.choices === 'string')
        return;
    const shouldCheck = !allChecked.value;
    props.field.choices.forEach((choice, idx) => {
        const input = props.field.inputs![idx];
        if (input) {
            emit('update:value', { id: input.id, value: shouldCheck ? choice.text : '' });
        }
    });
};
</script>

<template>
    <BaseField :field="field" :error="error">
        <div class="gf-checkbox-wrapper">
            <div class="gf-checkbox-group">
                <template v-for="(choice, index) in field.choices" :key="index">
                    <label
                        v-if="typeof choice !== 'string'"
                        class="gf-checkbox-label"
                        :class="{
                            'is-selected': !!modelValues[field.inputs?.[index]?.id ?? ''],
                            'gf-readonly': isReadonly
                        }"
                    >
                        <input
                            type="checkbox"
                            :value="choice.value"
                            :checked="!!modelValues[field.inputs?.[index]?.id ?? '']"
                            :disabled="isReadonly"
                            @change="
                                (e) =>
                                    toggleValue(
                                        field.inputs?.[index]?.id ?? '',
                                        choice.text,
                                        (e.target as HTMLInputElement).checked
                                    )
                            "
                            class="gf-checkbox-input"
                        />
                        <div class="gf-checkbox-indicator">
                            <svg
                                width="12"
                                height="10"
                                viewBox="0 0 12 10"
                                fill="none"
                                v-if="!!modelValues[field.inputs?.[index]?.id ?? '']"
                            >
                                <path
                                    d="M1 5L4.5 8.5L10.5 1.5"
                                    stroke="#262469"
                                    stroke-width="2.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </div>
                        <span class="gf-checkbox-text" v-html="choice.text"></span>
                    </label>
                </template>
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
    gap: 12px;
}

.gf-select-all-btn {
    font-size: 14px;
    min-height: 35px;
    padding: 0 12px;
    color: #fff;
    background-color: #262469;
    border-radius: 5px;
    align-self: flex-start;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
}

.gf-select-all-btn:hover {
}

.gf-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.gf-checkbox-label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
}

.gf-checkbox-label:hover {
}

.gf-checkbox-label.is-selected {
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
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
    border: 1px solid transparent;
    transition: all 0.2s;
}

.gf-checkbox-label.is-selected .gf-checkbox-indicator {
}

.gf-checkbox-text {
    font-size: 14px;
    font-weight: 400;
    color: #262469;
}
</style>
