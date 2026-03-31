<script setup lang="ts">
import { computed } from 'vue';
import { useCaseFormStore } from '../../form-engine/useFormStore';
import { Check } from 'lucide-vue-next';

const store = useCaseFormStore();

const steps = computed(() => {
    if (!store.form) return [];

    // Step 1 title from form title or hardcoded
    const stepsList = [
        {
            id: 0,
            number: 1,
            label: 'Customer Details'
        }
    ];

    // Find all page-type fields and extract the labels
    let counter = 2;
    store.form.fields.forEach((field) => {
        if (field.type === 'page') {
            stepsList.push({
                id: Number(field.id),
                number: counter++,
                label: field.label || `Step ${counter - 1}`
            });
        }
    });

    return stepsList;
});

const getStatus = (num: number) => {
    if (store.currentStep === num) return 'active';
    if (store.currentStep > num) return 'completed';
    return 'pending';
};
</script>

<template>
    <div class="stepper-wrapper">
        <div
            class="stepper-progress"
            :style="{ width: `${(store.currentStep / store.totalPages) * 100}%` }"
        ></div>

        <div class="steps-container">
            <div
                v-for="step in steps"
                :key="step.number"
                class="step-item"
                :class="getStatus(step.number)"
                @click="store.setStep(step.number)"
            >
                <div class="step-badge">
                    <Check v-if="getStatus(step.number) === 'completed'" :size="14" />
                    <span v-else>{{ step.number }}</span>
                </div>
                <div class="step-label">{{ step.label }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stepper-wrapper {
    position: relative;
    background: #f8fafc;
    border-bottom: 1px solid var(--border);
    padding: 1.5rem 0;
}

.stepper-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 4px;
    background: rgb(15 56 103);
    transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.steps-container {
    display: flex;
    justify-content: space-between;
    max-width: 90%;
    margin: 0 auto;
    gap: 1rem;
}

.step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex: 1;
    cursor: pointer;
    transition: all 0.3s;
}

.step-badge {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
    color: #64748b;
    transition: all 0.3s;
    z-index: 10;
}

.step-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-align: center;
    max-width: 80px;
    transition: all 0.3s;
}

/* States */
.step-item.active .step-badge {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-bg);
    box-shadow: 0 0 0 4px var(--accent-bg);
    transform: scale(1.1);
}

.step-item.active .step-label {
    color: var(--accent);
}

.step-item.completed .step-badge {
    background: #10b981;
    border-color: #10b981;
    color: white;
}

.step-item.completed .step-label {
    color: #10b981;
}

@media (max-width: 768px) {
    .step-label {
        display: none;
    }
}
</style>
