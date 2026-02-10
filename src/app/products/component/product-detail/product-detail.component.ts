import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductDto, ProductService } from 'src/app/products/services/product.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
  product: ProductDto | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!id) {
      this.error = 'รหัสสินค้าไม่ถูกต้อง';
      this.loading = false;
      return;
    }

    this.productService.getProductById(id).subscribe({
      next: (data: ProductDto | null) => {
        this.product = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'โหลดไม่สำเร็จ';
        this.loading = false;
      }
    });
  }
}
