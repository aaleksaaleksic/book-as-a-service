export type RecipientGroup = 'ALL_USERS' | 'ACTIVE_USERS';

export interface BulkEmailRequest {
    recipientGroup: RecipientGroup;
    subject: string;
    content: string;
}

export interface BulkEmailResponse {
    message: string;
    recipientCount: number;
}
