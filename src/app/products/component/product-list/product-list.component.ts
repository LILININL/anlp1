import { Component, OnInit } from '@angular/core';
import { ProductDto, ProductService } from 'src/app/products/services/product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  products: ProductDto[] = [];
  loading = true;
  error = '';

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: data => {
        this.products = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'โหลดไม่สำเร็จ';
        this.loading = false;
      }
    });
  }

  trackById(_i: number, p: ProductDto): number {
    return p.id;
  }
}
