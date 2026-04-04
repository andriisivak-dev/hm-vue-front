import type { TaxonomyTerm } from './cases';
import type { UserSupervisor } from './users';

export interface DashboardStats {
    pending_review: number;
    returned: number;
    approved: number;
    rejected: number;
    draft: number;
    total: number;
}

export interface DashboardFilters {
    product_types: TaxonomyTerm[];
    industry_segments: TaxonomyTerm[];
    machine_types: TaxonomyTerm[];
    machine_makes: TaxonomyTerm[];
    tool_brands: TaxonomyTerm[];
    solution_types: TaxonomyTerm[];
    submitted_by: UserSupervisor[];
}
