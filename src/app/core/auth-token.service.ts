import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
    private readonly tokenKey = 'auth_token';

    setToken(token: string): void {
        try {
            localStorage.setItem(this.tokenKey, token);
        } catch {
            console.warn('Failed to persist auth token');
        }
    }

    getToken(): string | null {
        try {
            return localStorage.getItem(this.tokenKey);
        } catch {
            return null;
        }
    }

    clearToken(): void {
        try {
            localStorage.removeItem(this.tokenKey);
        } catch {
            console.warn('Failed to clear auth token');
        }
    }
}
