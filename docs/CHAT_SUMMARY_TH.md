# สรุปฟีเจอร์แชท (Client)

เอกสารนี้อธิบายการทำงานของฝั่ง client สำหรับฟีเจอร์แชท, เหตุผลที่ต้องใช้แต่ละฟังก์ชัน, โฟลว์การเรียก API, และการเชื่อมต่อ SignalR แบบละเอียด

## ภาพรวม

ฟีเจอร์แชทแบ่งเป็น 2 ส่วนหลัก:

1. REST API สำหรับข้อมูล (presence, create conversation, messages history, read)
2. SignalR สำหรับส่ง/รับข้อความแบบเรียลไทม์

เหตุผลหลักที่ต้องแยก:

- REST เหมาะกับข้อมูลแบบดึงครั้งเดียว/เป็นหน้า (เช่น ประวัติข้อความ, รายชื่อออนไลน์)
- SignalR เหมาะกับการส่ง/รับข้อความสดทันที

## ไฟล์ที่เกี่ยวข้อง

- src/app/chat/services/chat.service.ts
  - ศูนย์กลางการเรียก API และ SignalR
- src/app/chat/components/online-chat/online-chat.component.ts
  - คอมโพเนนต์ UI ที่จัดการ flow แชท
- src/app/chat/components/online-chat/online-chat.component.html
  - โครงสร้างหน้าจอแชท
- src/app/chat/components/online-chat/online-chat.component.css
  - สไตล์แชทแบบเรียบง่าย
- src/app/chat/models/chat.dto.ts
  - Model ของ OnlineUser/Conversation/Message

## REST API ที่ใช้ (พร้อมเหตุผล)

1. GET /api/presence/online

- ใช้เพื่อแสดงรายชื่อผู้ใช้ออนไลน์
- response: { "data": [ { user_id, display_name, last_seen_at } ] }
- ถูกเรียกแบบ interval ทุก 5 นาที
- ต้องใช้ JWT (Authorization: Bearer <token>)

2. POST /api/conversations (type=direct)

- ใช้สร้างห้องคุยแบบ 1-1
- payload: { "type": "direct", "participant_user_ids": [otherUserId] }
- server จะตรวจว่าห้องของคู่นี้มีอยู่แล้วหรือไม่ แล้วคืนห้องเดิมถ้ามี
- เหตุผล: ใช้เพื่อให้ client รู้ conversationId

3. POST /api/conversations/{id}/participants

- ใช้เพิ่มสมาชิกในห้อง (กรณี group)
- payload: { "user_id": 4 }
- ในระบบนี้ยังเน้น direct เป็นหลัก แต่มีไว้รองรับต่อยอด

4. GET /api/conversations/{id}/messages

- ใช้ดึงประวัติข้อความ
- query: beforeId, limit (max 100)
- เหตุผล: ข้อความย้อนหลังต้องดึงจาก REST

5. POST /api/conversations/{id}/read

- ใช้ส่ง read-receipt
- payload: { "message_id": 3 }
- เหตุผล: อัปเดตสถานะอ่านจากฝั่ง client

6. GET /api/conversations

- ใช้ดึงรายการห้องสนทนาทั้งหมดของผู้ใช้
- response: { "data": [ { conversation_id, type, name, other_user_id, other_display_name, last_message_at } ] }
- เหตุผล: แสดงรายการแชทเก่าและ auto-join ทุกห้อง

## SignalR ที่ใช้ (Realtime)

Hub URL: /hubs/chat

ขั้นตอนหลัก:

1. สร้าง HubConnection
2. start connection
3. JoinConversation(conversationId)
4. SendMessage(conversationId, body)
5. on("message", handler)

เหตุผลที่ใช้ SignalR:

- ให้ข้อความใหม่เด้งทันทีแบบ realtime
- ลดการ polling ต่อข้อความใหม่

เพิ่มเติม:

- Ping() ถูกเรียกทุก 120 วินาที เพื่ออัปเดต last_seen_at (presence)

## ฟังก์ชันสำคัญใน ChatService

### connect()

- ทำหน้าที่เปิด connection ไปที่ SignalR hub
- ถูกเรียกตอนคอมโพเนนต์แชทเปิด

### getOnlineUsers()

- เรียก GET /api/presence/online
- unwrap response ให้เหลือ array ของผู้ใช้ออนไลน์

### createDirectConversation(otherUserId)

- เรียก POST /api/conversations แบบ direct
- คืน conversation ที่สร้างใหม่ หรือห้องเดิมถ้ามีอยู่แล้ว

### addParticipant(conversationId, userId)

- เรียก POST /api/conversations/{id}/participants

### getMessages(conversationId, beforeId?, limit?)

- เรียก GET /api/conversations/{id}/messages
- รองรับ response ที่ wrap หลายรูปแบบ เช่น { data: [...] }, { messages: [...] }

### joinConversation(conversationId)

- invoke Hub method JoinConversation
- เก็บ conversationId ลงชุด joined เพื่อ rejoin หลัง reconnect

### sendMessage(conversationId, body)

- invoke Hub method SendMessage

### markRead(conversationId, lastMessageId?)

- เรียก POST /api/conversations/{id}/read
- payload: { message_id: lastMessageId }

### ensureHubConnection()

- ทำหน้าที่สร้างและเริ่ม HubConnection
- ถ้าเชื่อมอยู่แล้วจะไม่สร้างซ้ำ
- ตั้งค่า accessTokenFactory เพื่อส่ง JWT
- handle event "message" แล้วส่งต่อผ่าน message$ (Observable)
- รองรับ reconnect และ rejoin อัตโนมัติ

### getConversations()

- เรียก GET /api/conversations
- ใช้แสดงรายการแชทเก่าที่เคยคุย (แม้ผู้ใช้ออฟไลน์)

### ping()

- invoke Hub method Ping
- เรียกทุก 120 วินาทีเพื่อไม่ให้ presence หาย

## ฟังก์ชันสำคัญใน OnlineChatComponent

### ngOnInit()

- connect() ไปที่ SignalR hub
- โหลดรายชื่อออนไลน์ทันที
- ตั้ง interval ทุก 5 นาทีเพื่อ refresh presence
- ตั้ง interval ทุก 120 วินาทีเพื่อ Ping()
- subscribe message$ เพื่อรับข้อความใหม่

### refreshOnlineUsers()

- เรียก getOnlineUsers()
- แปลงผลเป็น UI list
- เรียก autoJoinOnlineUsers() เพื่อ join ห้องอัตโนมัติ (เฉพาะ direct กับคนที่ออนไลน์)

### startDirectChat(user)

- สร้าง/ดึงห้อง direct กับ user
- join ห้อง
- โหลดประวัติข้อความ

### loadMessages(reset)

- ดึงประวัติข้อความจาก REST
- merge ข้อความใหม่/เก่า ป้องกันการหายของข้อความ realtime

### sendMessage()

- ส่งข้อความผ่าน SignalR
- เคลียร์ input หลังส่งสำเร็จ

### handleIncomingMessage(message)

- ถ้ามาจากห้องใหม่ จะสลับไปที่ห้องนั้นทันที
- join ห้องและโหลดประวัติ
- ถ้าเป็นห้องเดิม จะ append ข้อความเข้า list

### autoJoinOnlineUsers()

- สำหรับผู้ใช้ที่ออนไลน์ทั้งหมด: สร้าง/ดึงห้อง direct
- join ห้องเพื่อให้รับ message ได้ทันที
- ทำครั้งเดียวต่อ user (กันยิงซ้ำ)

### markReadIfNeeded()

### refreshConversations()

- เรียก getConversations()
- แปลงเป็นรายการแชทเก่าใน UI
- autoJoinConversationList() เพื่อ join ทุกห้อง

### openConversation(convo)

- เปิดห้องจากรายการแชทเก่า
- join ห้องและโหลดประวัติ

### autoJoinConversationList()

- join ทุก conversation จากรายการแชทเก่า

- ถ้ามีข้อความ จะเรียก markRead ไปที่ API

## โฟลว์หลักแบบละเอียด

1. เปิดหน้าแชท

- connect() ไปที่ hub
- refreshOnlineUsers()
- refreshConversations()

2. แสดงรายชื่อออนไลน์

- GET /api/presence/online
- map เป็น UI
- autoJoinOnlineUsers() เพื่อ join ห้อง direct ที่เกี่ยวข้อง

3. ผู้ใช้กดเริ่มคุย

- POST /api/conversations (direct)
- ได้ conversationId
- JoinConversation(conversationId)
- GET /api/conversations/{id}/messages

4. ส่งข้อความ

- invoke SendMessage(conversationId, body)
- server broadcast message -> client receive ผ่าน on("message")

5. รับข้อความใหม่

- message$ ส่งเข้า component
- handleIncomingMessage() อัปเดต UI และ markRead

## หมายเหตุสำคัญ

- หากไม่ได้ JoinConversation จะไม่รับข้อความของห้องนั้น
- autoJoinOnlineUsers ช่วยให้รับข้อความจากคนออนไลน์ได้ทันที
- autoJoinConversationList ช่วยให้รับข้อความจากห้องที่เคยคุยได้ แม้คนออฟไลน์

## จุดที่สามารถต่อยอด

- เพิ่ม unread count / badge
- เพิ่มการแสดงสถานะ typing
- แยก direct/group UI ให้ชัดขึ้น
