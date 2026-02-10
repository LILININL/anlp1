import { Component, OnInit } from '@angular/core';
import { UserListDto, UserListService } from 'src/app/services/user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UsersListComponent implements OnInit {
  users: UserListDto[] = [];
  loading = true;
  error = '';
  searchTerm = '';

  constructor(private userService: UserListService) { }

  ngOnInit(): void {
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
    if (!q) return this.users;
    return this.users.filter(u =>
      (u.display_name || '').toLowerCase().includes(q) ||
      String(u.id).includes(q)
    );
  }
}

