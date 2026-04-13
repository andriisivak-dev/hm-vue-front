import type { TaxonomyTerm } from '@/api';

export interface DashboardStats {
    pending_review: number;
    returned: number;
    approved: number;
    rejected: number;
    draft: number;
    total: number;
    total_customers?: number;
    users?: {
        total: number;
        supervisors: number;
        agents: number;
        marketing: number;
    };
}

export interface FilterOption {
    id: string | number;
    name: string;
}

export interface DashboardFilters {
    statuses: FilterOption[];
    product_types: TaxonomyTerm[];
    industry_segments: TaxonomyTerm[];
    machine_types: TaxonomyTerm[];
    machine_makes: TaxonomyTerm[];
    tool_brands: TaxonomyTerm[];
    solution_types: TaxonomyTerm[];
    submitted_by: FilterOption[];
}

export interface HierarchyAgent {
    id: number;
    full_name: string;
    role: 'hm_field_agent';
    status: 'active' | 'inactive';
    avatar_url: string;
}

export interface HierarchyManager {
    id: number;
    full_name: string;
    role: 'hm_manager';
    status: 'active' | 'inactive';
    avatar_url: string;
    agents: HierarchyAgent[];
    agents_count: number;
}

export interface HierarchySuperAdmin {
    id: number;
    full_name: string;
    role: 'administrator';
    avatar_url: string;
}

export interface UserHierarchy {
    super_admin: HierarchySuperAdmin;
    managers: HierarchyManager[];
}

// ── Recent Activity ──────────────────────────────────────────────────────────

export type ActivityType =
    | 'case_approved'
    | 'case_submitted'
    | 'case_rejected'
    | 'case_returned'
    | 'user_registered';

/** A single event in the admin Recent Activity feed. */
export interface ActivityItem {
    id: string;
    type: ActivityType | string;
    created_at: string;
    // Case events
    case_id?: number;
    case_title?: string;
    case_url?: string;
    case_author_name?: string;
    actor_name?: string;
    message?: string;
    // User registration events
    user_id?: number;
    user_name?: string;
    user_role?: string;
    manager_name?: string;
}

export interface ActivityFeedParams {
    page?: number;
    per_page?: number;
}
