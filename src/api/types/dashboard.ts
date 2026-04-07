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
