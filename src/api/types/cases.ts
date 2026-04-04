export type CaseStatus = 'draft' | 'in_review' | 'returned' | 'approved' | 'rejected';

export interface CaseAuthor {
    id: number;
    full_name: string;
    role: string;
}

export interface CaseReviewer {
    id: number;
    full_name: string;
    role?: string;
}

export interface TaxonomyTerm {
    term_id: number;
    name: string;
    slug: string;
    count?: number;
}

export interface ReviewHistoryEntry {
    action: string;
    actor_id: number;
    actor_name: string;
    message?: string;
    date: string;
}

export interface CaseListItem {
    id: number;
    title: string;
    status: CaseStatus;
    progress: number;
    current_step: number;
    total_steps: number;
    author: CaseAuthor | null;
    reviewer: CaseReviewer | null;
    created_at: string;
    updated_at: string;
    submitted_at: string | null;
    // Dynamic taxonomy / meta fields injected by FormFieldMap
    [key: string]: unknown;
}

export interface CasePermissions {
    can_edit: boolean;
    can_submit: boolean;
    can_approve: boolean;
    can_reject: boolean;
    can_return: boolean;
    can_delete: boolean;
    can_override_status: boolean;
}

export interface CaseDetail {
    id: number;
    title: string;
    status: CaseStatus;
    progress: number;
    current_step: number;
    total_steps: number;
    gf_form_id: number;
    form_data: Record<string, unknown>;
    taxonomies: Record<string, TaxonomyTerm[]>;
    meta_fields: Record<string, unknown>;
    author: CaseAuthor | null;
    reviewer: CaseReviewer | null;
    review_message: string | null;
    review_history: ReviewHistoryEntry[];
    permissions: CasePermissions;
    created_at: string;
    updated_at: string;
    submitted_at: string | null;
}

export interface CaseListParams {
    page?: number;
    per_page?: number;
    status?: CaseStatus | CaseStatus[];
    search?: string;
    submitted_by?: number;
    date_from?: string;
    date_to?: string;
    orderby?: 'date' | 'title' | 'status';
    order?: 'asc' | 'desc';
    // Dynamic taxonomy slugs
    [key: string]: unknown;
}

export interface CreateCaseBody {
    form_id: number;
    total_steps?: number;
}

export interface UpdateFormDataBody {
    fields: Record<string, unknown>;
    current_step: number;
}

export interface StatusActionBody {
    message?: string;
}

export interface OverrideStatusBody {
    status: CaseStatus;
    message?: string;
}
