import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersListComponent } from './component/user-list/user-list.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatModule } from '../chat/chat.module';



@NgModule({
  declarations: [
    UsersListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ChatModule
  ],
  exports: [
    UsersListComponent
  ]
})
export class UsersModule { }
