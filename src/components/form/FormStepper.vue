<script setup lang="ts">
import { useCaseFormStore } from '@/form-engine/useFormStore.ts';
import { Check } from 'lucide-vue-next';

defineProps<{
    isViewMode?: boolean;
}>();

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
        <div class="form-info" v-if="!isViewMode">
            <p class="steps-require-note">
                "<span style="color: #c02b0a">*</span>" indicates required fields
            </p>
            <p>Your changes are saved automatically every 30 seconds.</p>
        </div>

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
    padding: 12px 12px 0;
}

.steps-form-title {
    margin: 0;
    font-size: 1.4rem;
    line-height: 1.2;
    font-weight: 500;
}

.form-info {
    margin: 16px 0 20px;
}

.form-info p {
    margin: 0;
}

.steps-container {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    column-gap: 4px;
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
    width: 36px;
    height: 36px;
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
    font-size: 16px;
    transition: all 0.3s;
    z-index: 10;
    position: relative;
    user-select: none;
}

.step-label {
    color: #262469;
    font-weight: 300;
    font-size: 14px;
    line-height: 1.2;
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
    width: 20px;
    height: 20px;
    top: -4px;
    left: -10px;
    border-radius: 50%;
    padding: 2px 4px;
}

.step-item.locked {
    cursor: not-allowed;
    opacity: 0.85;
}

@media (min-width: 767px) {
    .stepper-wrapper {
        padding: 18px 18px 0;
    }

    .steps-form-title {
        font-size: 2rem;
        margin: 0 0 0.5rem;
    }

    .form-info {
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
    }

    .steps-container {
        margin-top: 20px;
        column-gap: 12px;
    }

    .step-badge {
        width: 50px;
        height: 50px;
        font-size: 20px;
    }

    .step-completed-icon {
        width: 32px;
        height: 32px;
        padding: 4px 8px;
        left: -16px;
    }
}
</style>
