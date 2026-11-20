# Nhật Ký Công Việc (Worklog)

Ghi lại các phần việc đã thực hiện trên dự án **Website Quản lý và Đặt phòng Homestay / Khách sạn**.
Lỗi kỹ thuật được theo dõi riêng tại `docs/BUGS.md`; kiến trúc tổng thể tại `docs/ARCHITECTURE.md`.

---

## 📅 [2026-11-17] Phiên 3 — Favorites, Availability, Rate Limiting

### 1. Phòng yêu thích (Favorites) — lưu trên server
Trước đây nút ♥ trên trang chủ chỉ lưu `localStorage` (mất khi đổi máy/trình duyệt).

- **Entity mới** `src/entities/favorite.entity.ts`: `Favorite { userId, roomId, createdAt }` với index kép unique `(userId, roomId)` — 1 người chỉ lưu mỗi phòng 1 lần.
- **Module mới** `src/modules/favorites/` (service + controller + module), API:
  - `GET /api/favorites` — danh sách phòng đã lưu (populate Room, sort mới nhất)
  - `GET /api/favorites/ids` — mảng ID nhẹ, dùng tô màu nút ♥ trên card
  - `POST /api/favorites/:roomId/toggle` — bật/tắt, trả `{ favorited, message }`
  - `POST /api/favorites/:roomId` — thêm (idempotent, `updateOne` + `upsert` + `$setOnInsert`)
  - `DELETE /api/favorites/:roomId` — xóa (404 nếu chưa lưu)
  - Tất cả yêu cầu `JwtAuthGuard`; handle duplicate key `11000` khi race 2 lần toggle.
- **Frontend:**
  - `assets/ui.js`: thêm engine dùng chung — `UI.favorites` (`load()/has()/toggle()`), `UI.favBtnHTML()`, `UI.bindFavButtons(root, onDone)`; nav + dropdown avatar có mục "Phòng yêu thích"; khách chưa đăng nhập bấm ♥ → toast mời đăng nhập + redirect `auth.html?next=...`
  - `index.html`: thay logic localStorage bằng `UI.favorites` (nạp IDs 1 lần mỗi phiên trước khi render grid)
  - **Trang mới** `public/favorites.html`: grid phòng đã lưu, bấm ♥ → gỡ khỏi danh sách ngay (xóa thẻ), empty state có CTA "Khám phá homestay", guard `requireAuth()`.

### 2. Lịch trống phòng (Availability)
Backend **đã có sẵn** check trùng lịch trong `bookings.service.ts` (lần làm trước); lần này bổ sung phần còn thiếu — tra cứu & hiển thị:

- **API công khai** `GET /api/rooms/:id/availability` (trong `RoomsController`, không cần đăng nhập): trả các khoảng `checkInDate → checkOutDate` của booking `pending/confirmed` chưa qua (`checkOutDate > now`), sort theo ngày nhận.
  - `RoomsModule` inject thêm `Booking` schema; `RoomsService.findAvailability()` mới.
- **Frontend** `room.html`:
  - Khối "Ngày đã có khách đặt" trong thẻ đặt phòng (danh sách `✗ dd/MM → dd/MM`).
  - Hàm `overlapsBooked()` **chặn trước** khi chọn ngày trùng → banner cảnh báo ngay, không tốn round-trip; backend vẫn chặn lớp 2 khi `POST /bookings`.

### 3. Rate Limiting (`@nestjs/throttler` v6.8 — tương thích Nest 12)
- `src/common/guards/vn-throttler.guard.ts`: `VNThrottlerGuard` kế thừa `ThrottlerGuard`, ghi đè `throwThrottlingException` → thông báo 429 tiếng Việt: *"Bạn thao tác quá nhanh, vui lòng đợi một phút rồi thử lại."*
- Đăng ký qua `APP_GUARD` trong `app.module.ts` + `ThrottlerModule.forRoot` mặc định **120 req/phút/IP**.
- Siết riêng bằng `@Throttle`:
  | Route | Giới hạn |
  |---|---|
  | `POST /auth/register` | 5/phút/IP (chống spam tài khoản) |
  | `POST /auth/login` | 10/phút/IP (chống dò mật khẩu) |
  | `POST /auth/refresh` | 20/phút/IP |
  | `POST /bookings` | 20/phút |

### 4. Bug phát hiện & sửa trong lần verify này
- **`room.html` `showBanner()` crash im lặng** (bug tiềm ẩn từ trước, đúng nhánh mới lộ ra): gọi `showBanner('bookBanner', …)` nhưng `$ = document.querySelector` cần `#bookBanner` → `querySelector('bookBanner')` trả `null` → `TypeError: Cannot set properties of null`, banner không bao giờ hiện.
  - Sửa: `showBanner` chấp nhận cả hai dạng — `$(id.startsWith('#') ? id : '#' + id)`.

### 5. Kết quả kiểm thử (trình duyệt thật + API)
| Kiểm tra | Kết quả |
|---|---|
| Nav/dropdown "Yêu thích" hiện đúng khi đăng nhập, active highlight | ✅ |
| Bấm ♥ trang chủ → toast + tô đỏ + server ghi nhận (`GET /favorites/ids` khớp) | ✅ |
| `favorites.html`: render phòng, bấm ♥ → gỡ thẻ + empty state | ✅ |
| Room detail: khối "Ngày đã có khách đặt" hiển thị khoảng đã đặt | ✅ |
| Chọn ngày trùng → banner ⚠ chặn ngay tại client | ✅ |
| POST trùng lịch thẳng API → `400` "Phòng này đã được khách khác đặt…" | ✅ |
| Đập login 12 lần → 10×401 rồi `429` tiếng Việt | ✅ |
| Unit 1/1 + E2E 2/2 pass sau thay đổi backend | ✅ |
| Dọn dữ liệu test (hủy booking test, bỏ favorite test) | ✅ |

**File thay đổi:** `src/entities/favorite.entity.ts`, `src/modules/favorites/*`, `src/modules/rooms/{rooms.module,rooms.service,rooms.controller}.ts`, `src/modules/auth/auth.controller.ts`, `src/modules/bookings/bookings.controller.ts`, `src/common/guards/vn-throttler.guard.ts`, `src/app.module.ts`, `src/main.ts`, `public/assets/ui.js`, `public/index.html`, `public/room.html`, **`public/favorites.html` (mới)**, `docs/ARCHITECTURE.md`.

---

## 📅 [2026-11-16] Phiên 2 — Xây dựng Frontend StayNest hoàn chỉnh

### Frontend multi-page (thư mục `public/`, phục vụ bởi chính NestJS)
- `main.ts`: chuyển sang `NestExpressApplication` + `app.useStaticAssets(join(process.cwd(), 'public'), { index: 'index.html' })`; endpoint thông tin hệ thống `GET /api`.
- 7 trang: `index` (hero, search nổi, filter, modal đặt nhanh, đăng nhập nhanh), `auth` (login/register, `?next=`), `room` (gallery, đánh giá), `my-bookings` (filter, hủy), `profile`, `host` (stats, CRUD phòng, quản lý đơn), `admin` (users, đơn, stats).
- `assets/` dùng chung: `api.js` (fetch wrapper + auto refresh 401), `auth.js` (RBAC `requireAuth/requireRole`), `ui.js` (header theo vai trò, toast, badge, roomCard).
- Design: Teal `#0D9488` / Rose `#F43F5E`, `transition-all duration-200`, `rounded-2xl`, ảnh 4:3 zoom, text 100% tiếng Việt.
- Verify toàn bộ trong trình duyệt với 3 vai trò demo.

### Bug đã sửa (chi tiết tại `docs/BUGS.md`)
- Frontend: `setError` tìm `.error` sai scope (auth/profile/index/host); thiếu CSS `.modal-hidden` trong `host.html`; `switchTab` thiếu `#` prefix; role-pill đăng ký (`absolute inset-0` che form + pill host luôn sáng); fallback gradient khi Unsplash bị chặn.
- Backend: so sánh `toString()` trên object đã `populate` → 403 khi customer hủy đơn (`bookings.service.ts`) và host sửa/xóa phòng (`rooms.service.ts`) — pattern sửa: `(obj._id ?? obj)` trước khi so sánh.
- Test: `test/app.e2e-spec.ts` replicate đúng bootstrap `main.ts` (static assets + pipes + filter + interceptor) → 2/2 pass.
- `docs/ARCHITECTURE.md`: bổ sung mục Frontend (cấu trúc, RBAC table, mermaid refresh-token, vận hành).

---

## 📅 [2026-11-16] Phiên 1 — Backend nền tảng (trước khi có frontend)

- Module REST: Auth (JWT + refresh token, bcrypt), Users, Rooms (filter city/roomType/guests/giá/keyword), Bookings (đặt phòng, check trùng lịch overlap, phân quyền host/customer/admin), Reviews (rating trung bình tự cập nhật).
- GraphQL playground tại `/graphql`, Swagger tại `/api/docs`.
- Seed script (`npm run seed`): 3 tài khoản demo `customer@/host@/admin@homestay.com` (mật khẩu `123456`), dữ liệu phòng mẫu.
- Cấu trúc theo module Bài 02–14 của giáo trình; Mongo tại `mongodb://127.0.0.1:27017/homestay_booking`.

---

## 📅 [2026-11-20] Phiên 4 — Sửa Chatbox AI (không chạy)

### Vấn đề gốc
- `POST /chat` trả `503 "Chưa cấu hình GEMINI_API_KEY"` vì `.env` không có key → chat không chạy được.
- `chat.js` bị **mojibake** (UTF-8 bị lưu sai codepage) → toàn bộ text tiếng Việt hiển thị ký tự rác.
- Model mặc định `gemini-3.5-flash-lite` không tồn tại → sẽ 404 ngay cả khi có key.
- Logic parse ngân sách: từ "khách" bị khớp nhầm thành đơn vị "k" (nghìn) → `maxPrice = 2000đ`, lọc sạch mọi phòng.

### Đã sửa
- `chat.service.ts`: thêm **chế độ cơ bản (rule-based)** khi không có `GEMINI_API_KEY` — trả lời tiếng Việt từ dữ liệu phòng trong DB, khớp địa điểm/giá/số khách/tiện ích, gợi ý top 3 phòng. Widget luôn chạy được mà không cần key.
- Model mặc định đổi thành `gemini-2.0-flash` (hợp lệ); vẫn cho phép override qua `GEMINI_MODEL`.
- Sửa regex parse ngân sách: `(triệu|trien|nghìn|ngàn|tr|k)(?![a-zà-ỹ])` — không còn khớp "khách".
- `chat.js`: viết lại toàn bộ với UTF-8 chuẩn (text tiếng Việt đúng, emoji 💬).
- `.env` và `.env.example`: thêm `GEMINI_API_KEY=` (để trống → chế độ cơ bản) + `GEMINI_MODEL=gemini-2.0-flash`, kèm hướng dẫn lấy key tại aistudio.google.com.
- Verify: `POST /chat` trả `200` với câu trả lời tiếng Việt đúng ngữ cảnh (Đà Lạt/2 khách/<1 triệu → Wilder-Nest 950.000đ); `chat.js` HTTP 200 `text/javascript; charset=utf-8`.

> Muốn bật AI nâng cao: điền `GEMINI_API_KEY` vào `.env` rồi restart server (`npm run start:dev` watch mode tự rebuild).

## 📅 [2026-11-20] Phiên 5 — Triển khai các tính năng đề xuất còn lại

Đã triển khai **7 tính năng** còn trong danh sách "Việc đề xuất tiếp theo", đồng thời sửa lỗi app.module bị mất imports feature modules.

### 1. Chính sách hủy (Cancellation Policy)
- `bookings.service.ts` `updateStatus`: khách chỉ được hủy **trước 24 giờ** so với ngày nhận phòng; đơn đã `completed/cancelled` không đổi trạng thái; nếu hủy đơn đã thanh toán → tự động `paymentStatus = refunded`.

### 2. Phân trang (Pagination)
- `FilterRoomDto`: thêm `page`, `limit`.
- `RoomsService.findAll`: khi có `page/limit` trả `{ items, total, page, limit, totalPages }`; không có → trả mảng (backward compat, frontend cũ không vỡ).
- `GET /rooms?page=1&limit=12`.

### 3. Upload ảnh phòng
- `POST /rooms/:id/images` (multipart, host/admin, tối đa 5MB, chỉ image/*), lưu vào `public/uploads/rooms/`, append URL vào `room.images`.
- Kiểm tra quyền chủ phòng/admin trong service.

### 4. Email (SMTP, best-effort)
- Dùng `nodemailer` trực tiếp (tránh vấn đề export của `@nestjs/mail`); chỉ gửi khi cấu hình `SMTP_HOST`; nếu không, ghi log `[email:skip]` và không làm fail request.
- Gửi email xác nhận khi đặt phòng và biên lai khi thanh toán.
- Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

### 5. Job định kỳ (Cron)
- `TasksModule` + `TasksService` với `@Cron(EVERY_DAY_AT_MIDNIGHT)`: tự động chuyển đơn `confirmed` đã quá hạn checkout → `completed` (qua `BookingsService.autoCompleteExpired()`).

### 6. Thanh toán (giả lập)
- `POST /bookings/:id/pay` (customer/admin): đánh dấu `paymentStatus = paid`, gửi biên lai email.
- `PATCH /bookings/:id/refund` (admin): đánh dấu `refunded`.
- Hủy đơn đã thanh toán → tự hoàn tiền.

### 7. Dark mode
- Tailwind `darkMode: 'class'` trên 8 trang; class `dark:bg-slate-900 dark:text-slate-100` trên body.
- Nút 🌙/☀️ trong header (`ui.js`), lưu `localStorage.staynest_dark`, áp dụng khi tải trang (persist qua reload).

### Bug phát hiện & sửa
- `app.module.ts`: khi thêm ScheduleModule, **vô tình xóa toàn bộ feature modules** khỏi `imports` → server chỉ đăng ký `AppController` (mọi API trả 404). Đã khôi phục: UsersModule, AuthModule, RoomsModule, BookingsModule, ReviewsModule, FavoritesModule, TasksModule, ChatModule, AppGraphQLModule.
- `@nestjs/mail` export `MailerModule` không tồn tại (đúng là `MailModule`) và `transport` phải là instance `MailTransport` → chuyển sang `nodemailer` trực tiếp để tránh lỗi DI.

### Kết quả kiểm thử
- Unit 1/1 + E2E 2/2 pass.
- `GET /rooms?page=1&limit=1` → `{ total, page, items }` ✅
- `POST /bookings/:id/pay` → `paymentStatus: paid` ✅
- `POST /rooms/:id/images` (không file) → `400 "Thiếu file ảnh"` (route hoạt động) ✅
- Dark mode toggle persist qua reload ✅
- `npm run build` thành công.

1. **Thanh toán** — Stripe/Momo/VNPay webhook (`@nestjs/webhooks`), workflow nhiều ngày (`@nestjs/workflows`).
2. **Upload ảnh phòng thật** — `@nestjs/storage` (S3/local) thay vì URL Unsplash; liên quan BUG-02.
3. **Email** — xác nhận booking, quên mật khẩu (`@nestjs/mail`).
4. **Chính sách hủy** — chặn hủy sát ngày check-in (liên quan BUG-03).
5. **Phân trang** danh sách phòng + admin; sắp xếp theo giá/đánh giá.
6. **Job định kỳ** — tự complete booking quá hạn (`@nestjs/schedule`).
7. **Dark mode / i18n** cho frontend.


## 📅 [2026-11-20] Phiên 6 — Chatbox: tự động đổi model khi quá tải / không khả dụng

- `chat.service.ts`: thêm **fallback chain** model — thử model chính (env `GEMINI_MODEL`, mặc định `gemini-2.0-flash`) → `gemini-2.0-flash` → `gemini-2.0-flash-lite` → `gemini-1.5-flash`. Nếu model bị quá tải / 404 / 429 / 5xx → tự chuyển model tiếp theo (retry 2 lần mỗi model).
- Nếu **tất cả model đều thất bại** → không còn trả 503 nữa, mà **fallback sang chế độ cơ bản** (rule-based từ DB) kèm ghi chú "AI Gemini đang quá tải/không khả dụng". Chat luôn trả lời 200.
- Verify: đặt `GEMINI_MODEL=gemini-3.8-nonexistent` → chat vẫn trả 200 với câu trả lời từ dữ liệu phòng.
