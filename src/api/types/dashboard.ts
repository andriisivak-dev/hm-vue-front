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

