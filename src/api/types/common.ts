export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    message: string;
    meta?: PaginationMeta;
}

export interface ApiErrorResponse {
    success: false;
    code: ErrorCode;
    message: string;
    data: unknown;
}

export type ApiEnvelope<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
    total: number;
    total_pages: number;
    page: number;
    per_page: number;
}

export type ErrorCode =
    | 'CSP_FORBIDDEN'
    | 'CSP_UNAUTHORIZED'
    | 'CSP_NOT_FOUND'
    | 'CSP_BAD_REQUEST'
    | 'CSP_VALIDATION_ERROR'
    | 'CSP_INTERNAL_ERROR'
    | 'NETWORK_ERROR'
    | 'ABORT_ERROR';

export interface PaginatedResult<T> {
    items: T[];
    meta: PaginationMeta;
}
