# Website Quản lý và Đặt phòng Homestay / Khách sạn (NestJS + MongoDB)

Dự án được xây dựng hoàn chỉnh theo chuẩn kiến trúc NestJS, áp dụng đầy đủ kiến thức từ **Bài 01 đến Bài 14** trong chương trình đào tạo NestJS của kspace.vn.

---

## 📑 Bảng Ánh Xạ 14 Bài Học Vào Dự Án

| Bài học | Chủ đề | Vị trí áp dụng trong mã nguồn |
| :--- | :--- | :--- |
| **Bài 01** | Cài đặt & Môi trường NestJS | Cấu hình `@nestjs/cli`, `package.json`, TypeScript nodenext ESM |
| **Bài 02** | Kiến trúc dự án Modular & MVC | Phân bổ chuẩn: `src/modules/`, `src/common/`, `src/config/`, `src/entities/`, `src/utils/` |
| **Bài 03** | Service & Dependency Injection | Tiêm `@Injectable()` vào các Service: `UsersService`, `RoomsService`, `BookingsService`, `ReviewsService`, `AuthService` |
| **Bài 04** | Routing & Controllers | Các Controllers chuẩn RESTful: `UsersController`, `RoomsController`, `BookingsController`, `ReviewsController`, `AuthController` |
| **Bài 05** | Database MongoDB & Schemas | Kết nối MongoDB qua `@nestjs/mongoose`, định nghĩa Schemas tại `src/entities/` (`User`, `Room`, `Booking`, `Review`) |
| **Bài 06** | RESTful API CRUD Hoàn Chỉnh | Đầy đủ chức năng Thêm - Xem - Sửa - Xóa cho Phòng, Người dùng, Đặt phòng |
| **Bài 07** | Validation & Pipe | `ValidationPipe` toàn cục trong `main.ts`, `class-validator` trong tất cả DTOs, custom `ParseObjectIdPipe` kiểm tra ID MongoDB |
| **Bài 08** | Middleware Global & Routing | `LoggerMiddleware` trong `src/common/middlewares/` ghi log mọi HTTP request (method, url, IP, execution time) |
| **Bài 09** | Authentication JWT & Passport | `AuthModule`, `JwtStrategy`, `JwtAuthGuard`, phân quyền `RolesGuard` với các vai trò `admin`, `host`, `customer` |
| **Bài 10** | Refresh Token | Cấp cặp `accessToken` + `refreshToken`, lưu hash refresh token trong MongoDB, endpoint `/auth/refresh` và `/auth/logout` |
| **Bài 11** | Biến môi trường (.env) | `ConfigModule.forRoot`, `src/config/configuration.ts`, đọc biến từ file `.env` qua `ConfigService` |
| **Bài 12** | Exception Handling & Logging | `HttpExceptionFilter` chuẩn hóa response lỗi `{ statusCode, timestamp, path, method, message, error }`, dùng NestJS `Logger` |
| **Bài 13** | GraphQL API trong NestJS | `AppGraphQLModule` (`@nestjs/graphql`, Apollo Driver), GraphQL Resolver `RoomResolver` tại `/graphql` |
| **Bài 14** | Đồ án hoàn chỉnh Homestay Booking | Nghiệp vụ kiểm tra trùng lịch phòng (Conflict Overlap), tính tiền tự động theo số đêm, đánh giá & sao rating, Swagger UI |

---

## 📂 Cấu Trúc Thư Mục Chuẩn (Theo Bài 02)

```
src/
├── main.ts                          # File khởi chạy ứng dụng (Bootstrap, CORS, Swagger, Global Pipes/Filters)
├── app.module.ts                    # Root Module kết nối Config, MongoDB, Middleware và các Module con
├── app.controller.ts                # Route mặc định thông tin hệ thống (GET /)
├── app.service.ts                   # Logic mặc định
│
├── modules/                         # Các module chức năng theo nghiệp vụ
│   ├── auth/                        # Xác thực người dùng (Bài 09, Bài 10)
│   │   ├── dto/                     # RegisterDto, LoginDto, RefreshTokenDto
│   │   ├── strategies/              # JwtStrategy (Passport)
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── users/                       # Quản lý người dùng
│   │   ├── dto/                     # CreateUserDto, UpdateUserDto
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── rooms/                       # Quản lý phòng & Homestay (Bài 06, Bài 14)
│   │   ├── dto/                     # CreateRoomDto, UpdateRoomDto, FilterRoomDto
│   │   ├── rooms.controller.ts
│   │   ├── rooms.service.ts
│   │   └── rooms.module.ts
│   │
│   ├── bookings/                    # Đặt phòng & Quản lý đơn đặt (Bài 06, Bài 14)
│   │   ├── dto/                     # CreateBookingDto, UpdateBookingStatusDto
│   │   ├── bookings.controller.ts
│   │   ├── bookings.service.ts
│   │   └── bookings.module.ts
│   │
│   ├── reviews/                     # Đánh giá & Bình luận phòng (Bài 14)
│   │   ├── dto/                     # CreateReviewDto
│   │   ├── reviews.controller.ts
│   │   ├── reviews.service.ts
│   │   └── reviews.module.ts
│   │
│   └── graphql/                     # GraphQL API (Bài 13)
│       ├── types/                   # RoomGqlType, AddressGqlType
│       ├── resolvers/               # RoomResolver
│       └── app-graphql.module.ts
│
├── common/                          # Các thành phần dùng chung trong hệ thống
│   ├── decorators/                  # @Roles(), @CurrentUser()
│   ├── filters/                     # HttpExceptionFilter (Bài 12)
│   ├── guards/                      # JwtAuthGuard, RolesGuard (Bài 09)
│   ├── interceptors/                # TransformInterceptor (Bài 02)
│   ├── middlewares/                 # LoggerMiddleware (Bài 08)
│   └── pipes/                       # ParseObjectIdPipe (Bài 07)
│
├── config/                          # Quản lý cấu hình môi trường (Bài 11)
│   └── configuration.ts
│
├── entities/                        # Định nghĩa Schemas / Entities MongoDB (Bài 05)
│   ├── user.entity.ts
│   ├── room.entity.ts
│   ├── booking.entity.ts
│   └── review.entity.ts
│
├── scripts/                         # Script tiện ích
│   └── seed.ts                      # Script tạo dữ liệu mẫu khởi đầu
│
└── utils/                           # Hàm tiện ích trợ giúp (Bài 02)
    └── helpers.ts                   # calculateNights(), formatCurrencyVND()
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Cấu hình biến môi trường
File `.env` đã được tạo sẵn ở thư mục gốc:
```env
PORT=3000
NODE_ENV=development

# Kết nối MongoDB (Local hoặc MongoDB Atlas):
MONGO_URI=mongodb://127.0.0.1:27017/homestay_booking

JWT_SECRET=HomestaySecretKey2026_SecureJwtPayloadKey
JWT_EXPIRES_IN=1h

REFRESH_TOKEN_SECRET=HomestayRefreshTokenSecretKey2026_SuperSecure
REFRESH_TOKEN_EXPIRES_IN=7d
```
> *Lưu ý: Nếu dùng MongoDB Atlas (Cloud), chỉ cần thay `MONGO_URI` bằng chuỗi kết nối từ Atlas.*

### 2. Biên dịch & Seed dữ liệu mẫu
```bash
# Biên dịch dự án
npm run build

# Nạp dữ liệu mẫu (Tài khoản Admin, Host, Khách, Phòng mẫu, Đặt phòng)
npm run seed
```

### 3. Khởi chạy ứng dụng
```bash
# Chạy ở chế độ Development (tự reload khi sửa code)
npm run start:dev

# Hoặc chạy Production
npm run start:prod
```

---

## 🌐 Các Đường Dẫn Trực Quan

- **Trang chủ API:** [http://localhost:3000](http://localhost:3000)
- **Tài liệu Swagger API (OpenAPI):** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **GraphQL Playground:** [http://localhost:3000/graphql](http://localhost:3000/graphql)

---

## 🔑 Tài Khoản Mẫu Có Sẵn (Sau khi chạy `npm run seed`)

| Tài khoản | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@homestay.com` | `123456` | Toàn quyền quản trị hệ thống, duyệt đơn, xem thống kê |
| **Chủ nhà (Host)** | `host@homestay.com` | `123456` | Đăng tin phòng, sửa/xóa phòng, xác nhận đơn đặt phòng |
| **Khách hàng (Customer)** | `customer@homestay.com` | `123456` | Tìm kiếm phòng, đặt phòng, hủy đơn, gửi đánh giá 5 sao |
