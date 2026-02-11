import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NoteDto, NoteWithProductApi, NoteWithProductDto } from '../models/note.dto';

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
        map(res => {
          if (Array.isArray(res.data)) {
            return res.data;
          }
          return [];
        })
      );
  }


  getNotesAndProductsByUserId(userId: number): Observable<NoteWithProductDto[]> {
    return this.http
      .get<{ data?: NoteWithProductApi | NoteWithProductApi[] } | NoteWithProductApi | NoteWithProductApi[]>(`${this.apiUrl}/notes/${userId}/products`)
      .pipe(
        map(response => this.extractNoteProductItems(response)
          .map(item => this.toNoteWithProductDto(item)))
      );
  }

  updateStatus(id: number, status: NoteDto['status']): Observable<NoteDto> {
    return this.http.put<NoteDto>(`${this.apiUrl}/notes/${id}/status`, { status });
  }

  private toNoteWithProductDto(item: NoteWithProductApi): NoteWithProductDto {
    const product = {
      name: item.product_name != null ? item.product_name : null,
      sku: item.product_sku != null ? item.product_sku : null,
      price: item.product_price != null ? item.product_price : null,
      created_at: item.product_created_at != null ? item.product_created_at : null,
      updated_at: item.product_updated_at != null ? item.product_updated_at : null
    };
    const hasProduct = Object.values(product).some(value => value != null);

    if (!hasProduct) {
      return {
        note: item as NoteDto,
        product: null
      };
    }

    return {
      note: item as NoteDto,
      product
    };
  }

  private extractNoteProductItems(response: unknown): NoteWithProductApi[] {
    const responseObject = response as { data?: NoteWithProductApi | NoteWithProductApi[] };
    let responseData: NoteWithProductApi | NoteWithProductApi[] | undefined;

    if (responseObject && 'data' in responseObject) {
      responseData = responseObject.data;
    } else {
      responseData = response as NoteWithProductApi | NoteWithProductApi[] | undefined;
    }

    if (!responseData) {
      return [];
    }

    if (Array.isArray(responseData)) {
      return responseData as NoteWithProductApi[];
    }

    return [responseData as NoteWithProductApi];
  }

}
