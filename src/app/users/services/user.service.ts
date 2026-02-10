import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserListDto {
  id: number;
  email: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
}
@Injectable({
  providedIn: 'root'
})
export class UserListService {
  private get apiUrl(): string {
    return apiUrl;
  }

  constructor(private http: HttpClient) { }

  getUsers(): Observable<UserListDto[]> {
    return this.http.get<UserListDto[]>(`${this.apiUrl}/users`);
  }

  getUserById(id: number): Observable<UserListDto> {
    return this.http.get<UserListDto>(`${this.apiUrl}/users/${id}`);
  }

  updateDisplayName(id: number, display_name: string) {
    return this.http.put<UserListDto>(
      `${this.apiUrl}/users/${id}/display-name`,
      { display_name }
    );
  }

  updateActiveStatus(id: number, is_active: boolean) {
    return this.http.put<UserListDto>(
      `${this.apiUrl}/users/${id}/is-active`,
      { is_active }
    );
  }


}
