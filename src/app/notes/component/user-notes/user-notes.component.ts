import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NoteDto, NoteService } from 'src/app/notes/services/note.service';

@Component({
  selector: 'app-user-notes',
  templateUrl: './user-notes.component.html'
})
export class UserNotesComponent implements OnInit {
  userId = 0;
  userName = '';
  notes: NoteDto[] = [];
  loading = true;
  error = '';
  statusOptions: NoteDto['status'][] = ['open', 'in_progress', 'done'];

  constructor(
    private route: ActivatedRoute,
    private noteService: NoteService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!id) {
      this.error = 'รหัสผู้ใช้ไม่ถูกต้อง';
      this.loading = false;
      return;
    }

    this.userId = id;
    this.userName = this.route.snapshot.queryParamMap.get('name') || '';

    this.noteService.getNotesByUserId(id).subscribe({
      next: data => {
        this.notes = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'โหลดไม่สำเร็จ';
        this.loading = false;
      }
    });
  }

  trackById(_i: number, n: NoteDto): number {
    return n.id;
  }

  updateStatus(note: NoteDto, nextStatus: string): void {
    if (!nextStatus || nextStatus === note.status) return;

    this.noteService.updateStatus(note.id, nextStatus).subscribe({
      next: (res) => {
        if (res?.status) {
          note.status = res.status;
        } else {
          note.status = nextStatus as NoteDto['status'];
        }
      },
      error: () => {
        this.error = 'อัปเดตสถานะไม่สำเร็จ';
      }
    });
  }
}
