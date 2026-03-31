// ─────────────────────────────────────────────────────────────────────────────
// API Response envelope  (mirrors CSP\API\Responses\ApiResponse)
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
    success: true
    data: T
    message: string
    meta?: PaginationMeta
}

export interface ApiErrorResponse {
    success: false
    code: ErrorCode
    message: string
    data: unknown
}

export type ApiEnvelope<T> = ApiSuccessResponse<T> | ApiErrorResponse

export interface PaginationMeta {
    total: number
    total_pages: number
    page: number
    per_page: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Error codes  (mirrors CSP\API\Responses\ErrorCodes)
// ─────────────────────────────────────────────────────────────────────────────

export type ErrorCode =
    | 'CSP_FORBIDDEN'
    | 'CSP_UNAUTHORIZED'
    | 'CSP_NOT_FOUND'
    | 'CSP_BAD_REQUEST'
    | 'CSP_VALIDATION_ERROR'
    | 'CSP_INTERNAL_ERROR'
    | 'NETWORK_ERROR'
    | 'ABORT_ERROR'

// ─────────────────────────────────────────────────────────────────────────────
// Domain: Case  (mirrors DTOMapper.toCaseListItem / toCaseDetail)
// ─────────────────────────────────────────────────────────────────────────────

export type CaseStatus = 'draft' | 'in_review' | 'returned' | 'approved' | 'rejected'

export interface CaseAuthor {
    id: number
    full_name: string
    role: string
}

export interface CaseReviewer {
    id: number
    full_name: string
    role?: string
}

export interface TaxonomyTerm {
    term_id: number
    name: string
    slug: string
    count?: number
}

export interface ReviewHistoryEntry {
    action: string
    actor_id: number
    actor_name: string
    message?: string
    date: string
}

export interface CaseListItem {
    id: number
    title: string
    status: CaseStatus
    progress: number
    current_step: number
    total_steps: number
    author: CaseAuthor | null
    reviewer: CaseReviewer | null
    created_at: string
    updated_at: string
    submitted_at: string | null
    // Dynamic taxonomy / meta fields injected by FormFieldMap
    [key: string]: unknown
}

export interface CasePermissions {
    can_edit: boolean
    can_submit: boolean
    can_approve: boolean
    can_reject: boolean
    can_return: boolean
    can_delete: boolean
    can_override_status: boolean
}

export interface CaseDetail {
    id: number
    title: string
    status: CaseStatus
    progress: number
    current_step: number
    total_steps: number
    gf_form_id: number
    form_data: Record<string, unknown>
    taxonomies: Record<string, TaxonomyTerm[]>
    meta_fields: Record<string, unknown>
    author: CaseAuthor | null
    reviewer: CaseReviewer | null
    review_message: string | null
    review_history: ReviewHistoryEntry[]
    permissions: CasePermissions
    created_at: string
    updated_at: string
    submitted_at: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain: User  (mirrors DTOMapper.toUser)
// ─────────────────────────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'inactive'
export type UserRole = 'administrator' | 'hm_administrator' | 'hm_manager' | 'hm_marketing' | 'hm_field_agent'

export interface UserSupervisor {
    id: number
    full_name: string
}

export interface UserCasesCount {
    total: number
    draft: number
    in_review: number
    approved: number
}

export interface User {
    id: number
    full_name: string
    email: string
    role: UserRole | string
    status: UserStatus
    avatar_url: string
    supervisor: UserSupervisor | null
    agents: number[]
    cases_count: UserCasesCount
    created_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain: Notification  (mirrors DTOMapper.toNotification)
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType = 'case_submitted' | 'case_approved' | 'case_rejected' | 'case_returned' | string

export interface Notification {
    id: number
    type: NotificationType
    case_id: number
    case_title: string
    message: string
    is_read: boolean
    created_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain: Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
    pending_review: number
    returned: number
    approved: number
    rejected: number
    draft: number
    total: number
}

export interface DashboardFilters {
    product_types: TaxonomyTerm[]
    industry_segments: TaxonomyTerm[]
    submitted_by: UserSupervisor[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain: Form Schema
// ─────────────────────────────────────────────────────────────────────────────

export interface FormFieldChoice {
    text: string
    value: string
    isSelected: boolean
}

export interface FormField {
    id: number
    label: string
    type: string
    adminLabel?: string
    isRequired: boolean
    choices?: FormFieldChoice[]
    cssClass?: string
    size?: string
    pageNumber?: number
}

export interface FormSchema {
    id: number
    title: string
    fields: FormField[]
    pagination?: {
        style: string
        pages: string[]
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Request param types
// ─────────────────────────────────────────────────────────────────────────────

export interface CaseListParams {
    page?: number
    per_page?: number
    status?: CaseStatus | CaseStatus[]
    search?: string
    submitted_by?: number
    date_from?: string
    date_to?: string
    orderby?: 'date' | 'title' | 'status'
    order?: 'asc' | 'desc'
    // Dynamic taxonomy slugs
    [key: string]: unknown
}

export interface CreateCaseBody {
    form_id: number
    total_steps?: number
}

export interface UpdateFormDataBody {
    fields: Record<string, unknown>
    current_step: number
}

export interface StatusActionBody {
    message?: string
}

export interface OverrideStatusBody {
    status: CaseStatus
    message?: string
}

export interface UserListParams {
    page?: number
    per_page?: number
    role?: UserRole | string
    status?: UserStatus
    search?: string
    orderby?: 'date' | 'name'
    order?: 'asc' | 'desc'
}

export interface NotificationListParams {
    page?: number
    per_page?: number
    is_read?: boolean
}

export interface PaginatedResult<T> {
    items: T[]
    meta: PaginationMeta
}