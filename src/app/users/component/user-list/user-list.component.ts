import { Component, OnInit } from '@angular/core';
import { UserListDto, UserListService } from 'src/app/users/services/user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UsersListComponent implements OnInit {
  private readonly onlyActiveStorageKey = 'users.onlyActive';
  users: UserListDto[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  onlyActive = true;
  editUserId: number | null = null;
  editName = '';

  constructor(private userService: UserListService) { }

  ngOnInit(): void {
    this.restoreOnlyActive();
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

  setOnlyActive(value: boolean): void {
    this.onlyActive = value;
    try {
      localStorage.setItem(this.onlyActiveStorageKey, String(value));
    } catch {
      console.warn('ไม่สามารถบันทึกการตั้งค่าได้');
    }
  }

  private restoreOnlyActive(): void {
    try {
      const stored = localStorage.getItem(this.onlyActiveStorageKey);
      if (stored === 'true') {
        this.onlyActive = true;
      } else if (stored === 'false') {
        this.onlyActive = false;
      }
    } catch {
      console.warn('ไม่สามารถโหลดการตั้งค่าได้');
    }
  }
}


