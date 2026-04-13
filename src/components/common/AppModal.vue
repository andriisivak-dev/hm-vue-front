<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

defineProps({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: false }
});

const emit = defineEmits(['hidden', 'opened']);
const isOpen = ref(false);

watch(isOpen, (newVal) => {
    if (newVal) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
});

onUnmounted(() => {
    document.body.style.overflow = 'auto';
});

function show() {
    isOpen.value = true;
    emit('opened');
}

function hide() {
    isOpen.value = false;
}

function onAfterLeave() {
    emit('hidden');
}

defineExpose({ hide, show });
</script>

<template>
    <Teleport to="body">
        <transition name="modal-backdrop-transition">
            <div v-if="isOpen" class="" @click="hide"></div>
        </transition>

        <transition name="modal-transition" @after-leave="onAfterLeave">
            <div
                v-if="isOpen"
                class="modal fade show d-block"
                :id="id"
                tabindex="-1"
                :aria-labelledby="`${id}Label`"
                aria-modal="true"
                role="dialog"
                @mousedown.self="hide"
            >
                <div class="modal-dialog border-linear">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div class="modal-header-top">
                                <h3 class="modal-title" :id="`${id}Label`">{{ title }}</h3>
                                <button
                                    type="button"
                                    class="btn-close"
                                    aria-label="Close"
                                    @click="hide"
                                />
                            </div>
                            <div class="divider"></div>
                            <h4 class="modal-subtitle subtitle" v-if="description">
                                {{ description }}
                            </h4>
                        </div>
                        <div class="modal-body border-linear">
                            <slot />
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<style scoped>
.modal-header {
    padding: 0 0;
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
}

.modal-transition-enter-active,
.modal-transition-leave-active {
    transition:
        opacity 0.25s ease,
        transform 0.25s ease;
}
.modal-transition-enter-from,
.modal-transition-leave-to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
}
.modal-transition-enter-to,
.modal-transition-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.modal-backdrop-transition-enter-active,
.modal-backdrop-transition-leave-active {
    transition: opacity 0.25s ease;
}
.modal-backdrop-transition-enter-from,
.modal-backdrop-transition-leave-to {
    opacity: 0;
}

.modal {
    z-index: 1055;
    background: rgba(0, 0, 0, 0.5);
}
.modal-backdrop {
    z-index: 1050;
    opacity: 0.5;
}

.modal-dialog {
    margin-top: 100px;
    padding: 20px 14px 28px;
}

.modal-content {
    max-width: 808px;
    margin: 0 auto;
    border: none;
    box-shadow: none;
}

.modal-header-top {
    display: flex;
    align-items: center;
    /* justify-content: ; */
}

.modal-header,
.modal-footer {
    border: none;
}

.modal-body {
    margin-top: 16px;
    padding: 14px;
}

.modal-title {
    font-size: 18px;
    font-weight: 700;
}

.modal-subtitle {
    font-size: 18px;
    font-weight: 300;
}

.modal .btn-close:focus {
    box-shadow: 0 0 0 0.25rem rgba(111, 1, 255, 0.15);
}

@media (min-width: 767px) {
    .modal-dialog {
        margin-top: 130px;
        max-width: 864px;
        padding: 20px 28px 28px;
    }

    .modal-body {
        margin-top: 28px;
        padding: 16px;
    }
}
</style>
