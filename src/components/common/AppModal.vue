<script setup lang="ts">
import { ref } from 'vue';

defineProps({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: false }
});

const emit = defineEmits(['hidden', 'opened']);
const isOpen = ref(false);

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
    background-color: rgba(0, 0, 0, 1);
}
.modal-backdrop {
    z-index: 1050;
    opacity: 0.5;
}
</style>
