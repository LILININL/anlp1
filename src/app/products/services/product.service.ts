import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface ProductDto {
  id: number;
  name: string;
  sku: string | null;
  price: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  [x: string]: any;
  private get apiUrl(): string {
    return apiUrl;
  }

  constructor(private http: HttpClient) { }

  getProducts() {
    return this.http
      .get<{ data: ProductDto[] }>(`${this.apiUrl}/products`)
      .pipe(map(res => res.data));
  }


}
