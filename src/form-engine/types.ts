export interface GFValidation {
    isRequired: boolean;
    customMessage?: string;
    rangeMin?: string | number | null;
    rangeMax?: string | number | null;
    numberFormat?: 'decimal_dot' | 'decimal_comma';
    maxLength?: string | number | null;
    emailConfirmEnabled?: boolean;
}

export interface GFRule {
    fieldId: string;
    operator:
        | 'is'
        | 'isnot'
        | 'greater_than'
        | 'less_than'
        | 'contains'
        | 'starts_with'
        | 'ends_with';
    value: string;
}

export interface GFConditionalLogic {
    enabled: boolean;
    actionType: 'show' | 'hide';
    logicType: 'all' | 'any';
    rules: GFRule[];
}

export interface GFChoice {
    text: string;
    value: string;
    isSelected?: boolean; // optional
    price?: string;
    inputId?: string; // only for checkboxes
}

export interface GFInput {
    id: string;
    label: string;
    name?: string;
    placeholder?: string;
    defaultValue?: string;
    isHidden?: boolean;
}

export interface GFCalculation {
    formula: string;
    rounding?: string;
    enableCalculation: boolean;
    referencedFields: string[];
}

/**
 * GF uses a 12-column grid system.
 *
 * Common mappings:
 *   columnSpan 12 -> 100%
 *   columnSpan  6 ->  50%
 *   columnSpan  4 ->  33%
 *   columnSpan  3 ->  25%
 *   columnSpan  2 ->  16.67%
 */
export type GFGridColumnSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface GFLayout {
    columnSpan: GFGridColumnSpan;
    spacerColumnSpan: number;
    widthPercent: number;
    spacerPercent: number;
    totalColumnsUsed: number;
    isFullWidth: boolean;
    cssGridSpan: string;
    cssWidth: string;
}

export interface GFStep {
    step_number: number;
    label: string;
    fields: GFField[];
}

export interface SimpleField {
    id: string | number;
    type?: string;
    inputType?: string;
    label: string;
    description?: string;
    cssClass?: string;
    css_class?: string;
    is_required?: boolean;
    placeholder?: string;
    choices?: GFChoice[] | { text: string; value: string; isSelected?: boolean }[];
    [key: string]: unknown;
}

export type AnyField = GFField | SimpleField;

export interface GFField {
    id: number | string;
    type: string;
    inputType?: string;
    label: string;
    adminLabel?: string;
    description?: string;
    css_class?: string;
    is_required: boolean;
    is_hidden: boolean;
    visibility: 'visible' | 'hidden';
    size: 'small' | 'medium' | 'large';
    placeholder?: string;
    defaultValue?: string;
    conditional_logic?: GFConditionalLogic | null | '' | string;
    inputs?: GFInput[] | null;
    choices?: GFChoice[] | null | '' | string;
    calculation?: GFCalculation | null;
    enableCalculation?: boolean;
    numberFormat?: 'decimal_dot' | 'decimal_comma';
    validation: GFValidation;
    layout: GFLayout;
    // Type-specific extras
    multipleFiles?: boolean;
    maxFiles?: number | string;
    maxFileSize?: number | string;
    allowedExtensions?: string;
    content?: string; // for html field
    nextButton?: { text: string } | null;
    previousButton?: { text: string } | null;
    pageNumber?: number; // locally calculated
    [key: string]: unknown;
}

export interface GFForm {
    form_id: number;
    form_title: string;
    total_steps: number;
    steps: GFStep[];
    non_data_field_types: string[];
}

export interface GFEntry {
    entry_id: number;
    form_id: string;
    date_created: string;
    created_by: string;
    fields: Record<string, unknown>;
}

/**
 * Groups fields in a step into rows based on their totalColumnsUsed,
 * matching how GF wraps fields visually (each row sums to ≤ 12 columns).
 */
export type GFFieldRow = GFField[];
export type GroupFieldsIntoRows = (fields: GFField[]) => GFFieldRow[];
