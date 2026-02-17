export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginClientInfoRequest {
    ip_address: string;
    user_id: number;
}

export interface AuthUser {
    id: number;
    display_name: string;
}

export interface LoginResponse {
    id?: number;
    display_name?: string;
    user?: AuthUser;
    data?: {
        id?: number;
        display_name?: string;
        email?: string;
        is_active?: boolean;
        created_at?: string;
    };
    token?: string;
}

export interface UsersCreateRequest {
    email: string;
    password: string;
    display_name: string;
}
