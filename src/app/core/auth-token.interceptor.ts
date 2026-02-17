import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthTokenService } from './auth-token.service';
import { AuthService } from '../auth/services/auth.service';

declare const apiUrl: string;

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
    constructor(
        private tokenService: AuthTokenService,
        private authService: AuthService,
        private router: Router
    ) { }

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = this.tokenService.getToken();
        const isApiRequest = typeof apiUrl === 'string' && req.url.startsWith(apiUrl);

        if (!isApiRequest) {
            return next.handle(req);
        }

        if (!token || this.tokenService.isTokenExpired(token)) {
            this.authService.logout();
            this.router.navigate(['/login']);
            return next.handle(req).pipe(
                catchError(error => {
                    if (error?.status === 401) {
                        this.authService.logout();
                        this.router.navigate(['/login']);
                    }
                    return throwError(() => error);
                })
            );
        }

        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        return next.handle(authReq).pipe(
            catchError(error => {
                if (error?.status === 401) {
                    this.authService.logout();
                    this.router.navigate(['/login']);
                }
                return throwError(() => error);
            })
        );
    }
}
