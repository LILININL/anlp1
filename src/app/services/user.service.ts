import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserListDto {
  id: number;
  email: string;
  display_name: string;
  is_active: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserListService {
  private apiUrl = 'http://localhost:5134/api';

  constructor(private http: HttpClient) { }

  getUsers(): Observable<UserListDto[]> {
    return this.http.get<UserListDto[]>(`${this.apiUrl}/users`);
  }

  getUserById(id: number): Observable<UserListDto> {
    return this.http.get<UserListDto>(`${this.apiUrl}/users/${id}`);
  }
}