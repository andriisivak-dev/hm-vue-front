export interface FormFieldChoice {
    text: string;
    value: string;
    isSelected: boolean;
}

export interface FormField {
    id: number;
    label: string;
    type: string;
    adminLabel?: string;
    isRequired: boolean;
    choices?: FormFieldChoice[];
    cssClass?: string;
    size?: string;
    pageNumber?: number;
}

export interface FormSchema {
    id: number;
    title: string;
    fields: FormField[];
    pagination?: {
        style: string;
        pages: string[];
    };
}
