import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { ConversationSummaryDto, MessageDto, OnlineUserDto } from '../../models/chat.dto';
import { UserListDto } from 'src/app/users/services/user.service';

interface OnlineUserView {
    user_id: number;
    display_name: string;
    statusText: string;
    last_seen_at?: string;
}

@Component({
    selector: 'app-online-chat',
    templateUrl: './online-chat.component.html',
    styleUrls: ['./online-chat.component.css']
})
export class OnlineChatComponent implements OnInit, OnDestroy, OnChanges {
    @Input() currentUserId: number | null = null;
    @Input() users: UserListDto[] = [];

    private readonly usersById = new Map<number, UserListDto>();
    private lastOnlineData: OnlineUserDto[] = [];
    private messageSub: Subscription | null = null;
    private readonly autoJoinedUserIds = new Set<number>();
    private readonly conversationsById = new Map<number, ConversationSummaryDto>();
    conversations: ConversationSummaryDto[] = [];
    conversationsLoading = false;
    conversationsError = '';
    onlineUsers: OnlineUserView[] = [];
    onlineLoading = false;
    onlineError = '';
    private onlinePollHandle: number | null = null;
    private pingHandle: number | null = null;
    activeConversationId: number | null = null;
    activeChatUser: OnlineUserView | null = null;
    messages: MessageDto[] = [];
    messagesLoading = false;
    messagesError = '';
    messagesEmptyText = 'ยังไม่มีข้อความ';
    messageText = '';
    hasMoreMessages = false;
    private readonly pageSize = 30;

    constructor(private chatService: ChatService) { }

    ngOnInit(): void {
        this.rebuildUsersById();
        this.chatService.connect().subscribe({
            next: () => undefined,
            error: () => {
                this.onlineError = 'เชื่อมต่อแชทไม่สำเร็จ';
            }
        });
        this.pingHandle = window.setInterval(() => {
            this.chatService.ping().subscribe({
                next: () => undefined,
                error: () => undefined
            });
        }, 120000);
        this.refreshConversations();
        this.refreshOnlineUsers();
        this.onlinePollHandle = window.setInterval(() => this.refreshOnlineUsers(true), 300000);
        this.messageSub = this.chatService.message$.subscribe(message => {
            this.handleIncomingMessage(message);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['users']) {
            this.rebuildUsersById();
        }
        if (changes['users'] || changes['currentUserId']) {
            if (this.lastOnlineData.length) {
                this.onlineUsers = this.mapOnlineUsers(this.lastOnlineData);
            }
        }
    }

    ngOnDestroy(): void {
        if (this.onlinePollHandle) {
            window.clearInterval(this.onlinePollHandle);
            this.onlinePollHandle = null;
        }
        if (this.pingHandle) {
            window.clearInterval(this.pingHandle);
            this.pingHandle = null;
        }
        if (this.messageSub) {
            this.messageSub.unsubscribe();
            this.messageSub = null;
        }
    }

    refreshOnlineUsers(silent = false): void {
        if (!silent) {
            this.onlineLoading = true;
            this.onlineError = '';
        }
        this.chatService.getOnlineUsers().subscribe({
            next: data => {
                if (!Array.isArray(data)) {
                    this.onlineUsers = [];
                    this.lastOnlineData = [];
                    this.onlineLoading = false;
                    this.onlineError = 'รูปแบบข้อมูลออนไลน์ไม่ถูกต้อง';
                    return;
                }
                this.lastOnlineData = data;
                this.onlineUsers = this.mapOnlineUsers(data);
                this.autoJoinOnlineUsers();
                this.onlineLoading = false;
                this.onlineError = '';
            },
            error: (err: { status?: number } | null | undefined) => {
                this.onlineLoading = false;
                if (err?.status === 401) {
                    this.onlineError = 'ไม่มีสิทธิ์ใช้งาน กรุณาเข้าสู่ระบบใหม่';
                } else {
                    this.onlineError = 'โหลดรายชื่อออนไลน์ไม่สำเร็จ';
                }
            }
        });
    }

    refreshConversations(): void {
        this.conversationsLoading = true;
        this.conversationsError = '';
        this.chatService.getConversations().subscribe({
            next: data => {
                this.conversations = data || [];
                this.conversationsById.clear();
                for (const convo of this.conversations) {
                    this.conversationsById.set(convo.conversation_id, convo);
                }
                this.conversationsLoading = false;
                this.conversationsError = '';
                this.autoJoinConversationList();
            },
            error: () => {
                this.conversationsLoading = false;
                this.conversationsError = 'โหลดรายการแชทไม่สำเร็จ';
            }
        });
    }

    openConversation(convo: ConversationSummaryDto): void {
        this.activeConversationId = convo.conversation_id;
        this.activeChatUser = this.resolveChatUser(convo.other_user_id || undefined, convo.other_display_name || undefined);
        this.messages = [];
        this.messagesError = '';
        this.messagesLoading = true;
        this.chatService.joinConversation(convo.conversation_id).subscribe({
            next: () => this.loadMessages(true),
            error: () => {
                this.messagesLoading = false;
                this.messagesError = 'เข้าห้องสนทนาไม่สำเร็จ';
            }
        });
    }

    startDirectChat(user: OnlineUserView): void {
        if (!this.currentUserId) {
            this.messagesError = 'ยังไม่พบข้อมูลผู้ใช้ที่เข้าสู่ระบบ';
            return;
        }
        this.activeChatUser = user;
        this.messages = [];
        this.messagesError = '';
        this.messagesLoading = true;
        this.chatService.createDirectConversation(user.user_id).subscribe({
            next: convo => {
                this.activeConversationId = convo.id;
                this.refreshConversations();
                this.chatService.joinConversation(convo.id).subscribe({
                    next: () => this.loadMessages(true),
                    error: () => {
                        this.messagesLoading = false;
                        this.messagesError = 'เข้าห้องสนทนาไม่สำเร็จ';
                    }
                });
            },
            error: () => {
                this.messagesLoading = false;
                this.messagesError = 'สร้างห้องสนทนาไม่สำเร็จ';
            }
        });
    }

    loadMessages(reset: boolean): void {
        if (!this.activeConversationId) return;
        const beforeId = !reset && this.messages.length ? this.messages[0].id : undefined;
        this.messagesLoading = true;
        this.messagesError = '';
        this.chatService.getMessages(this.activeConversationId, beforeId, this.pageSize).subscribe({
            next: data => {
                if (!Array.isArray(data)) {
                    this.messages = [];
                    this.hasMoreMessages = false;
                    this.messagesLoading = false;
                    this.messagesEmptyText = 'ไม่มีข้อความก่อนหน้า';
                    return;
                }
                this.messagesEmptyText = 'ยังไม่มีข้อความ';
                const sorted = [...data].sort((a, b) => a.id - b.id);
                if (reset) {
                    this.messages = this.mergeMessages(this.messages, sorted, false);
                } else {
                    this.messages = this.mergeMessages(this.messages, sorted, true);
                }
                this.hasMoreMessages = data.length >= this.pageSize;
                this.messagesLoading = false;
                this.markReadIfNeeded();
                if (reset) {
                    this.scrollToBottom();
                }
            },
            error: () => {
                this.messagesLoading = false;
                this.messagesError = 'โหลดข้อความไม่สำเร็จ';
            }
        });
    }

    sendMessage(): void {
        if (!this.activeConversationId) return;
        const body = this.messageText.trim();
        if (!body) return;
        this.chatService.sendMessage(this.activeConversationId, body).subscribe({
            next: () => {
                this.messageText = '';
            },
            error: () => {
                this.messagesError = 'ส่งข้อความไม่สำเร็จ';
            }
        });
    }

    formatTime(value: string | undefined): string {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }

    private rebuildUsersById(): void {
        this.usersById.clear();
        for (const user of this.users) {
            this.usersById.set(user.id, user);
        }
    }

    private handleIncomingMessage(message: MessageDto | null | undefined): void {
        if (!message || !message.conversation_id) return;

        if (message.conversation_id !== this.activeConversationId) {
            this.activeConversationId = message.conversation_id;
            this.activeChatUser = this.resolveChatUser(message.sender_user_id);
            this.messages = this.mergeMessages(this.messages, [message], false);
            this.messagesError = '';
            this.messagesLoading = false;
            this.chatService.joinConversation(message.conversation_id).subscribe({
                next: () => this.loadMessages(true),
                error: () => {
                    this.messagesError = 'เข้าห้องสนทนาไม่สำเร็จ';
                }
            });
            return;
        }

        const exists = this.messages.some(item => item.id === message.id);
        if (exists) return;
        this.messages.push(message);
        this.scrollToBottom();
        this.markReadIfNeeded();
    }

    private mergeMessages(current: MessageDto[], incoming: MessageDto[], prepend: boolean): MessageDto[] {
        const merged = prepend ? [...incoming, ...current] : [...current, ...incoming];
        const byId = new Map<number, MessageDto>();
        for (const msg of merged) {
            byId.set(msg.id, msg);
        }
        return Array.from(byId.values()).sort((a, b) => a.id - b.id);
    }

    private resolveChatUser(senderUserId?: number, displayName?: string | null): OnlineUserView | null {
        if (!senderUserId && !displayName) return null;
        if (!senderUserId) {
            return {
                user_id: 0,
                display_name: displayName || 'Unknown',
                statusText: 'มีข้อความใหม่'
            };
        }
        const fallback = this.usersById.get(senderUserId);
        return {
            user_id: senderUserId,
            display_name: displayName || fallback?.display_name || `User ${senderUserId}`,
            statusText: 'มีข้อความใหม่'
        };
    }

    private mapOnlineUsers(data: OnlineUserDto[]): OnlineUserView[] {
        const filtered = this.currentUserId
            ? data.filter(item => item.user_id !== this.currentUserId)
            : data;

        return filtered.map(item => {
            const fallbackName = this.usersById.get(item.user_id)?.display_name;
            const displayName = item.display_name || fallbackName || `User ${item.user_id}`;
            const statusText = item.is_online === false
                ? 'ออฟไลน์'
                : item.last_seen_at
                    ? `ออนไลน์ล่าสุด ${this.formatLastSeen(item.last_seen_at)}`
                    : 'ออนไลน์ตอนนี้';
            return {
                user_id: item.user_id,
                display_name: displayName,
                statusText,
                last_seen_at: item.last_seen_at
            };
        }).sort((a, b) => a.display_name.localeCompare(b.display_name));
    }

    private autoJoinOnlineUsers(): void {
        if (!this.currentUserId || this.onlineUsers.length === 0) return;

        for (const user of this.onlineUsers) {
            if (this.autoJoinedUserIds.has(user.user_id)) {
                continue;
            }
            this.autoJoinedUserIds.add(user.user_id);
            this.chatService.createDirectConversation(user.user_id).subscribe({
                next: convo => {
                    this.conversationsById.set(convo.id, {
                        conversation_id: convo.id,
                        type: 'direct',
                        name: convo.name ?? null,
                        other_user_id: user.user_id,
                        other_display_name: user.display_name,
                        last_message_at: null
                    });
                    this.chatService.joinConversation(convo.id).subscribe({
                        next: () => undefined,
                        error: () => undefined
                    });
                },
                error: () => undefined
            });
        }
    }

    private autoJoinConversationList(): void {
        if (!this.currentUserId || this.conversations.length === 0) return;
        for (const convo of this.conversations) {
            if (!convo.conversation_id) continue;
            this.chatService.joinConversation(convo.conversation_id).subscribe({
                next: () => undefined,
                error: () => undefined
            });
        }
    }

    private formatLastSeen(value: string): string {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'ไม่ทราบเวลา';
        return date.toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    private markReadIfNeeded(): void {
        if (!this.activeConversationId || this.messages.length === 0) return;
        const lastMessageId = this.messages[this.messages.length - 1].id;
        this.chatService.markRead(this.activeConversationId, lastMessageId).subscribe({
            next: () => undefined,
            error: () => undefined
        });
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            const el = document.querySelector('.chat-messages');
            if (el instanceof HTMLElement) {
                el.scrollTop = el.scrollHeight;
            }
        }, 0);
    }
}
