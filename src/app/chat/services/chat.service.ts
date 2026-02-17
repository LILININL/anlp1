import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { ConversationDto, ConversationSummaryDto, MessageDto, OnlineUserDto } from '../models/chat.dto';
import { AuthTokenService } from '../../core/auth-token.service';

declare const apiUrl: string;

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private get apiBase(): string {
        return apiUrl;
    }

    private readonly messageSubject = new Subject<MessageDto>();
    readonly message$ = this.messageSubject.asObservable();
    private hubConnection: HubConnection | null = null;
    private hubStartPromise: Promise<void> | null = null;
    private readonly joinedConversationIds = new Set<number>();

    constructor(private http: HttpClient, private tokenService: AuthTokenService) { }

    getOnlineUsers(): Observable<OnlineUserDto[]> {
        const token = this.tokenService.getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        return this.http
            .get<OnlineUserDto[] | { data?: OnlineUserDto[] } | { items?: OnlineUserDto[] } | { users?: OnlineUserDto[] }>(
                `${this.apiBase}/presence/online`,
                headers ? { headers } : undefined
            )
            .pipe(map(res => this.unwrapOnlineUsers(res)));
    }

    createDirectConversation(otherUserId: number): Observable<ConversationDto> {
        const payload = {
            type: 'direct',
            participant_user_ids: [otherUserId]
        };

        return this.http.post<ConversationDto | { data?: ConversationDto }>(`${this.apiBase}/conversations`, payload).pipe(
            map(res => this.unwrapConversation(res))
        );
    }

    getConversations(): Observable<ConversationSummaryDto[]> {
        const token = this.tokenService.getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        return this.http
            .get<ConversationSummaryDto[] | { data?: ConversationSummaryDto[] } | { items?: ConversationSummaryDto[] } | null>(
                `${this.apiBase}/conversations`,
                headers ? { headers } : undefined
            )
            .pipe(map(res => this.unwrapConversationList(res)));
    }

    addParticipant(conversationId: number, userId: number): Observable<void> {
        const payload = { user_id: userId };
        return this.http.post<void>(`${this.apiBase}/conversations/${conversationId}/participants`, payload);
    }

    getMessages(conversationId: number, beforeId?: number, limit = 30): Observable<MessageDto[]> {
        const params: string[] = [];
        if (beforeId) {
            params.push(`beforeId=${encodeURIComponent(String(beforeId))}`);
        }
        if (limit) {
            params.push(`limit=${encodeURIComponent(String(limit))}`);
        }
        const query = params.length ? `?${params.join('&')}` : '';
        return this.http
            .get<MessageDto[] | { data?: MessageDto[] } | { items?: MessageDto[] } | { messages?: MessageDto[] } | null>(
                `${this.apiBase}/conversations/${conversationId}/messages${query}`
            )
            .pipe(map(res => this.unwrapMessages(res)));
    }

    connect(): Observable<void> {
        return from(this.ensureHubConnection());
    }

    joinConversation(conversationId: number): Observable<void> {
        this.joinedConversationIds.add(conversationId);
        return from(this.ensureHubConnection().then(() => this.hubConnection!.invoke('JoinConversation', conversationId)));
    }

    sendMessage(conversationId: number, body: string): Observable<void> {
        return from(this.ensureHubConnection().then(() => this.hubConnection!.invoke('SendMessage', conversationId, body)));
    }

    ping(): Observable<void> {
        return from(this.ensureHubConnection().then(() => this.hubConnection!.invoke('Ping')));
    }

    markRead(conversationId: number, lastMessageId?: number): Observable<void> {
        const payload = lastMessageId ? { message_id: lastMessageId } : {};
        return this.http.post<void>(`${this.apiBase}/conversations/${conversationId}/read`, payload);
    }

    private unwrapConversation(res: ConversationDto | { data?: ConversationDto } | null | undefined): ConversationDto {
        if (!res) {
            throw new Error('Empty conversation response');
        }
        if ((res as { data?: ConversationDto }).data?.id) {
            return (res as { data?: ConversationDto }).data as ConversationDto;
        }
        return res as ConversationDto;
    }

    private unwrapOnlineUsers(
        res: OnlineUserDto[] | { data?: OnlineUserDto[] } | { items?: OnlineUserDto[] } | { users?: OnlineUserDto[] } | null | undefined
    ): OnlineUserDto[] {
        if (!res) {
            return [];
        }
        if (Array.isArray(res)) {
            return res;
        }
        const asData = res as { data?: OnlineUserDto[]; items?: OnlineUserDto[]; users?: OnlineUserDto[] };
        if (Array.isArray(asData.data)) {
            return asData.data;
        }
        if (Array.isArray(asData.items)) {
            return asData.items;
        }
        if (Array.isArray(asData.users)) {
            return asData.users;
        }
        return [];
    }

    private ensureHubConnection(): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
            return Promise.resolve();
        }
        if (this.hubStartPromise) {
            return this.hubStartPromise;
        }

        const hubUrl = this.buildHubUrl();
        this.hubConnection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => this.tokenService.getToken() || ''
            })
            .configureLogging(LogLevel.Error)
            .withAutomaticReconnect()
            .build();

        this.hubConnection.on('message', (msg: MessageDto | { data?: MessageDto } | null | undefined) => {
            const parsed = this.unwrapMessage(msg);
            if (parsed) {
                this.messageSubject.next(parsed);
            }
        });

        this.hubConnection.onreconnected(() => {
            this.rejoinConversations();
        });

        const startPromise = this.hubConnection.start().finally(() => {
            this.hubStartPromise = null;
        });
        this.hubStartPromise = startPromise;

        return startPromise;
    }

    private rejoinConversations(): void {
        if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
            return;
        }
        for (const conversationId of this.joinedConversationIds) {
            this.hubConnection.invoke('JoinConversation', conversationId).catch(() => undefined);
        }
    }

    private buildHubUrl(): string {
        const base = typeof apiUrl === 'string' ? apiUrl : '';
        if (!base) {
            return '/hubs/chat';
        }
        const trimmed = base.replace(/\/api\/?$/, '');
        return `${trimmed}/hubs/chat`;
    }

    private unwrapMessages(
        res:
            | MessageDto[]
            | { data?: MessageDto[] | { items?: MessageDto[]; messages?: MessageDto[] } | null }
            | { items?: MessageDto[] }
            | { messages?: MessageDto[] }
            | null
            | undefined
    ): MessageDto[] {
        if (!res) {
            return [];
        }
        if (Array.isArray(res)) {
            return res;
        }
        const asData = res as {
            data?: MessageDto[] | { items?: MessageDto[]; messages?: MessageDto[] } | null;
            items?: MessageDto[];
            messages?: MessageDto[];
        };
        if (Array.isArray(asData.data)) {
            return asData.data;
        }
        if (asData.data && !Array.isArray(asData.data)) {
            const nested = asData.data as { items?: MessageDto[]; messages?: MessageDto[] };
            if (Array.isArray(nested.items)) {
                return nested.items;
            }
            if (Array.isArray(nested.messages)) {
                return nested.messages;
            }
        }
        if (Array.isArray(asData.items)) {
            return asData.items;
        }
        if (Array.isArray(asData.messages)) {
            return asData.messages;
        }
        return [];
    }

    private unwrapMessage(res: MessageDto | { data?: MessageDto } | null | undefined): MessageDto | null {
        if (!res) {
            return null;
        }
        const maybeWrapped = res as { data?: MessageDto };
        if (maybeWrapped.data) {
            return maybeWrapped.data as MessageDto;
        }
        return res as MessageDto;
    }

    private unwrapConversationList(
        res: ConversationSummaryDto[] | { data?: ConversationSummaryDto[] } | { items?: ConversationSummaryDto[] } | null | undefined
    ): ConversationSummaryDto[] {
        if (!res) {
            return [];
        }
        if (Array.isArray(res)) {
            return res;
        }
        const asData = res as { data?: ConversationSummaryDto[]; items?: ConversationSummaryDto[] };
        if (Array.isArray(asData.data)) {
            return asData.data;
        }
        if (Array.isArray(asData.items)) {
            return asData.items;
        }
        return [];
    }
}
