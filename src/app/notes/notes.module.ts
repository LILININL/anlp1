import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserNotesComponent } from './component/user-notes/user-notes.component';

@NgModule({
  declarations: [
    UserNotesComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    UserNotesComponent
  ]
})
export class NotesModule {}
