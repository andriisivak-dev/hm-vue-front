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
  operator: 'is' | 'isnot' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with';
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
  isSelected: boolean;
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

export interface GFField {
  id: number | string;
  type: string;
  inputType?: string;
  label: string;
  adminLabel?: string;
  description?: string;
  cssClass?: string;
  isRequired: boolean;
  isHidden: boolean;
  visibility: 'visible' | 'hidden';
  size: 'small' | 'medium' | 'large';
  placeholder?: string;
  defaultValue?: string;
  conditionalLogic?: GFConditionalLogic | null;
  inputs?: GFInput[] | null;
  choices?: GFChoice[] | null;
  calculation?: GFCalculation | null;
  validation: GFValidation;
  // Type-specific extras
  content?: string; // for html field
  nextButton?: { text: string } | null;
  previousButton?: { text: string } | null;
  pageNumber?: number; // locally calculated
  [key: string]: any;
}

export interface GFForm {
  form_id: number;
  form_title: string;
  field_count: number;
  fields: GFField[];
}

export interface GFEntry {
  entry_id: number;
  form_id: string;
  date_created: string;
  created_by: string;
  fields: Record<string, any>;
}
