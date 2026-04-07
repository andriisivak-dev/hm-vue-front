export interface Customer {
    id: number;
    external_id: string;
    company_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    billing_center: string;
    customer_segment: string;
    logo_id: number;
    logo_url: string;
    updated_at: string;
}

export interface CustomerListParams {
    page?: number;
    per_page?: number;
    search?: string;
    billing_center?: string;
}

export interface CustomerStats {
    total: number;
}
