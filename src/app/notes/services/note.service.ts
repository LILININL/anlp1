import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface NoteDto {
  id: number;
  user_id: number;
  product_id: number | null;
  title: string;
  body: string | null;
  status: 'open' | 'in_progress' | 'done' | string;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class NoteService {
  private get apiUrl(): string {
    return apiUrl;
  }

  constructor(private http: HttpClient) { }

  getNotesByUserId(userId: number): Observable<NoteDto[]> {
    return this.http
      .get<{ data: NoteDto | NoteDto[] }>(`${this.apiUrl}/notes/${userId}`)
      .pipe(
        map(res => Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []))
      );
  }

  updateStatus(id: number, status: NoteDto['status']): Observable<NoteDto> {
    return this.http.put<NoteDto>(`${this.apiUrl}/notes/${id}/status`, { status });
  }
}
