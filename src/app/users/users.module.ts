import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersListComponent } from './user-list/user-list.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    UsersListComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    UsersListComponent
  ]
})
export class UsersModule { }
