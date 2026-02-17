export interface OnlineUserDto {
    user_id: number;
    display_name?: string;
    email?: string;
    is_online?: boolean;
    last_seen_at?: string;
}

export interface ConversationDto {
    id: number;
    type: 'direct' | 'group';
    name?: string | null;
    created_at?: string;
}

export interface ConversationSummaryDto {
    conversation_id: number;
    type: 'direct' | 'group';
    name?: string | null;
    other_user_id?: number | null;
    other_display_name?: string | null;
    last_message_at?: string | null;
}

export interface MessageDto {
    id: number;
    conversation_id: number;
    sender_user_id: number;
    body: string;
    sent_at: string;
    edited_at?: string | null;
    deleted_at?: string | null;
}
