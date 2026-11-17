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

## 🗺 Việc đề xuất tiếp theo (chưa làm)

1. **Thanh toán** — Stripe/Momo/VNPay webhook (`@nestjs/webhooks`), workflow nhiều ngày (`@nestjs/workflows`).
2. **Upload ảnh phòng thật** — `@nestjs/storage` (S3/local) thay vì URL Unsplash; liên quan BUG-02.
3. **Email** — xác nhận booking, quên mật khẩu (`@nestjs/mail`).
4. **Chính sách hủy** — chặn hủy sát ngày check-in (liên quan BUG-03).
5. **Phân trang** danh sách phòng + admin; sắp xếp theo giá/đánh giá.
6. **Job định kỳ** — tự complete booking quá hạn (`@nestjs/schedule`).
7. **Dark mode / i18n** cho frontend.
