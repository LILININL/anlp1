import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OnlineChatComponent } from './components/online-chat/online-chat.component';

@NgModule({
    declarations: [OnlineChatComponent],
    imports: [CommonModule, FormsModule],
    exports: [OnlineChatComponent]
})
export class ChatModule { }
