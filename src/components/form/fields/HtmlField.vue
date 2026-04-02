<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { GFField } from '@/form-engine/types.ts';
import { useCaseFormStore } from '@/form-engine/useFormStore.ts';
import Chart from 'chart.js/auto';
import type { ChartOptions, TooltipItem, ChartData } from 'chart.js';

defineProps<{
    field: GFField;
}>();

const store = useCaseFormStore();
const htmlContainer = ref<HTMLElement | null>(null);

let toolLifeChart: Chart<'bar'> | null = null;
let costChart: Chart<'bar'> | null = null;
let cycleTimeChart: Chart<'bar'> | null = null;

function parseGFNumber(val: unknown): number {
    if (val === null || val === undefined || val === '') return 0;
    return parseFloat(String(val).replace(/,/g, '')) || 0;
}

// ── Tool Life Chart ──
const TOOL_LIFE_MAP: Record<string, { ex: string; sug: string }> = {
    Components: { ex: '42', sug: '155' },
    Meters: { ex: '43', sug: '156' },
    Minutes: { ex: '44', sug: '157' }
};

function getUnitLabel(unit: string) {
    const map: Record<string, string> = {
        Components: 'No. of Components',
        Meters: 'Meters',
        Minutes: 'Minutes'
    };
    return map[unit] || unit;
}

function updateToolLifeChart() {
    if (!htmlContainer.value) return;
    const canvas = htmlContainer.value.querySelector('#hm-canvas-tool-life') as HTMLCanvasElement;
    if (!canvas) return;

    const uEx = String(store.values['200'] || 'Components');
    const uSug = String(store.values['201'] || 'Components');

    const mappedEx = TOOL_LIFE_MAP[uEx] || TOOL_LIFE_MAP.Components;
    const mappedSug = TOOL_LIFE_MAP[uSug] || TOOL_LIFE_MAP.Components;

    const valEx = parseGFNumber(store.values[mappedEx.ex]);
    const valSug = parseGFNumber(store.values[mappedSug.sug]);

    const sameUnit = uEx === uSug;
    const yLabel = sameUnit ? getUnitLabel(uEx) : 'Value (different units — see labels)';

    const labelEx = `Before (${getUnitLabel(uEx)})`;
    const labelSug = `After (${getUnitLabel(uSug)})`;

    // warning block
    const existingWarning = htmlContainer.value.querySelector('#hm-tool-life-unit-warning');
    if (!sameUnit) {
        if (!existingWarning) {
            const warningHtml = `<div id="hm-tool-life-unit-warning" style="color:#b45309;background:#fef3c7;border:1px solid #fcd34d;border-radius:4px;padding:6px 10px;margin-bottom:8px;font-size:13px;">⚠ Existing and Suggested use different units. Values are not directly comparable.</div>`;
            const graphDiv = htmlContainer.value.querySelector('#hm-graph-tool-life');
            if (graphDiv) graphDiv.insertAdjacentHTML('afterbegin', warningHtml);
        }
    } else {
        if (existingWarning) existingWarning.remove();
    }

    const chartData: ChartData<'bar'> = {
        labels: [labelEx, labelSug],
        datasets: [
            {
                label: 'Tool Life',
                data: [valEx, valSug],
                backgroundColor: ['rgba(149, 144, 220, 0.75)', 'rgba(149, 144, 220, 0.75)'],
                borderColor: ['rgba(100, 95, 180, 1)', 'rgba(100, 95, 180, 1)'],
                borderWidth: 1,
                borderRadius: 4
            }
        ]
    };

    const chartOptions: ChartOptions<'bar'> = {
        responsive: true,
        animation: { duration: 300 },
        plugins: {
            title: {
                display: true,
                text: 'Tool Life Comparison',
                font: { size: 14, weight: 'bold' as const }
            },
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (ctx: TooltipItem<'bar'>) {
                        const unit = ctx.dataIndex === 0 ? getUnitLabel(uEx) : getUnitLabel(uSug);
                        return ` ${(ctx.parsed.y ?? 0).toLocaleString('en-IN')} ${unit}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: yLabel },
                ticks: {
                    callback: function (val: string | number) {
                        return val.toLocaleString('en-IN');
                    }
                }
            },
            x: { grid: { display: false } }
        }
    };

    if (toolLifeChart) {
        toolLifeChart.data = chartData;
        toolLifeChart.options = chartOptions;
        toolLifeChart.update();
    } else {
        toolLifeChart = new Chart(canvas.getContext('2d')!, {
            type: 'bar',
            data: chartData,
            options: chartOptions
        });
    }
}

// ── Cost Saving Chart ──
function updateCostSavingChart() {
    if (!htmlContainer.value) return;
    const canvas = htmlContainer.value.querySelector('#hm-canvas-cost-saving') as HTMLCanvasElement;
    if (!canvas) return;

    const valBefore = parseGFNumber(store.values['116']);
    const valAfter = parseGFNumber(store.values['188']);

    const chartData: ChartData<'bar'> = {
        labels: ['Before (Existing)', 'After (Suggested)'],
        datasets: [
            {
                label: 'Estimated Annual Cost (INR)',
                data: [valBefore, valAfter],
                backgroundColor: ['rgba(149, 144, 220, 0.75)', 'rgba(149, 144, 220, 0.75)'],
                borderColor: ['rgba(100, 95, 180, 1)', 'rgba(100, 95, 180, 1)'],
                borderWidth: 1,
                borderRadius: 4
            }
        ]
    };

    const chartOptions: ChartOptions<'bar'> = {
        responsive: true,
        animation: { duration: 300 },
        plugins: {
            title: {
                display: true,
                text: 'Cost Savings Graph',
                font: { size: 14, weight: 'bold' as const }
            },
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (ctx: TooltipItem<'bar'>) {
                        return ` INR ${(ctx.parsed.y ?? 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                        })}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Cost (INR)' },
                ticks: {
                    callback: function (val: string | number) {
                        return val.toLocaleString('en-IN');
                    }
                }
            },
            x: { grid: { display: false } }
        }
    };

    if (costChart) {
        costChart.data = chartData;
        costChart.options = chartOptions;
        costChart.update();
    } else {
        costChart = new Chart(canvas.getContext('2d')!, {
            type: 'bar',
            data: chartData,
            options: chartOptions
        });
    }
}

// ── Cycle Time Chart ──
function updateCycleTimeChart() {
    if (!htmlContainer.value) return;
    const canvas = htmlContainer.value.querySelector('#hm-canvas-cycle-time') as HTMLCanvasElement;
    if (!canvas) return;

    const valBefore = parseGFNumber(store.values['56']);
    const valAfter = parseGFNumber(store.values['170']);

    const chartData: ChartData<'bar'> = {
        labels: ['Before (Existing)', 'After (Suggested)'],
        datasets: [
            {
                label: 'Cycle Time',
                data: [valBefore, valAfter],
                backgroundColor: ['rgba(149, 144, 220, 0.75)', 'rgba(149, 144, 220, 0.75)'],
                borderColor: ['rgba(100, 95, 180, 1)', 'rgba(100, 95, 180, 1)'],
                borderWidth: 1,
                borderRadius: 4
            }
        ]
    };

    const chartOptions: ChartOptions<'bar'> = {
        responsive: true,
        animation: { duration: 300 },
        plugins: {
            title: {
                display: true,
                text: 'Cycle Time Improvement',
                font: { size: 14, weight: 'bold' as const }
            },
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (ctx: TooltipItem<'bar'>) {
                        return ` ${(ctx.parsed.y ?? 0).toLocaleString('en-IN')} min`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Time (min)' },
                ticks: {
                    callback: function (val: string | number) {
                        return val.toLocaleString('en-IN');
                    }
                }
            },
            x: { grid: { display: false } }
        }
    };

    if (cycleTimeChart) {
        cycleTimeChart.data = chartData;
        cycleTimeChart.options = chartOptions;
        cycleTimeChart.update();
    } else {
        cycleTimeChart = new Chart(canvas.getContext('2d')!, {
            type: 'bar',
            data: chartData,
            options: chartOptions
        });
    }
}

function updateCharts() {
    updateToolLifeChart();
    updateCostSavingChart();
    updateCycleTimeChart();
}

onMounted(() => {
    nextTick(() => {
        updateCharts();
    });
});

onUnmounted(() => {
    if (toolLifeChart) toolLifeChart.destroy();
    if (costChart) costChart.destroy();
    if (cycleTimeChart) cycleTimeChart.destroy();
});

// Watch all store values to re-draw charts if dependent values change
watch(
    () => store.values,
    () => {
        // Debounce or just update straight away since there's animation
        updateCharts();
    },
    { deep: true }
);
</script>

<template>
    <div class="gf-html" ref="htmlContainer" v-html="field.content"></div>
</template>

<style scoped>
.gf-html {
    margin: 1rem 0;
    width: 100%;
}
</style>
