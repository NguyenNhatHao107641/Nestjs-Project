# 📚 Hướng Dẫn Thuyết Trình Dự Án — Homestay Booking

> Tài liệu này giúp nhóm 3 người **chia việc, học và thuyết trình** về dự án
> **Website Quản lý và Đặt phòng Homestay / Khách sạn** (NestJS + MongoDB + Frontend StayNest).
> Mỗi thành viên phụ trách 1 phần, có thể đọc và trình bày độc lập, nhưng các phần
> liên kết với nhau qua luồng dữ liệu.

---

## 1. Tổng quan dự án (cả nhóm cùng biết)

| Mục | Nội dung |
|---|---|
| Tên dự án | Website Quản lý và Đặt phòng Homestay / Khách sạn |
| Kiến trúc | Modular & MVC (NestJS), MongoDB (Mongoose), REST + GraphQL |
| Vai trò người dùng | Admin, Host (chủ nhà), Customer (khách) |
| Tính năng chính | Đăng ký/đăng nhập JWT, CRUD phòng, lọc phòng nâng cao, đặt phòng (chống trùng lịch), quản lý đơn, đánh giá, phòng yêu thích, lịch trống, rate limiting |
| Frontend | Multi-page HTML tĩnh (StayNest) phục vụ bởi chính NestJS, Tailwind CDN, JS thuần |
| Tài liệu API | Swagger `/api/docs`, GraphQL Playground `/graphql` |
| Seed demo | `admin@/host@/customer@homestay.com` — mật khẩu `123456` |

**Luồng tổng thể (tóm tắt 1 câu):**
> Client (StayNest) → REST/GraphQL → NestJS (Guards/Pipes/Interceptors) → Service → Mongoose → MongoDB.

---

## 2. Phân chia 3 phần

| Thành viên | Phần | Trọng tâm | File chính |
|---|---|---|---|
| **TV1** | Kiến trúc & Nền tảng Backend | Bootstrap, Module, Config, DB, Auth (JWT), Users, Common (Guards/Filters/...) | `src/main.ts`, `app.module.ts`, `modules/auth`, `modules/users`, `common/*`, `config/*` |
| **TV2** | Nghiệp vụ cốt lõi & Dữ liệu | Rooms, Bookings, Reviews, Favorites, Seed, Helpers, Entities | `entities/*`, `modules/rooms`, `bookings`, `reviews`, `favorites`, `scripts/seed.ts` |
| **TV3** | Frontend StayNest & Tích hợp | Trang HTML, assets JS, GraphQL, Docs, Tests | `public/*`, `modules/graphql`, `docs/*`, `test/*` |

> Mỗi phần có file hướng dẫn riêng trong thư mục này:
> - [`part1-backend-foundation.md`](./part1-backend-foundation.md) — TV1
> - [`part2-business-logic.md`](./part2-business-logic.md) — TV2
> - [`part3-frontend-integration.md`](./part3-frontend-integration.md) — TV3

---

## 3. Lộ trình thuyết trình gợi ý (15–20 phút)

1. **Giới thiệu (1 phút)** — cả nhóm: tên dự án, mục tiêu, tech stack, 3 vai trò.
2. **TV1 (5 phút)** — kiến trúc NestJS, luồng request, Auth JWT + Refresh, RBAC, bảo mật (throttler).
3. **TV2 (6 phút)** — dữ liệu (schema), CRUD phòng + filter, luồng đặt phòng chống trùng lịch, tính tiền, review rating, favorites, availability.
4. **TV3 (5 phút)** — demo giao diện StayNest theo 3 vai trò, luồng FE (auto refresh token), GraphQL, Swagger, tài liệu.
5. **Kết luận & Q&A (3 phút)** — cả nhóm: điểm mạnh, hạn chế, hướng phát triển.

---

## 4. Checklist trước khi thuyết trình

- [ ] MongoDB đang chạy (`mongod` hoặc Atlas) — kiểm tra `MONGODB_URI` trong `.env`.
- [ ] Đã `npm run build` + `npm run seed` → có 3 tài khoản demo.
- [ ] Chạy `npm run start:dev`, mở `http://localhost:3000`.
- [ ] Mở sẵn tab Swagger `/api/docs` và GraphQL `/graphql`.
- [ ] Chuẩn bị 3 trình duyệt/profile để đăng nhập 3 vai trò đồng thời.
- [ ] Test nhanh: đặt phòng trùng lịch → phải ra lỗi 400 tiếng Việt.
- [ ] Test rate limit: đập login 11 lần → 429.

---

## 5. Câu hỏi thường gặp (cả nhóm nên thuộc)

- **Vì sao chọn NestJS + MongoDB?** → Modular, DI, decorator, dễ mở rộng; MongoDB linh hoạt schema cho phòng/booking.
- **JWT vs Session?** → Stateless, scale tốt, refresh token để bảo mật.
- **Chống trùng lịch đặt phòng xử lý thế nào?** → Query overlap: `checkInDate < checkOut && checkOutDate > checkIn` trên booking pending/confirmed.
- **RBAC ở đâu?** → `RolesGuard` + `@Roles()` decorator; server là nguồn chân lý, FE chỉ ẩn/hiện.
- **FE tự refresh token ra sao?** → `api.js` bắt 401 → gọi `/auth/refresh` → retry 1 lần → nếu vẫn 401 thì logout.
- **Rate limiting?** → `@nestjs/throttler`, guard toàn cục 120 req/phút/IP, siết riêng login/register/refresh/booking.
- **GraphQL làm gì?** → Cổng truy vấn phòng (`getRooms`, `getRoomById`) song song REST.
- **Điểm hạn chế / hướng phát triển?** → Thanh toán, upload ảnh thật, email, phân trang, job định kỳ (xem `docs/WORKLOG.md` phần "Việc đề xuất tiếp theo").

---

## 6. Bản đồ file → phần (tra cứu nhanh)

```
src/
├── main.ts, app.module.ts, app.controller.ts, app.service.ts   → TV1
├── config/configuration.ts                                     → TV1
├── entities/user.entity.ts                                     → TV1
├── common/* (decorators, filters, guards, interceptors,        → TV1
│   middlewares, pipes)
├── modules/auth/*                                              → TV1
├── modules/users/*                                             → TV1
│
├── entities/{room,booking,review,favorite}.entity.ts           → TV2
├── modules/rooms/*                                             → TV2
├── modules/bookings/*                                          → TV2
├── modules/reviews/*                                           → TV2
├── modules/favorites/*                                         → TV2
├── scripts/seed.ts                                             → TV2
├── utils/helpers.ts                                            → TV2
│
├── modules/graphql/*                                           → TV3
├── public/* (index, auth, room, favorites, my-bookings,        → TV3
│   profile, host, admin, assets/*)
├── docs/* (ARCHITECTURE, BUGS, WORKLOG, presentation/*)        → TV3
└── test/*                                                      → TV3
```
