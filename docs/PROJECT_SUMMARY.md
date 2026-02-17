# Project Summary

Last updated: 2026-02-13

## Stack and Structure

- Frontend: Angular (modules for users, products, notes, auth)
- Routing: AppRoutingModule (login/register + guarded users/products)
- Config: API base URL loaded from assets via AppConfigService (global apiUrl)

Main areas:

- auth: login/register UI, auth service, guard, auth DTOs
- users: user list UI with edit and active toggle
- products: list/detail
- notes: user notes

## API Endpoints Used

- POST /api/login (login)
- POST /api/users (create user)
- POST /api/login-events/client-info (store client info)
- GET /api/users (list users)
- PUT /api/users/{id}/display-name (edit display name)
- PUT /api/users/{id}/is-active (toggle active)
- GET /api/presence/online (online users)
- POST /api/login/logout (logout)
- POST /api/conversations (create or reuse direct/group)
- POST /api/conversations/{id}/participants (add participant)
- GET /api/conversations (list user conversations)
- GET /api/conversations/{id}/messages (message history)
- POST /api/conversations/{id}/read (read receipt)

Login response shape (expected):

- { data: { id: number, display_name: string, ... } }

## Auth Flow

- Login submits email/password, then on success:
  - Stores login state and user info (id, display_name)
  - Fetches public IP via ipify and sends to /api/login-events/client-info with user_id
  - Navigates to /users
- Register creates user with email/password/display_name
- Users/products routes are protected by AuthGuard
- Logout clears auth cookies and redirects to /login

## Cookies and State

Auth cookies:

- auth_logged_in: true/false (7 days)
- auth_user_id: user id (7 days)
- auth_display_name: display name (7 days)

Users filter cookie:

- users_only_active: true/false (30 days)
- If old localStorage key users.onlyActive exists, it is migrated once and removed

## UI Details

- Login/Register form validation:
  - email required, valid, max 255
  - password required
  - display_name required, max 100
- Error messages translated from API message field (Thai)
- Users page shows current logged-in user name, id, and active status
- Active status updates when toggle is used in the list
- Users page includes chat panel: recent chats + online users + message view

## Files Added/Changed (Key)

Auth:

- src/app/auth/auth.module.ts
- src/app/auth/auth.guard.ts
- src/app/auth/models/auth.dto.ts
- src/app/auth/services/auth.service.ts
- src/app/auth/components/login/login.component.ts
- src/app/auth/components/login/login.component.html
- src/app/auth/components/login/login.component.css
- src/app/auth/components/register/register.component.ts
- src/app/auth/components/register/register.component.html
- src/app/auth/components/register/register.component.css

App:

- src/app/app-routing.module.ts
- src/app/app.module.ts
- src/app/app.component.ts
- src/app/app.component.html
- src/app/app.component.css

Users:

- src/app/users/component/user-list/user-list.component.ts
- src/app/users/component/user-list/user-list.component.html
- src/app/users/component/user-list/user-list.component.css

## Important Notes

- MAC address cannot be read from a browser. Only IP is sent (public IP via ipify).
- /api/login-events/client-info currently accepts only ip_address and user_id.
- currentUser$ naming uses RxJS convention for Observable streams.

## Current Status

- Login, register, guard, logout, and user display are implemented.
- Client-info post is sent after login succeeds with ip_address and user_id.
- Users/products only visible and accessible after login.
- Chat supports SignalR send/receive and REST history, with presence ping.

## Open Questions / Next Steps

- If /api/login-events/client-info should accept more fields, define schema.
- If you want server-side identification improvements, consider backend session_id or device_id.
- Consider adding typing indicators or unread counts for chat.
