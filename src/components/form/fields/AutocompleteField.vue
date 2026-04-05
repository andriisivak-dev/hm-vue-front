<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AnyField } from '@/form-engine/types.ts';
import { useCaseFormStore } from '@/form-engine/useFormStore.ts';
import BaseField from './BaseField.vue';
import { useDebounceFn } from '@vueuse/core';
import { useHttpClient } from '@/api/core/httpClient';

export interface AutocompleteResult {
    text: string;
    value: string;
    [key: string]: unknown;
}

const props = defineProps<{
    field: AnyField;
    modelValue: string | number | null | undefined;
    error?: string;
    /** Endpoint URL to call for autocomplete. E.g. /dashboard/autocomplete */
    endpoint?: string;
    /** Extra query parameters to append to the search payload (e.g. { context: 'library', field: 'customer_name' }) */
    extraParams?: Record<string, string>;
}>();

const store = useCaseFormStore();
const emit = defineEmits(['update:modelValue', 'select']);
const client = useHttpClient();

const query = ref(String(props.modelValue || ''));
const results = ref<AutocompleteResult[]>([]);
const isSearching = ref(false);
const showDropdown = ref(false);
const selectedIndex = ref(-1);
const listRef = ref<HTMLElement | null>(null);

const isReadonly = computed(() => {
    return store.isFieldReadonly(props.field.id);
});

/**
 * Perform Search
 */
const searchItems = useDebounceFn(async (term: string) => {
    selectedIndex.value = -1;
    if (term.length < 3) {
        results.value = [];
        showDropdown.value = false;
        return;
    }

    if (!props.endpoint) return;

    isSearching.value = true;
    try {
        const params = {
            term,
            ...props.extraParams
        };

        const res = await client.get<AutocompleteResult[]>(props.endpoint, params);
        results.value = res || [];
        showDropdown.value = results.value.length > 0;
    } catch (err) {
        console.error('Autocomplete error:', err);
    } finally {
        isSearching.value = false;
    }
}, 300);

/**
 * Handle Selection
 */
const selectItem = (item: AutocompleteResult) => {
    query.value = item.value;
    emit('update:modelValue', item.value);
    emit('select', item);
    showDropdown.value = false;
};

/**
 * On manual typing
 */
const onInput = (e: Event) => {
    if (isReadonly.value) return;

    const val = (e.target as HTMLInputElement).value;
    query.value = val;
    emit('update:modelValue', val);

    searchItems(val);
};

/**
 * On manual focus
 */
const onFocus = () => {
    if (isReadonly.value) return;
    if (query.value.length >= 3) {
        if (results.value.length > 0) {
            showDropdown.value = true;
        } else {
            searchItems(query.value);
        }
    }
};

/**
 * Keyboard Navigation
 */
const onKeyDown = () => {
    if (!showDropdown.value || results.value.length === 0) return;
    if (selectedIndex.value < results.value.length - 1) {
        selectedIndex.value++;
        scrollToSelected();
    }
};

const onKeyUp = () => {
    if (!showDropdown.value || results.value.length === 0) return;
    if (selectedIndex.value > 0) {
        selectedIndex.value--;
        scrollToSelected();
    }
};

const onKeyEnter = () => {
    if (!showDropdown.value) return;
    if (selectedIndex.value >= 0 && selectedIndex.value < results.value.length) {
        selectItem(results.value[selectedIndex.value]);
    } else {
        // If they just hit enter without selecting an autocomplete option
        showDropdown.value = false;
    }
};

const scrollToSelected = () => {
    setTimeout(() => {
        if (!listRef.value) return;
        const items = listRef.value.querySelectorAll('.dropdown-item');
        const activeItem = items[selectedIndex.value] as HTMLElement;
        if (activeItem) {
            const container = listRef.value;
            const itemTop = activeItem.offsetTop;
            const itemBottom = itemTop + activeItem.offsetHeight;
            const containerTop = container.scrollTop;
            const containerBottom = containerTop + container.clientHeight;

            if (itemTop < containerTop) {
                container.scrollTop = itemTop;
            } else if (itemBottom > containerBottom) {
                container.scrollTop = itemBottom - container.clientHeight;
            }
        }
    }, 10);
};

// Close dropdown on outside click
const closeDropdown = () => {
    setTimeout(() => {
        showDropdown.value = false;
        selectedIndex.value = -1;
    }, 200);
};
</script>

<template>
    <BaseField :field="field" :error="error" class="autocomplete-wrapper">
        <div class="input-with-dropdown">
            <input
                :id="`input_${field.id}`"
                :value="query"
                @input="onInput"
                @focus="onFocus"
                @blur="closeDropdown"
                @keydown.down.prevent="onKeyDown"
                @keydown.up.prevent="onKeyUp"
                @keydown.enter.prevent="onKeyEnter"
                @keydown.esc="closeDropdown"
                class="gf-input"
                :class="{ 'gf-readonly': isReadonly }"
                :placeholder="field.placeholder || ''"
                autocomplete="off"
                :readonly="isReadonly"
                :type="field.inputType || 'text'"
            />

            <div v-show="isSearching" class="search-loader"></div>

            <transition name="fade">
                <ul
                    v-if="showDropdown"
                    class="autocomplete-dropdown glass-panel"
                    @mousedown.prevent
                    ref="listRef"
                >
                    <li
                        v-for="(item, index) in results"
                        :key="index"
                        @mousedown="selectItem(item)"
                        class="dropdown-item"
                        :class="{ 'is-active': selectedIndex === index }"
                    >
                        <span class="company">{{ item.text }}</span>
                    </li>
                </ul>
            </transition>
        </div>
    </BaseField>
</template>

<style scoped>
.gf-input {
    border-radius: 5px;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
    border: 1px solid transparent;
    padding: 10px 15px;
    min-height: 43px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    width: 100%;
    color: rgb(17, 35, 55);
}

.gf-input:not(.gf-readonly):focus {
    outline: none;
    box-shadow: 0 0 12px 0 rgba(111, 1, 255, 0.32);
}

.gf-readonly {
    background:
        linear-gradient(#f8fbff, #f8fbff) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
    cursor: not-allowed;
    color: rgb(100, 100, 100);
}

.autocomplete-wrapper {
    position: relative;
}

.input-with-dropdown {
    position: relative;
    width: 100%;
}

.search-loader {
    position: absolute;
    right: 12px;
    top: 12px;
    width: 18px;
    height: 18px;
    border: 2px solid var(--bs-primary, #6f01ff);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 1000;
    padding: 0;
    margin-top: 2px;
    max-height: 300px;
    overflow-y: auto;
    border-radius: 6px;
    background: white;
    border: 1px solid #e2e8f0;
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
    list-style-type: none;
}

.dropdown-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    transition: all 0.2s;
    color: #1e293b;
}

.dropdown-item:hover,
.dropdown-item.is-active {
    background: #f1f5f9;
}

.company {
    font-size: 0.95rem;
}

.fade-enter-active,
.fade-leave-active {
    transition:
        opacity 0.2s,
        transform 0.2s;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}

/* Custom scrollbar */
.autocomplete-dropdown::-webkit-scrollbar {
    width: 8px;
}
.autocomplete-dropdown::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
}
</style>
