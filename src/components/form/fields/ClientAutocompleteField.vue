<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { GFField } from '@/form-engine/types.ts';
import { useCaseFormStore } from '@/form-engine/useFormStore.ts';
import { useUserStore } from '@/stores/user.ts';
import BaseField from './BaseField.vue';
import { useDebounceFn } from '@vueuse/core';

interface ClientResult {
    id: string | number;
    company_name: string;
    city?: string;
    state?: string;
    [key: string]: unknown;
}

interface CustomWindow {
    GFConfig?: {
        restUrl?: string;
    };
}

const props = defineProps<{
    field: GFField;
    modelValue: string | number | null | undefined;
    error?: string;
}>();

const store = useCaseFormStore();
const userStore = useUserStore();
const emit = defineEmits(['update:modelValue']);

const isHidden = computed(() => {
    if (!store.isViewMode) return false;
    const user = userStore.user;
    if (!user) return false;
    // Hide if role is field agent and it is not their case
    if (user.role === 'hm_field_agent' && store.authorId !== user.id) {
        return true;
    }
    return false;
});

const query = ref(String(props.modelValue || ''));
const results = ref<ClientResult[]>([]);
const isSearching = ref(false);
const showDropdown = ref(false);
const selectedIndex = ref(-1);
const listRef = ref<HTMLElement | null>(null);

// Gravity Config from WP Localization
const win = window as unknown as CustomWindow;
const ajaxUrl = win.GFConfig?.restUrl
    ? win.GFConfig.restUrl.replace('/wp-json/hemant/v1/', '/wp-admin/admin-ajax.php')
    : '/wp-admin/admin-ajax.php';

// Target IDs as per gravity-populate.php
const TARGETS = {
    HIDDEN_ID: '99',
    CITY_ID: '2',
    STATE_ID: '4'
};

/**
 * Perform Client Search
 */
const searchClients = useDebounceFn(async (term: string) => {
    selectedIndex.value = -1;
    if (term.length < 3) {
        results.value = [];
        showDropdown.value = false;
        return;
    }

    isSearching.value = true;
    try {
        const res = await fetch(
            `${ajaxUrl}?action=csp_search_clients&term=${encodeURIComponent(term)}`
        );
        const data = await res.json();
        results.value = data || [];
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
const selectClient = (client: ClientResult) => {
    query.value = client.company_name;
    emit('update:modelValue', client.company_name);
    showDropdown.value = false;

    // Populate other fields
    store.values[TARGETS.HIDDEN_ID] = client.id;
    store.values[TARGETS.CITY_ID] = client.city || '';
    store.values[TARGETS.STATE_ID] = client.state || '';

    // Set Readonly state
    const hasLocation = !!(client.city && client.state);
    store.setFieldReadonly(TARGETS.CITY_ID, hasLocation);
    store.setFieldReadonly(TARGETS.STATE_ID, hasLocation);
};

/**
 * On manual typing
 */
const onInput = (e: Event) => {
    if (isReadonly.value) return;

    const val = (e.target as HTMLInputElement).value;
    query.value = val;
    emit('update:modelValue', val);

    // Clear hidden ID and unlock fields
    store.values[TARGETS.HIDDEN_ID] = '';
    store.setFieldReadonly(TARGETS.CITY_ID, false);
    store.setFieldReadonly(TARGETS.STATE_ID, false);

    searchClients(val);
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
            searchClients(query.value);
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
        selectClient(results.value[selectedIndex.value]);
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

/**
 * Preload logic (if entry data exists)
 */
onMounted(async () => {
    const hiddenId = store.values[TARGETS.HIDDEN_ID];
    if (hiddenId) {
        try {
            const res = await fetch(`${ajaxUrl}?action=csp_get_client_location&id=${hiddenId}`);
            const json = await res.json();
            if (json.success && json.data) {
                const { city, state } = json.data;
                store.values[TARGETS.CITY_ID] = city || '';
                store.values[TARGETS.STATE_ID] = state || '';
                const hasLoc = !!(city && state);
                store.setFieldReadonly(TARGETS.CITY_ID, hasLoc);
                store.setFieldReadonly(TARGETS.STATE_ID, hasLoc);
            }
        } catch (err) {
            console.error('Preload error:', err);
        }
    }
});

const isReadonly = computed(() => {
    return store.isFieldReadonly(props.field.id);
});

// Close dropdown on outside click
const closeDropdown = () => {
    setTimeout(() => {
        showDropdown.value = false;
        selectedIndex.value = -1;
    }, 200);
};
</script>

<template>
    <BaseField :field="field" :error="error" class="autocomplete-wrapper" v-if="!isHidden">
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
                :placeholder="field.placeholder || 'Start typing to search...'"
                autocomplete="off"
                :readonly="isReadonly"
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
                        :key="item.id"
                        @mousedown="selectClient(item)"
                        class="dropdown-item"
                        :class="{ 'is-active': selectedIndex === index }"
                    >
                        <span class="company">{{ item.company_name }}</span>
                        <span class="location" v-if="item.city"
                            >{{ item.city }}, {{ item.state }}</span
                        >
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
    background: #f1f5f9 !important;
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
    width: 20px;
    height: 20px;
    border: 2px solid var(--accent-bg);
    border-top-color: var(--accent);
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
    max-height: 350px;
    overflow-y: auto;
    border-radius: 6px;
    background:
        linear-gradient(white, white) padding-box,
        linear-gradient(185deg, #f7931d 0%, #262469 100%) border-box;
    border: 1px solid transparent;
    box-shadow: 0 0 12px 0 rgba(111, 1, 255, 0.32);
}

.dropdown-item {
    padding: 4px 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    transition: all 0.2s;
}

.dropdown-item:hover,
.dropdown-item.is-active {
    background: #d1d1d1;
}

.company {
    font-weight: 600;
    font-size: 0.95rem;
}

.location {
    font-size: 0.8rem;
    opacity: 0.7;
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
    background: #262469;
    border-radius: 10px;
}
</style>
