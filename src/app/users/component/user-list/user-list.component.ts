import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { AuthUser } from 'src/app/auth/models/auth.dto';
import { UserListDto, UserListService } from 'src/app/users/services/user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UsersListComponent implements OnInit, OnDestroy {
  private readonly onlyActiveStorageKey = 'users.onlyActive';
  private readonly onlyActiveCookieKey = 'users_only_active';
  users: UserListDto[] = [];
  loading = true;
  error = '';
  currentUser$: Observable<AuthUser | null>;
  private currentUserSub: Subscription | null = null;
  currentUserId: number | null = null;
  searchTerm = '';
  onlyActive = true;
  editUserId: number | null = null;
  editName = '';

  constructor(
    private userService: UserListService,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.restoreOnlyActive();
    this.currentUserSub = this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user?.id ?? null;
    });
    this.userService.getUsers().subscribe({
      next: data => {
        this.users = data;
        this.loading = false;
      },
      error: err => {
        this.error = 'โหลดไม่สำเร็จ';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.currentUserSub) {
      this.currentUserSub.unsubscribe();
      this.currentUserSub = null;
    }
  }

  get filteredUsers(): UserListDto[] {
    const q = this.searchTerm.trim().toLowerCase();

    return this.users
      .filter(u => !this.onlyActive || u.is_active)
      .filter(u =>
        !q ||
        (u.display_name || '').toLowerCase().includes(q) ||
        String(u.id).includes(q)
      );
  }

  startEdit(u: UserListDto): void {
    this.editUserId = u.id;
    this.editName = u.display_name;
  }

  saveEdit(): void {
    if (this.editUserId == null) return;
    this.userService.updateDisplayName(this.editUserId, this.editName).subscribe(() => {
      const user = this.users.findIndex(user => user.id === this.editUserId);
      if (user >= 0) {
        this.users[user].display_name = this.editName;
      }
      this.editUserId = null;
      this.editName = '';
    });
  }

  toggleActive(u: UserListDto): void {
    const next = !u.is_active;
    this.userService.updateActiveStatus(u.id, next).subscribe(res => {
      if (res?.is_active !== undefined) {
        u.is_active = res.is_active;
      } else {
        u.is_active = next;
      }
    });
  }

  getActiveLabelForUser(userId: number): string {
    const user = this.users.find(item => item.id === userId);
    if (!user) {
      return 'ไม่ทราบ';
    }

    if (user.is_active) {
      return 'ใช้งานอยู่';
    }

    return 'ปิดใช้งาน';
  }

  setOnlyActive(value: boolean): void {
    this.onlyActive = value;
    try {
      let cookieValue = 'false';
      if (value) {
        cookieValue = 'true';
      }
      this.setCookie(this.onlyActiveCookieKey, cookieValue, 30);
    } catch {
      console.warn('ไม่สามารถบันทึกการตั้งค่าได้');
    }
  }

  private restoreOnlyActive(): void {
    try {
      const storedCookie = this.getCookie(this.onlyActiveCookieKey);
      if (storedCookie === 'true') {
        this.onlyActive = true;
        return;
      }

      if (storedCookie === 'false') {
        this.onlyActive = false;
        return;
      }

      const storedLocal = localStorage.getItem(this.onlyActiveStorageKey);
      if (storedLocal === 'true') {
        this.onlyActive = true;
        this.setCookie(this.onlyActiveCookieKey, 'true', 30);
      } else if (storedLocal === 'false') {
        this.onlyActive = false;
        this.setCookie(this.onlyActiveCookieKey, 'false', 30);
      }
      localStorage.removeItem(this.onlyActiveStorageKey);
    } catch {
      console.warn('ไม่สามารถโหลดการตั้งค่าได้');
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


