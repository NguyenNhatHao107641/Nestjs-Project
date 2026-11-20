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
| **TV1** | Kiến trúc, Auth & Bảo mật | Bootstrap, Module, Config, DB, JWT/Refresh, Users, Guards/Filters/Interceptors, Rate limit, backend Chat | `src/main.ts`, `app.module.ts`, `modules/auth`, `modules/users`, `modules/chat`, `common/*`, `config/*` |
| **TV2** | Room, Booking & Nghiệp vụ cốt lõi | Schema dữ liệu, CRUD phòng, filter/pagination, availability, upload ảnh, booking, payment, cancellation, cron, reviews, favorites, seed | `entities/*`, `modules/rooms`, `bookings`, `reviews`, `favorites`, `tasks`, `scripts/seed.ts`, `utils/*` |
| **TV3** | Frontend & Tích hợp API | Các luồng giao diện theo vai trò, assets JS, GraphQL, Swagger, test và tài liệu | `public/*`, `modules/graphql`, `docs/*`, `test/*` |

> Mỗi phần có file hướng dẫn riêng trong thư mục này:
> - [`part1-backend-foundation.md`](./part1-backend-foundation.md) — TV1
> - [`part2-business-logic.md`](./part2-business-logic.md) — TV2
> - [`part3-frontend-integration.md`](./part3-frontend-integration.md) — TV3

---

## 3. Lộ trình thuyết trình gợi ý (15–20 phút)

1. **Giới thiệu (1 phút)** — cả nhóm: tên dự án, mục tiêu, tech stack, 3 vai trò.
2. **TV1 (5 phút)** — kiến trúc NestJS, luồng request, Auth JWT + Refresh, RBAC, rate limiting và Chat backend.
3. **TV2 (7 phút)** — schema, CRUD/filter/pagination phòng, availability, overlap booking, tính tiền, payment/cancellation, review, favorites và seed.
4. **TV3 (5 phút)** — demo 3 vai trò, luồng frontend gọi API, auto refresh token, GraphQL, Swagger và test.
5. **Kết luận & Q&A (2 phút)** — cả nhóm: điểm mạnh, hạn chế, hướng phát triển.

---

## 4. Checklist trước khi thuyết trình

- [ ] MongoDB đang chạy (`mongod` hoặc Atlas) — kiểm tra `MONGODB_URI` trong `.env`.
- [ ] Đã `npm run build` + `npm run seed` → có 3 tài khoản demo.
- [ ] Chạy `npm run start:dev`, mở `http://localhost:3000`.
- [ ] Mở sẵn tab Swagger `/api/docs` và GraphQL `/graphql`.
- [ ] Chuẩn bị 3 trình duyệt/profile để đăng nhập 3 vai trò đồng thời.
- [ ] Test nhanh: đặt phòng trùng lịch → phải ra lỗi 400 tiếng Việt.
- [ ] Test phân trang: trang chủ hiển thị tối đa 12 phòng/trang; chuyển trang 2 và giữ được bộ lọc.
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
- **Điểm hạn chế / hướng phát triển?** → Thanh toán thật qua cổng bên thứ ba, email SMTP production, lưu ảnh S3/Cloudinary, chat realtime và cache phân tán.

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
├── modules/tasks/*                                             → TV2
├── public/* (index, auth, room, favorites, my-bookings,        → TV3
│   profile, host, admin, assets/*)
├── docs/* (ARCHITECTURE, BUGS, WORKLOG, presentation/*)        → TV3
└── test/*                                                      → TV3
```
