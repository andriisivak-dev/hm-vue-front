<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { GFField } from '../../../form-engine/types'
import { useCaseFormStore } from '../../../form-engine/useFormStore'
import BaseField from './BaseField.vue'
import { useDebounceFn } from '@vueuse/core'

const props = defineProps<{
  field: GFField
  modelValue: any
  error?: string
}>()

const store = useCaseFormStore()
const emit = defineEmits(['update:modelValue'])

const query = ref(props.modelValue || '')
const results = ref<any[]>([])
const isSearching = ref(false)
const showDropdown = ref(false)

// Gravity Config from WP Localization
const ajaxUrl = (window as any).GFConfig?.restUrl 
  ? (window as any).GFConfig.restUrl.replace('/wp-json/hemant/v1/', '/wp-admin/admin-ajax.php')
  : '/wp-admin/admin-ajax.php'

// Target IDs as per gravity-populate.php
const TARGETS = {
  HIDDEN_ID: '99',
  CITY_ID: '2',
  STATE_ID: '4'
}

/**
 * Perform Client Search
 */
const searchClients = useDebounceFn(async (term: string) => {
  if (term.length < 3) {
    results.value = []
    showDropdown.value = false
    return
  }

  isSearching.value = true
  try {
    const res = await fetch(`${ajaxUrl}?action=csp_search_clients&term=${encodeURIComponent(term)}`)
    const data = await res.json()
    results.value = data || []
    showDropdown.value = results.value.length > 0
  } catch (err) {
    console.error('Autocomplete error:', err)
  } finally {
    isSearching.value = false
  }
}, 300)

/**
 * Handle Selection
 */
const selectClient = (client: any) => {
  query.value = client.company_name
  emit('update:modelValue', client.company_name)
  showDropdown.value = false

  // Populate other fields
  store.values[TARGETS.HIDDEN_ID] = client.id
  store.values[TARGETS.CITY_ID] = client.city || ''
  store.values[TARGETS.STATE_ID] = client.state || ''

  // Set Readonly state
  const hasLocation = !!(client.city && client.state)
  store.setFieldReadonly(TARGETS.CITY_ID, hasLocation)
  store.setFieldReadonly(TARGETS.STATE_ID, hasLocation)
}

/**
 * On manual typing
 */
const onInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  query.value = val
  emit('update:modelValue', val)
  
  // Clear hidden ID and unlock fields
  store.values[TARGETS.HIDDEN_ID] = ''
  store.setFieldReadonly(TARGETS.CITY_ID, false)
  store.setFieldReadonly(TARGETS.STATE_ID, false)

  searchClients(val)
}

/**
 * Preload logic (if entry data exists)
 */
onMounted(async () => {
    const hiddenId = store.values[TARGETS.HIDDEN_ID]
    if (hiddenId) {
        try {
            const res = await fetch(`${ajaxUrl}?action=csp_get_client_location&id=${hiddenId}`)
            const json = await res.json()
            if (json.success && json.data) {
                const { city, state } = json.data
                store.values[TARGETS.CITY_ID] = city || ''
                store.values[TARGETS.STATE_ID] = state || ''
                const hasLoc = !!(city && state)
                store.setFieldReadonly(TARGETS.CITY_ID, hasLoc)
                store.setFieldReadonly(TARGETS.STATE_ID, hasLoc)
            }
        } catch (err) {
            console.error('Preload error:', err)
        }
    }
})

// Close dropdown on outside click
const closeDropdown = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}
</script>

<template>
  <BaseField :field="field" :error="error" class="autocomplete-wrapper">
    <div class="input-with-dropdown">
      <input 
        :id="`input_${field.id}`"
        :value="query"
        @input="onInput"
        @blur="closeDropdown"
        class="gf-input"
        :placeholder="field.placeholder || 'Start typing to search...'"
        autocomplete="off"
      />
      
      <div v-show="isSearching" class="search-loader"></div>

      <transition name="fade">
        <ul v-if="showDropdown" class="autocomplete-dropdown glass-panel">
          <li 
            v-for="item in results" 
            :key="item.id"
            @mousedown="selectClient(item)"
            class="dropdown-item"
          >
            <span class="company">{{ item.company_name }}</span>
            <span class="location" v-if="item.city">{{ item.city }}, {{ item.state }}</span>
          </li>
        </ul>
      </transition>
    </div>
  </BaseField>
</template>

<style scoped>
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
  to { transform: rotate(360deg); }
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  margin-top: 8px;
  max-height: 250px;
  overflow-y: auto;
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  padding: 8px;
}

.dropdown-item {
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background: var(--accent-bg);
  color: var(--accent);
}

.company {
  font-weight: 600;
  font-size: 0.95rem;
}

.location {
  font-size: 0.8rem;
  opacity: 0.7;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Custom scrollbar */
.autocomplete-dropdown::-webkit-scrollbar {
  width: 6px;
}
.autocomplete-dropdown::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 10px;
}
</style>
