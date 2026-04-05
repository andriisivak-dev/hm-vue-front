<script setup lang="ts">
import { useCaseFormStore } from '@/form-engine/useFormStore.ts';
import { Check } from 'lucide-vue-next';

const store = useCaseFormStore();

const getStatus = (num: number) => {
    if (store.currentStep === num) return 'active';
    if (store.currentStep > num) return 'completed';
    return 'pending';
};

const isLocked = (num: number) => !store.isViewMode && num > store.highestReachedStep;
</script>

<template>
    <div class="stepper-wrapper">
        <p class="steps-form-title">Case Study</p>
        <p class="steps-require-note">
            "<span style="color: #c02b0a">*</span>" indicates required fields
        </p>

        <div class="steps-container">
            <template v-if="store.form?.steps">
                <div
                    v-for="step in store.form?.steps"
                    :key="step.step_number"
                    class="step-item"
                    :class="[getStatus(step.step_number), { locked: isLocked(step.step_number) }]"
                    @click="store.setStep(step.step_number)"
                >
                    <div class="step-badge">
                        <Check
                            v-if="getStatus(step.step_number) === 'completed'"
                            class="step-completed-icon"
                            :size="14"
                        />
                        <span>{{ step.step_number }}</span>
                    </div>
                    <div class="step-label">{{ step.label }}</div>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.stepper-wrapper {
    position: relative;
    padding: 18px 18px 0;
}

.steps-form-title {
    letter-spacing: -0.24px;
    margin: 0 0 8px;
    font-size: 24px;
    line-height: 118%;
    font-family: var(--heading);
    font-weight: 500;
}

.steps-container {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    gap: 8px 24px;
}

.step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    flex: 1;
    cursor: pointer;
    transition: all 0.3s;
}

.step-badge {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(225deg, #f7931d 0%, #262469 100%) border-box;
    border: 1px solid transparent;
    color: #262469;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 20px;
    transition: all 0.3s;
    z-index: 10;
    position: relative;
    user-select: none;
}

.step-label {
    color: #262469;
    font-weight: 300;
    font-size: 14px;
    text-align: center;
    transition: all 0.3s;
    text-transform: uppercase;
}

/* States */
.step-item.active .step-badge {
    background: linear-gradient(225deg, #f7931d 0%, #262469 100%) border-box;
    border: none;
    color: #fff;
}

.step-completed-icon {
    position: absolute;
    display: block;
    z-index: 20;
    color: #fff;
    background-color: #204ce5;
    width: 32px;
    height: 32px;
    top: -4px;
    left: -16px;
    border-radius: 50%;
    padding: 4px 8px;
}

.step-item.locked {
    cursor: not-allowed;
    opacity: 0.85;
}
</style>
