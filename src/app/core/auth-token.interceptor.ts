import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthTokenService } from './auth-token.service';

declare const apiUrl: string;

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
    constructor(private tokenService: AuthTokenService) { }

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = this.tokenService.getToken();
        const isApiRequest = typeof apiUrl === 'string' && req.url.startsWith(apiUrl);

        if (!token || !isApiRequest) {
            return next.handle(req);
        }

        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        return next.handle(authReq);
    }
}
