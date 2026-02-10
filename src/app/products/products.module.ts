import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductListComponent } from './component/product-list/product-list.component';
import { ProductDetailComponent } from './component/product-detail/product-detail.component';

@NgModule({
  declarations: [
    ProductListComponent,
    ProductDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    ProductListComponent,
    ProductDetailComponent
  ]
})
export class ProductsModule {}
