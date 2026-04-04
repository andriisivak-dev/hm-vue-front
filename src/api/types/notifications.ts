export type NotificationType =
    | 'case_submitted'
    | 'case_approved'
    | 'case_rejected'
    | 'case_returned'
    | string;

export interface Notification {
    id: number;
    type: NotificationType;
    case_id: number;
    case_title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface NotificationListParams {
    page?: number;
    per_page?: number;
    is_read?: boolean;
}
