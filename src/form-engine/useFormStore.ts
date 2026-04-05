import { defineStore } from 'pinia';
import type { GFForm, GFField, GFEntry, GFConditionalLogic, AnyField } from './types';
import { LogicEngine } from './LogicEngine';
import { FormulaEngine } from './FormulaEngine';
import { FIELD_IDS } from '../stores/constants.ts';

export const useCaseFormStore = defineStore('caseForm', {
    state: () => ({
        form: null as GFForm | null,
        _allFields: [] as GFField[],
        _fieldMap: new Map<string, GFField>() as Map<string, GFField>,
        values: {} as Record<string, unknown>,
        readonlyFields: {} as Record<string, boolean>, // fieldId -> boolean
        currentStep: 1,
        /** The farthest step the user has legitimately reached via Next-button flow */
        highestReachedStep: 1,
        isInitialized: false,
        isLoading: false,

        // ── Case state ────────────────────────────────────────────────────────
        /** ID of the WP case post currently being edited (null = not yet created) */
        caseId: null as number | null,
        /** ID of the user who authored the case */
        authorId: null as number | null,
        /** True if the form should be completely read-only */
        isViewMode: false,
        /** True while an async save/submit is in flight */
        isSaving: false,
        /** Human-readable error from the last save attempt */
        saveError: null as string | null,
        /** True after the case has been successfully submitted (status = in_review) */
        isSubmitted: false,
        /** Flag to prevent infinite loops during VC/RPM mutual calculations */
        isUpdatingVCRPM: false
    }),

    getters: {
        /**
         * Determine if a field is readonly (calculation OR manual)
         */
        isFieldReadonly: (state) => (fieldId: string | number) => {
            if (state.isViewMode) return true;
            const field = state._allFields.find((f) => String(f.id) === String(fieldId));
            if (field?.calculation?.enableCalculation) return true;
            return !!state.readonlyFields[String(fieldId)];
        },
        /**
         * Total number of pages in the form
         */
        totalPages: (state) => {
            if (!state.form) return 0;
            return state.form.total_steps;
        },

        /**
         * Fields belonging ONLY to the current step
         */
        currentStepFields: (state) => {
            if (!state.form) return [];
            const step = state.form.steps.find((s) => s.step_number === state.currentStep);
            return step?.fields ?? [];
        },

        /**
         * All form values (read-only for external exposure)
         */
        formValues: (state) => state.values,

        /**
         * Get field visibility by ID (reactive)
         */
        isFieldVisible: (state) => (fieldId: string | number) => {
            const field = state._fieldMap.get(String(fieldId));
            if (!field) return false;
            if (field.visibility === 'hidden') return false;
            return LogicEngine.shouldShow(
                field.conditional_logic as GFConditionalLogic,
                state.values
            );
        },

        /**
         * Flat snapshot of current values suitable for sending to the API.
         * Only includes non-empty values; page-break fields are excluded.
         */
        formDataSnapshot: (state): Record<string, unknown> => {
            const snapshot: Record<string, unknown> = {};
            Object.entries(state.values).forEach(([k, v]) => {
                const isPage = state._allFields.find(
                    (f) => String(f.id) === k && f.type === 'page'
                );
                if (isPage) return;
                snapshot[k] = v;
            });
            return snapshot;
        },

        /**
         * Get formatting for field labels based on form logic
         * Specific rule: remove "(Suggested)" if field 20 strictly equals "New Development"
         */
        getFormattedLabel:
            (state) =>
            (field: AnyField): string => {
                const rawLabel = field.label || '';
                const mode = String(state.values[FIELD_IDS.TOOL_MODE] || '').trim();

                if (mode === 'New Development' && rawLabel.includes('(Suggested)')) {
                    // Accurately strip "(Suggested)" with its parentheses and any surrounding spaces
                    return rawLabel.replace(/\s*\(\s*Suggested\s*\)\s*/i, ' ').trim();
                }

                return rawLabel;
            }
    },

    actions: {
        /**
         * Set a field as manually readonly or not
         */
        setFieldReadonly(fieldId: string | number, isReadonly: boolean) {
            this.readonlyFields[String(fieldId)] = isReadonly;
        },

        setViewMode(mode: boolean) {
            this.isViewMode = mode;
        },

        /**
         * Initialize form schema and set default values.
         * Resets all case state.
         */
        initialize(form: GFForm) {
            this.form = form;
            this._allFields = form.steps.flatMap((s) => s.fields);
            this._fieldMap = new Map(this._allFields.map((f) => [String(f.id), f]));
            const initialValues: Record<string, unknown> = {};
            this.readonlyFields = {};

            this._allFields.forEach((field) => {
                if (field.defaultValue !== undefined) {
                    initialValues[String(field.id)] = field.defaultValue;
                } else if (field.type === 'checkbox') {
                    if (field.inputs) {
                        field.inputs.forEach((input) => {
                            initialValues[input.id] = '';
                        });
                    }
                } else {
                    initialValues[String(field.id)] = '';
                }
            });

            this.values = initialValues;
            this.isInitialized = true;
            this.currentStep = 1;
            this.highestReachedStep = 1;
            this.saveError = null;
            this.isSubmitted = false;
            this.caseId = null;
            this.authorId = null;
            this.isViewMode = false;

            this.recalculateAll();
            this.initVCRPMCalculations();
        },

        /**
         * Hydrate form with data from a specific GF entry (legacy path).
         */
        hydrate(entry: GFEntry) {
            if (!this.form) return;

            // const allFields = this.form.steps.flatMap((s) => s.fields);
            // const allFieldIds = new Set(allFields.map((f) => String(f.id)));
            //
            // allFields.forEach((f) => {
            //     if (f.inputs) {
            //         f.inputs.forEach((input) => allFieldIds.add(input.id));
            //     }
            // });

            Object.entries(entry.fields).forEach(([key, value]) => {
                let processedValue = value;

                if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                    try {
                        processedValue = JSON.parse(value);
                    } catch {
                        // Not a JSON, keep as is
                    }
                }

                this.values[key] = processedValue;
            });

            this.recalculateAll();
            this.initVCRPMCalculations();
        },

        /**
         * Hydrate form with data from `hm_form_data` (new path).
         * The payload is a flat { field_id: value } map already decoded from JSON.
         */
        hydrateFromFormData(formData: Record<string, unknown>) {
            if (!this.form) return;

            Object.entries(formData).forEach(([key, value]) => {
                let processedValue = value;

                // Handle JSON strings for file uploads/arrays
                if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                    try {
                        processedValue = JSON.parse(value);
                    } catch {
                        // keep as-is
                    }
                }

                this.values[key] = processedValue;
            });

            this.recalculateAll();
            this.initVCRPMCalculations();
        },

        /**
         * Update a single field value and trigger dependent logic.
         * If the user edits a field while on a step *below* the highest
         * reached step, the forward-progress watermark is rolled back to
         * the current step — forcing re-validation of all subsequent steps.
         */
        updateValue(fieldId: string | number, value: unknown) {
            this.values[String(fieldId)] = value;

            // Roll back progress watermark if the user is editing a past step
            if (this.currentStep < this.highestReachedStep) {
                this.highestReachedStep = this.currentStep;
            }

            // Trigger VC/RPM mathematical mutual dependency calculation
            this.handleVCRPMCalculation(String(fieldId));

            // Cascade: recalculate all formulas because they could depend on this value
            this.recalculateAll();
        },

        /**
         * Initialize VC/RPM mutual calculation on data load
         */
        initVCRPMCalculations() {
            if (
                this.values[FIELD_IDS.EXIST_DIA] !== undefined &&
                this.values[FIELD_IDS.EXIST_DIA] !== ''
            ) {
                this.handleVCRPMCalculation(FIELD_IDS.EXIST_DIA);
            }
            if (
                this.values[FIELD_IDS.SUG_DIA] !== undefined &&
                this.values[FIELD_IDS.SUG_DIA] !== ''
            ) {
                this.handleVCRPMCalculation(FIELD_IDS.SUG_DIA);
            }
        },

        /**
         * Handle custom mutual calculation for VC and RPM specific fields
         */
        handleVCRPMCalculation(fieldId: string) {
            if (this.isUpdatingVCRPM) return;

            // Existing operation
            const existVc = FIELD_IDS.EXIST_VC,
                existRpm = FIELD_IDS.EXIST_RPM,
                existDia = FIELD_IDS.EXIST_DIA;

            if ([existVc, existRpm, existDia].includes(fieldId)) {
                this.isUpdatingVCRPM = true;
                this.calculateVCRPMGroup(existVc, existRpm, existDia, fieldId);
                this.isUpdatingVCRPM = false;
            }

            // Suggested operation
            const sugVc = FIELD_IDS.SUG_VC,
                sugRpm = FIELD_IDS.SUG_RPM,
                sugDia = FIELD_IDS.SUG_DIA;

            if ([sugVc, sugRpm, sugDia].includes(fieldId)) {
                this.isUpdatingVCRPM = true;
                this.calculateVCRPMGroup(sugVc, sugRpm, sugDia, fieldId);
                this.isUpdatingVCRPM = false;
            }
        },

        /**
         * Perform VC / RPM physics calculation for the given group
         */
        calculateVCRPMGroup(vcId: string, rpmId: string, diaId: string, triggerId: string) {
            const PI = Math.PI;

            const vcRaw = this.values[vcId];
            const rpmRaw = this.values[rpmId];
            const diaRaw = this.values[diaId];

            let dia = parseFloat(String(diaRaw)) || 1;
            if (dia <= 0) dia = 1;

            if (triggerId === vcId) {
                const vc = parseFloat(String(vcRaw)) || 0;
                const rpm = (vc * 1000) / (PI * dia);
                this.values[rpmId] = rpm.toFixed(1);
            } else if (triggerId === rpmId) {
                const rpm = parseFloat(String(rpmRaw)) || 0;
                const vc = (rpm * PI * dia) / 1000;
                this.values[vcId] = vc.toFixed(2);
            } else if (triggerId === diaId) {
                if (vcRaw !== '' && vcRaw !== undefined && vcRaw !== null) {
                    const vc = parseFloat(String(vcRaw)) || 0;
                    const rpm = (vc * 1000) / (PI * dia);
                    this.values[rpmId] = rpm.toFixed(1);
                } else if (rpmRaw !== '' && rpmRaw !== undefined && rpmRaw !== null) {
                    const rpm = parseFloat(String(rpmRaw)) || 0;
                    const vc = (rpm * PI * dia) / 1000;
                    this.values[vcId] = vc.toFixed(2);
                }
            }
        },

        /**
         * Logic recalculation hub
         */
        recalculateAll() {
            if (!this.form) return;

            this._allFields.forEach((field) => {
                if (field.calculation?.enableCalculation) {
                    const result = FormulaEngine.calculate(field.calculation, this.values);
                    this.values[String(field.id)] = result;
                }
            });
        },

        /**
         * Step navigation
         */
        nextStep() {
            if (this.currentStep < this.totalPages) {
                this.currentStep++;
                // Advance the watermark when the user reaches a new step
                if (!this.isViewMode && this.currentStep > this.highestReachedStep) {
                    this.highestReachedStep = this.currentStep;
                }
            }
        },

        prevStep() {
            if (this.currentStep > 1) {
                this.currentStep--;
            }
        },

        /**
         * Navigate to an arbitrary step.
         * Forward jumps are only allowed up to highestReachedStep.
         * Backward jumps are always permitted.
         */
        setStep(step: number) {
            if (step < 1 || step > this.totalPages) return;
            if (!this.isViewMode && step > this.highestReachedStep) return; // blocked — not yet reached
            this.currentStep = step;
        },

        /**
         * Called when loading an existing case to restore progress state.
         * Allows the store to reflect the watermark gathered from the backend.
         */
        setHighestReachedStep(step: number) {
            if (step >= 1 && step <= this.totalPages) {
                this.highestReachedStep = step;
            }
        },

        /** Store the WP case post ID after async creation */
        setCaseId(id: number | null) {
            this.caseId = id;
        },

        clearSaveError() {
            this.saveError = null;
        }
    }
});
