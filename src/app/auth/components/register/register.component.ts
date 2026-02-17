import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    loading = false;
    error = '';
    success = '';

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
        password: ['', [Validators.required]],
        display_name: ['', [Validators.required, Validators.maxLength(100)]]
    });

    constructor(private fb: FormBuilder, private authService: AuthService) { }

    submit(): void {
        this.error = '';
        this.success = '';

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        const payload = this.form.getRawValue();

        this.authService.createUser({
            email: payload.email || '',
            password: payload.password || '',
            display_name: payload.display_name || ''
        }).subscribe({
            next: () => {
                this.success = 'สร้างผู้ใช้สำเร็จ';
                this.loading = false;
            },
            error: err => {
                this.error = this.translateApiError(err, 'สร้างผู้ใช้ไม่สำเร็จ');
                this.loading = false;
            }
        });
    }

    hasError(controlName: 'email' | 'password' | 'display_name', error: string): boolean {
        const control = this.form.get(controlName);
        return !!(control && control.touched && control.hasError(error));
    }

    private translateApiError(err: unknown, fallback: string): string {
        const message = this.getApiMessage(err);
        if (!message) return fallback;

        switch (message.toLowerCase()) {
            case 'email already exists':
                return 'อีเมลนี้ถูกใช้งานแล้ว';
            case 'invalid email':
                return 'รูปแบบอีเมลไม่ถูกต้อง';
            case 'password too short':
                return 'รหัสผ่านสั้นเกินไป';
            case 'display name too long':
                return 'ชื่อที่แสดงยาวเกินไป';
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
}
