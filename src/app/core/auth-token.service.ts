import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
    private readonly tokenKey = 'auth_token';

    isTokenExpired(token?: string | null): boolean {
        const value = token ?? this.getToken();
        if (!value) {
            return true;
        }

        const payload = this.decodePayload(value);
        if (!payload || typeof payload.exp !== 'number') {
            return true;
        }

        const expiryMs = payload.exp * 1000;
        return Date.now() >= expiryMs;
    }

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

    private decodePayload(token: string): Record<string, unknown> | null {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        try {
            const json = this.decodeBase64Url(parts[1]);
            return JSON.parse(json) as Record<string, unknown>;
        } catch {
            return null;
        }
    }

    private decodeBase64Url(value: string): string {
        let base64 = value.replace(/-/g, '+').replace(/_/g, '/');
        const padding = base64.length % 4;
        if (padding) {
            base64 += '='.repeat(4 - padding);
        }

        return atob(base64);
    }
}
