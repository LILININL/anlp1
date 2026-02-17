import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { LoginResponse } from '../../models/auth.dto';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    loading = false;
    error = '';
    success = '';

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
        password: ['', [Validators.required]]
    });

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) { }

    submit(): void {
        this.error = '';
        this.success = '';

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        const payload = this.form.getRawValue();

        this.authService.login({
            email: payload.email || '',
            password: payload.password || ''
        }).subscribe({
            next: response => {
                this.success = 'เข้าสู่ระบบสำเร็จ';
                this.loading = false;
                const userId = this.getUserIdFromResponse(response);
                if (userId != null) {
                    this.authService.fetchPublicIp().pipe(
                        switchMap(ip => this.authService.sendLoginClientInfo({
                            ip_address: ip,
                            user_id: userId
                        }))
                    ).subscribe({
                        next: () => {
                            return;
                        },
                        error: () => {
                            return;
                        }
                    });
                } else {
                    console.warn('ไม่พบ user_id จากการเข้าสู่ระบบ');
                }
                this.router.navigate(['/users']);
            },
            error: err => {
                this.error = this.translateApiError(err, 'เข้าสู่ระบบไม่สำเร็จ');
                this.loading = false;
            }
        });
    }

    hasError(controlName: 'email' | 'password', error: string): boolean {
        const control = this.form.get(controlName);
        return !!(control && control.touched && control.hasError(error));
    }

    private translateApiError(err: unknown, fallback: string): string {
        const message = this.getApiMessage(err);
        if (!message) return fallback;

        switch (message.toLowerCase()) {
            case 'email already exists':
                return 'อีเมลนี้ถูกใช้งานแล้ว';
            case 'invalid credentials':
                return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
            case 'user not found':
                return 'ไม่พบผู้ใช้ในระบบ';
            case 'inactive user':
                return 'บัญชีถูกปิดใช้งาน';
            default:
                return fallback;
        }
    }

    private getApiMessage(err: unknown): string | null {
        const anyErr = err as { error?: { message?: unknown }; message?: unknown } | null;
        if (typeof anyErr?.error?.message === 'string') return anyErr.error.message;
        if (typeof anyErr?.message === 'string') return anyErr.message;
        return null;
    }

    private getUserIdFromResponse(response: LoginResponse): number | null {
        if (response?.data && typeof response.data.id === 'number') {
            return response.data.id;
        }

        return null;
    }
}
