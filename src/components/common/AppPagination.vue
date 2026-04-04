<script setup lang="ts">
import { computed } from 'vue';
import { ArrowNext, ArrowPrev } from '@/components/SVG';
import type { PaginationMeta } from '@/api/types';

interface Props {
    meta: PaginationMeta;
    perPageOptions?: number[];
    ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
    perPageOptions: () => [3, 10, 20, 50],
    ariaLabel: 'Pagination'
});

const emit = defineEmits<{
    (e: 'change', page: number): void;
    (e: 'update:perPage', value: number): void;
}>();

const page = computed(() => props.meta.page);
const perPage = computed({
    get: () => props.meta.per_page,
    set: (val: number) => emit('update:perPage', val)
});

const paginationPages = computed(() => {
    const current = props.meta.page;
    const total = props.meta.total_pages;

    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = new Set([1, total, current]);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.add(i);
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const result: (number | string)[] = [];

    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
            result.push('…');
        }
        result.push(sorted[i]);
    }

    return result;
});

function goToPage(p: number) {
    emit('change', p);
}
</script>

<template>
    <nav class="users-pagination" :aria-label="ariaLabel">
        <div class="users-pagination__meta" aria-live="polite">
            Showing {{ Math.min((meta.page - 1) * meta.per_page + 1, meta.total) }}–{{
                Math.min(meta.page * meta.per_page, meta.total)
            }}
            of {{ meta.total }}
        </div>
        <div class="users-pagination__controls" v-if="meta.total_pages > 1">
            <button
                class="pagination-btn pagination-btn--nav"
                :disabled="page <= 1"
                @click="goToPage(page - 1)"
                aria-label="Previous page"
            >
                <ArrowPrev />
            </button>
            <span v-for="p in paginationPages" :key="p">
                <span v-if="p === '…'" class="pagination-ellipsis">…</span>
                <button
                    v-else
                    class="pagination-btn"
                    :class="{ 'is-active': p === page }"
                    @click="goToPage(p as number)"
                >
                    {{ p }}
                </button>
            </span>
            <button
                class="pagination-btn pagination-btn--nav"
                :disabled="page >= meta.total_pages"
                @click="goToPage(page + 1)"
                aria-label="Next page"
            >
                <ArrowNext />
            </button>
        </div>
        <div class="users-pagination__perpage">
            <label for="usersPerPage" class="visually-hidden">Rows per page</label>
            <select id="usersPerPage" v-model="perPage" class="form-select form-select-sm">
                <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <span class="users-pagination__perpage-label">per page</span>
        </div>
    </nav>
</template>
