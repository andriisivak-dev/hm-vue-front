/**
 * @file src/api/index.ts
 *
 * Usage in a component:
 *
 *   import { useCaseList } from '@/api'
 *   const { data, loading, error, fetch } = useCaseList()
 *   onMounted(() => fetch({ page: 1, per_page: 20 }))
 */

// ── Setup ──────────────────────────────────────────────────────────────────

import { createApiClient } from './core/httpClient.ts';

export { createApiClient, useHttpClient, ApiError, apiCache } from './core/httpClient';
export type { ClientConfig, RequestOptions } from './core/httpClient';

declare global {
    interface Window {
        HM_API?: {
            baseUrl: string;
            nonce: string;
            siteUrl: string;
            logoutUrl: string;
            isLoggedIn: boolean;
            user?: {
                id: number;
                name: string;
                email: string;
                avatar: string;
                memberSince: string;
                role: string;
                permissions: {
                    canCreateCases: boolean;
                    canEditOwnCases: boolean;
                    canEditOthersCases: boolean;
                    canDeleteCases: boolean;
                    canPublishCases: boolean;
                    canViewPrivate: boolean;
                };
            } | null;
        };
    }
}

/**
 * Initialize the API client from the global `window.HM_API` object
 * injected by WordPress via `wp_localize_script`.
 */
export function setupApi(): void {
    const config = window.HM_API;
    if (!config?.baseUrl || !config?.nonce) {
        console.error(
            '[HM API] window.HM_API not found. Make sure wp_localize_script is enqueued correctly.'
        );
        return;
    }
    createApiClient({ baseUrl: config.baseUrl, nonce: config.nonce });
}

// ── Services (plain async functions — use in Pinia stores or tests) ────────

export { casesService } from './services/casesService';
export { formsService, usersService, notificationsService } from './services/index';

// ── Composables (reactive Vue wrappers) ────────────────────────────────────

export {
    useCaseList,
    useCaseDetail,
    useCaseFormData,
    useCaseMutations,
    useFormSchema,
    useUserList,
    useNotifications,
    useDashboard
} from './composables/index';

// ── Types ──────────────────────────────────────────────────────────────────

export type {
    // Envelope
    ApiSuccessResponse,
    ApiErrorResponse,
    ApiEnvelope,
    PaginationMeta,
    PaginatedResult,
    ErrorCode,
    // Cases
    CaseStatus,
    CaseListItem,
    CaseDetail,
    CaseAuthor,
    CaseReviewer,
    CasePermissions,
    ReviewHistoryEntry,
    TaxonomyTerm,
    // Request bodies
    CaseListParams,
    CreateCaseBody,
    UpdateFormDataBody,
    StatusActionBody,
    OverrideStatusBody,
    // Form
    FormSchema,
    FormField,
    FormFieldChoice,
    // Users
    User,
    UserRole,
    UserStatus,
    UserListParams,
    // Notifications
    Notification,
    NotificationType,
    NotificationListParams,
    // Dashboard
    DashboardStats,
    DashboardFilters
} from './types';
