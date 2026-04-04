export type UserStatus = 'active' | 'inactive';
export type UserRole =
    | 'administrator'
    | 'hm_administrator'
    | 'hm_manager'
    | 'hm_marketing'
    | 'hm_field_agent';

export interface UserSupervisor {
    id: number;
    full_name: string;
}

export interface UserCasesCount {
    total: number;
    draft: number;
    in_review: number;
    approved: number;
}

export interface User {
    id: number;
    full_name: string;
    email: string;
    role: UserRole | string;
    status: UserStatus;
    avatar_url: string;
    supervisor: UserSupervisor | null;
    agents: number[];
    cases_count: UserCasesCount;
    created_at: string;
}

export interface UserListParams {
    page?: number;
    per_page?: number;
    role?: UserRole | string;
    status?: UserStatus | 'all';
    search?: string;
    orderby?: 'date' | 'name';
    order?: 'asc' | 'desc';
}
