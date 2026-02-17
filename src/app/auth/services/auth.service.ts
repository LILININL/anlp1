import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthUser, LoginClientInfoRequest, LoginRequest, LoginResponse, UsersCreateRequest } from '../models/auth.dto';
import { AuthTokenService } from '../../core/auth-token.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly authKey = 'auth_logged_in';
    private readonly userIdKey = 'auth_user_id';
    private readonly userNameKey = 'auth_display_name';
    private readonly loggedInSubject = new BehaviorSubject<boolean>(this.readLoggedIn());
    private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.readUser());

    private get apiUrl(): string {
        return apiUrl;
    }

    constructor(private http: HttpClient, private tokenService: AuthTokenService) {
        const token = this.tokenService.getToken();
        if (token && this.tokenService.isTokenExpired(token)) {
            this.logout();
        }
    }

    login(payload: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, payload).pipe(
            tap(response => {
                this.setLoggedIn(true);
                this.setUserFromResponse(response);
                if (response?.token) {
                    this.tokenService.setToken(response.token);
                } else {
                    this.tokenService.clearToken();
                }
            })
        );
    }

    sendLoginClientInfo(payload: LoginClientInfoRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/login-events/client-info`, payload);
    }

    fetchPublicIp(): Observable<string> {
        return this.http.get<{ ip: string }>('https://api.ipify.org?format=json').pipe(
            map(res => res.ip)
        );
    }

    createUser(payload: UsersCreateRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/users`, payload);
    }

    get isLoggedIn$(): Observable<boolean> {
        return this.loggedInSubject.asObservable();
    }

    get currentUser$(): Observable<AuthUser | null> {
        return this.currentUserSubject.asObservable();
    }

    isLoggedIn(): boolean {
        const token = this.tokenService.getToken();
        if (!token || this.tokenService.isTokenExpired(token)) {
            this.logout();
            return false;
        }

        return this.loggedInSubject.value;
    }

    getCurrentUser(): AuthUser | null {
        return this.currentUserSubject.value;
    }

    logout(): void {
        this.setLoggedIn(false);
        this.clearUser();
        this.tokenService.clearToken();
    }

    private setLoggedIn(value: boolean): void {
        this.loggedInSubject.next(value);
        try {
            let cookieValue = 'false';
            if (value) {
                cookieValue = 'true';
            }
            this.setCookie(this.authKey, cookieValue, 7);
        } catch {
            console.warn('Failed to persist auth state');
        }
    }

    private setUserFromResponse(response: LoginResponse | null | undefined): void {
        if (!response) return;

        let user: AuthUser | null = null;
        if (
            response.data &&
            typeof response.data.id === 'number' &&
            typeof response.data.display_name === 'string'
        ) {
            user = { id: response.data.id, display_name: response.data.display_name };
        }

        if (user) {
            this.setUser(user);
        }
    }

    private setUser(user: AuthUser): void {
        this.currentUserSubject.next(user);
        try {
            this.setCookie(this.userIdKey, String(user.id), 7);
            this.setCookie(this.userNameKey, user.display_name, 7);
        } catch {
            console.warn('Failed to persist user info');
        }
    }

    private clearUser(): void {
        this.currentUserSubject.next(null);
        try {
            this.setCookie(this.userIdKey, '', 0);
            this.setCookie(this.userNameKey, '', 0);
        } catch {
            console.warn('Failed to clear user info');
        }
    }

    private readLoggedIn(): boolean {
        try {
            return this.getCookie(this.authKey) === 'true';
        } catch {
            return false;
        }
    }

    private readUser(): AuthUser | null {
        try {
            const idValue = this.getCookie(this.userIdKey);
            const nameValue = this.getCookie(this.userNameKey);
            if (idValue && nameValue) {
                const idNumber = Number(idValue);
                if (!Number.isNaN(idNumber)) {
                    return { id: idNumber, display_name: nameValue };
                }
            }
            return null;
        } catch {
            return null;
        }
    }

    private setCookie(name: string, value: string, days: number): void {
        const maxAge = Math.max(0, days) * 24 * 60 * 60;
        document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/`;
    }

    private getCookie(name: string): string | null {
        const encodedName = encodeURIComponent(name) + '=';
        const parts = document.cookie.split(';');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.startsWith(encodedName)) {
                return decodeURIComponent(trimmed.substring(encodedName.length));
            }
        }
        return null;
    }
}
