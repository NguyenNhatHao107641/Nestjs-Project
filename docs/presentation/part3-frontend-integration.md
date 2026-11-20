# Phần 3 — Frontend StayNest & Tích hợp (Thành viên 3)

> **Phạm vi:** Giao diện web đa trang (StayNest) phục vụ bởi chính NestJS, các asset JS dùng chung
> (api/auth/ui), phân quyền hiển thị theo vai trò, phân trang/phòng yêu thích/lịch trống phía client,
> cổng GraphQL, tài liệu dự án và test (unit/e2e). TV3 tập trung demo tích hợp; không cần trình bày sâu toàn bộ nghiệp vụ backend.

## 1. Mục tiêu phần này

- Hiểu cách NestJS phục vụ frontend tĩnh và tích hợp FE-BE.
- Hiểu luồng xác thực phía client: auto refresh token, RBAC redirect.
- Biết các trang và vai trò; demo end-to-end 3 vai trò.
- Biết GraphQL playground và Swagger; biết tài liệu & test.

## 2. File phụ trách

```
public/
  assets/api.js        # Fetch wrapper: Bearer token, auto refresh 401, chuẩn hóa lỗi
  assets/auth.js       # Trạng thái login + RBAC: requireAuth, requireRole, Auth.*
  assets/ui.js         # Header theo vai trò, toast, badge, roomCard, favorites engine
   index.html           # Trang chủ: hero, search, filter, pagination 12 phòng/trang, modal đặt nhanh, ♥
  auth.html            # Đăng nhập/Đăng ký (tab, chọn vai trò)
  room.html            # Chi tiết: gallery, tiện ích, đặt phòng, đánh giá, ♥, lịch trống
  favorites.html       # Phòng yêu thích (grid, gỡ)
  my-bookings.html     # Đơn của khách: filter, hủy
  profile.html         # Xem/sửa hồ sơ
  host.html            # Dashboard chủ nhà: stats, CRUD phòng, quản lý đơn
  admin.html           # Quản trị: stats, users, tất cả đơn
src/modules/graphql/   # app-graphql.module, types/room.type, resolvers/room.resolver
docs/ARCHITECTURE.md, BUGS.md, WORKLOG.md, presentation/*
test/ (app.e2e-spec.ts, *.spec.ts)
```

## 3. Frontend StayNest — tổng quan

- **Multi-page HTML tĩnh**, không build step. Tailwind qua CDN, JS thuần (vanilla).
- NestJS phục vụ qua `app.useStaticAssets(join(process.cwd(), 'public'), { index: 'index.html' })` với `NestExpressApplication`.
- `express.static` chạy trước router Nest: file tồn tại → trả file; không có → next() tới API.
- Vì vậy endpoint hệ thống là `GET /api` (trang chủ tĩnh chiếm `/`).

## 4. Assets dùng chung

**`api.js` — Fetch wrapper:**
- Gắn `Authorization: Bearer <access_token>` tự động.
- Bắt 401 → gọi `Auth.refreshTokens()` (`POST /auth/refresh`) → retry request 1 lần.
- Nếu vẫn 401 → clear session + redirect `auth.html`.
- Chuẩn hóa lỗi theo `HttpExceptionFilter` `{ statusCode, message }`.

**`auth.js` — Trạng thái & RBAC:**
- Lưu token trong `localStorage` (`access_token`, `refresh_token`, `current_user`).
- `Auth.loadUser()`, `login/register/logout/refreshTokens`.
- `requireAuth()` → chưa login redirect `auth.html?mode=login&next=...`.
- `requireRole(roles)` → sai vai trò redirect `index.html?denied=1` + toast.
- `Auth.isHost()/isAdmin()`.

**`ui.js` — UI dùng chung:**
- Header động theo vai trò (menu avatar + đăng xuất).
- Toast, badge trạng thái, renderer thẻ phòng (`roomCard`).
- Favorites engine: `UI.favorites.load()/has()/toggle()`, `UI.favBtnHTML()`, `UI.bindFavButtons()`.
- Nav có mục "Phòng yêu thích" khi đã login.

## 5. Phân quyền hiển thị (client)

| Vai trò | Header/Nav | Trang truy cập |
|---|---|---|
| Khách (chưa login) | Đăng nhập/Đăng ký | index, room, auth |
| customer | + Yêu thích, Đơn của tôi | + favorites, my-bookings, profile |
| host | + Yêu thích, Đơn của tôi, Dashboard chủ nhà | + host (CRUD phòng, đơn vào phòng) |
| admin | + Yêu thích, Đơn của tôi, Dashboard chủ nhà, Quản trị | + admin (users, tất cả đơn), host |

> **Lưu ý:** Client chỉ ẩn/hiện nút; server (`JwtAuthGuard`/`RolesGuard`) là nguồn chân lý. Sai vai trò → redirect.

## 6. Luồng xác thực phía frontend

```
Trang HTML → Auth.loadUser() → api.js GET /users/me (Bearer)
  → 401? → Auth.refreshTokens() → POST /auth/refresh
  → accessToken mới → retry 1 lần
  → vẫn 401? → clearSession + redirect auth.html
```

## 7. Phòng yêu thích & lịch trống (FE)

- **Favorites:** nút ♥ trên card; click → `UI.favorites.toggle(roomId)` → toast + tô đỏ; `favorites.html` grid phòng đã lưu, bấm ♥ → gỡ thẻ; empty state CTA.
- **Availability:** `room.html` gọi `GET /rooms/:id/availability` → khối "Ngày đã có khách đặt" (✗ dd/MM → dd/MM); hàm `overlapsBooked()` chặn chọn ngày trùng trước khi gửi; backend vẫn chặn lớp 2.
- **Pagination:** `index.html` gọi `GET /rooms?page=1&limit=12`; chuyển trang giữ nguyên bộ lọc, thay đổi filter sẽ reset về trang 1.

## 8. GraphQL

- Apollo Server + `@as-integrations/express5` (tương thích Express 5 / Nest 12).
- Playground tại `/graphql`.
- `RoomResolver`: queries `getRooms`, `getRoomById`.
- Types: `RoomGqlType`, `AddressGqlType`.
- Song song REST — demo query phòng qua GraphQL.

## 9. Tài liệu & Test

- `docs/ARCHITECTURE.md`: bản đồ thư mục, luồng nghiệp vụ, FE RBAC, mermaid.
- `docs/BUGS.md`: bug tracker (open/resolved).
- `docs/WORKLOG.md`: nhật ký theo phiên + việc đề xuất tiếp theo.
- `docs/presentation/*`: tài liệu thuyết trình (file này).
- Test: `npm run test` (unit), `npm run test:e2e` (e2e). E2E replicate bootstrap main.ts (static + pipes + filter + interceptor) → 2/2 pass.

## 10. Demo gợi ý (TV3) — kịch bản end-to-end

1. **Khách (chưa login):** trang chủ → tìm phòng theo thành phố/giá → xem chi tiết phòng → khối lịch trống.
2. **Đăng ký/Đăng nhập:** `auth.html` → chọn vai trò customer/host.
3. **Customer:** đặt phòng (modal đặt nhanh) → `my-bookings.html` (filter, hủy) → ♥ lưu phòng → `favorites.html`.
4. **Host:** `host.html` → stats, tạo/sửa/xóa phòng của mình → quản lý đơn (confirm/complete/cancel).
5. **Admin:** `admin.html` → stats, quản lý users (tìm/xóa), tất cả đơn + đổi trạng thái.
6. **GraphQL:** `/graphql` → query `getRooms`.
7. **Swagger:** `/api/docs` → Authorize → thử endpoint.
8. **Rate limit:** đập login → 429 tiếng Việt.

## 11. Câu hỏi likely (TV3)

- **Vì sao FE là HTML tĩnh chứ không phải React/Angular?** → Đơn giản, không build step, NestJS phục vụ trực tiếp, phù hợp môn học; tách rõ BE/FE qua API.
- **Auto refresh token xử lý thế nào?** → `api.js` bắt 401, gọi refresh, retry 1 lần, thất bại thì logout.
- **RBAC phía client có đủ bảo mật không?** → Không, chỉ UX; server là nguồn chân lý với Guards.
- **GraphQL vs REST khác nhau thế nào trong dự án?** → REST đầy đủ CRUD + auth; GraphQL cung cấp query phòng linh hoạt; cùng DB.
- **E2E test replicate bootstrap để làm gì?** → Đảm bảo test môi trường giống production (static, pipes, filter, interceptor).
- **Rate limit FE có bị ảnh hưởng?** → 429 trả tiếng Việt, FE hiển thị toast.

## 12. Chat AI tư vấn (widget + backend)

- **Backend:** module `src/modules/chat/` — `POST /chat` (throttled 20/phút) nhận `{ message, history }`, service gọi Google Gemini kèm ngữ cảnh phòng từ DB (tên, thành phố, giá, sức chứa, tiện ích, rating). Cần `GEMINI_API_KEY` trong `.env`.
- **Frontend:** `public/assets/chat.js` — nút nổi 💬 góc phải dưới, panel chat, gửi lịch sử, render trả lời. Đã nhúng vào mọi trang HTML.
- **Demo:** bấm 💬 → hỏi "Tìm phòng ở Hà Nội dưới 1 triệu cho 2 người" → AI gợi ý phòng phù hợp.

## 13. Ghi chú học thêm

- Tailwind CDN, fetch API, localStorage, DOM manipulation.
- `docs/ARCHITECTURE.md` mục Frontend (cấu trúc, RBAC table, mermaid refresh-token, vận hành).
- `docs/WORKLOG.md` để biết tiến độ & các tính năng đã làm theo phiên.
