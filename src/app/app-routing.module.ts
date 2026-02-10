import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsersListComponent } from './users/component/user-list/user-list.component';
import { ProductListComponent } from './products/component/product-list/product-list.component';
import { ProductDetailComponent } from './products/component/product-detail/product-detail.component';
import { UserNotesComponent } from './notes/component/user-notes/user-notes.component';

const routes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  { path: 'users', component: UsersListComponent },
  { path: 'users/:id/notes', component: UserNotesComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: '**', redirectTo: 'users' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
