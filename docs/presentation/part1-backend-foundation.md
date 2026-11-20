# Phần 1 — Kiến trúc & Nền tảng Backend (Thành viên 1)

> **Phạm vi:** Toàn bộ "khung xương" NestJS: bootstrap, module gốc, cấu hình, kết nối DB,
> middleware, common (guards/filters/interceptors/pipes/decorators), xác thực JWT + Refresh Token,
> quản lý người dùng và backend Chat Gemini. Đây là phần giải thích **cách hệ thống vận hành** trước khi đi vào nghiệp vụ.

## 1. Mục tiêu phần này

- Hiểu kiến trúc Modular & MVC của NestJS và cách các module kết nối.
- Hiểu luồng 1 request đi từ client đến database và quay lại.
- Hiểu cơ chế xác thực JWT + Refresh Token và phân quyền RBAC.
- Biết các thành phần "cross-cutting": validation, error filter, transform response, logging, rate limit.

## 2. File phụ trách

```
src/main.ts                          # Bootstrap: CORS, static, pipes, filters, interceptors, Swagger
src/app.module.ts                    # Root module: Config, Mongoose, Throttler, Middleware, modules
src/app.controller.ts / app.service.ts
src/config/configuration.ts          # Config: PORT, MONGODB_URI, JWT_SECRET, REFRESH_TOKEN
src/entities/user.entity.ts          # Schema User (email, password hash, role, refreshToken)
src/common/
  decorators/roles.decorator.ts, current-user.decorator.ts
  filters/http-exception.filter.ts
  guards/jwt-auth.guard.ts, roles.guard.ts, vn-throttler.guard.ts
  interceptors/transform.interceptor.ts
  middlewares/logger.middleware.ts
  pipes/parse-object-id.pipe.ts
src/modules/auth/*                   # controller, service, module, dto, strategies/jwt.strategy
src/modules/users/*                  # controller, service, module, dto
src/modules/chat/*                   # controller, service, module, dto (chat AI Gemini)
```

## 3. Kiến trúc & luồng request

**Bootstrap (`main.ts`):**
1. Tạo app `NestExpressApplication`.
2. `enableCors()` cho FE gọi API.
3. `useStaticAssets(public/)` → trang chủ tĩnh chiếm `/`, API ở `/api`... (thực ra endpoint hệ thống `GET /api`).
4. Global `ValidationPipe` (whitelist + transform) — DTO tự động validate.
5. Global `HttpExceptionFilter` — chuẩn hóa lỗi `{ statusCode, message, timestamp, path }`.
6. Global `TransformInterceptor` — bọc response `{ success, statusCode, data }`.
7. Swagger tại `/api/docs`.

**Root module (`app.module.ts`):**
- `ConfigModule.forRoot` (global) load `configuration.ts`.
- `MongooseModule.forRootAsync` kết nối MongoDB theo `database.uri`.
- `ThrottlerModule` mặc định 120 req/phút/IP.
- Đăng ký các module nghiệp vụ.
- `APP_GUARD` = `VNThrottlerGuard` (guard toàn cục).
- `LoggerMiddleware` áp dụng cho mọi route (`*`).

**Luồng 1 request (ví dụ GET /users/me):**
```
Client → LoggerMiddleware (log method/url/ip/time)
      → VNThrottlerGuard (check rate limit)
      → JwtAuthGuard (verify Bearer token qua Passport JwtStrategy)
      → RolesGuard (check @Roles)
      → ValidationPipe (validate params/body)
      → Controller → Service → Mongoose Model → MongoDB
      → TransformInterceptor bọc response
      → HttpExceptionFilter nếu có lỗi
```

## 4. Xác thực & Phân quyền (Auth)

**Entities/Schema User:** email (unique), password (bcrypt hash), role (admin/host/customer), refreshToken (hashed), profile (fullName, phone, avatar).

**Auth flow (`auth.service.ts`):**
- `register`: hash password (bcrypt), tạo user.
- `login`: tìm user → `bcrypt.compare` → cấp `accessToken` (1h) + `refreshToken` (7d) → băm refreshToken lưu vào user.
- `refresh`: verify refreshToken (so khớp hash trong DB) → cấp accessToken mới (có thể rotate refreshToken).
- `logout`: xóa refreshToken trong DB (thu hồi).

**JWT Strategy (`strategies/jwt.strategy.ts`):** Passport `JwtStrategy` extract Bearer token từ header, verify bằng `JWT_SECRET`, trả payload `{ sub, email, role }` → gắn vào `req.user`.

**Decorators:**
- `@CurrentUser()` lấy user từ request (payload JWT).
- `@Roles('admin','host')` khai báo quyền trên route.

**Guards:**
- `JwtAuthGuard` extends `AuthGuard('jwt')` — bảo vệ route.
- `RolesGuard` đọc metadata `@Roles`, so sánh `req.user.role`.

**Refresh token bảo mật:** refreshToken lưu **đã băm** trong DB → dù DB rò rỉ cũng không dùng được; logout = xóa hash.

## 5. Common components (cross-cutting)

| Thành phần | Vai trò | Bài |
|---|---|---|
| `ValidationPipe` (global) | Validate DTO, whitelist, transform type | 07 |
| `ParseObjectIdPipe` | Kiểm tra ObjectId hợp lệ | 07 |
| `LoggerMiddleware` | Log HTTP method, URL, IP, thời gian | 08 |
| `JwtAuthGuard` | Bảo vệ route bằng JWT | 09 |
| `RolesGuard` + `@Roles` | RBAC theo vai trò | 09 |
| `HttpExceptionFilter` | Chuẩn hóa JSON lỗi | 12 |
| `TransformInterceptor` | Bọc `{ success, statusCode, data }` | 02 |
| `VNThrottlerGuard` | Rate limit tiếng Việt | — |

## 6. Rate limiting

- Guard toàn cục `VNThrottlerGuard` (kế thừa `ThrottlerGuard`), ghi đè `throwThrottlingException` → 429 tiếng Việt.
- Mặc định 120 req/phút/IP.
- Siết riêng bằng `@Throttle`:
  - `POST /auth/register`: 5/phút
  - `POST /auth/login`: 10/phút
  - `POST /auth/refresh`: 20/phút
  - `POST /bookings`: 20/phút

## 7. Config & Database

- `config/configuration.ts`: trả object `{ port, database: { uri }, jwt: { secret, expiresIn }, refresh: {...} }`.
- MongoDB qua `@nestjs/mongoose`, MongooseModule.forRootAsync đọc config.
- `.env`: `PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES_IN`.

## 8. API & Tài liệu

- Swagger `/api/docs`: tự sinh từ decorator `@ApiTags`, `@ApiOperation`, DTO.
- Endpoint hệ thống `GET /api` (AppController) trả thông tin server (vì `/` là trang chủ tĩnh).

## 9. Backend Chat Gemini

- Module: `src/modules/chat/`.
- Endpoint: `POST /chat`, nhận `{ message, history }`.
- Service lấy phòng khả dụng từ MongoDB làm ngữ cảnh cho Gemini.
- Có fallback model khi Gemini quá tải/404/429/5xx và fallback rule-based nếu tất cả model đều lỗi.
- Route được giới hạn 20 request/phút bằng `@Throttle`.
- TV3 demo widget chat; TV1 giải thích module, service và xử lý lỗi backend.

## 10. Demo gợi ý (TV1)

1. Mở Swagger `/api/docs`.
2. `POST /auth/register` tạo user customer → 201.
3. `POST /auth/login` → nhận `accessToken` + `refreshToken`.
4. Click "Authorize" dán accessToken → gọi `GET /users/me` → 200.
5. Gọi `GET /users` (admin only) với token customer → 403 (RBAC).
6. Hết hạn/invalid token → 401; gọi `/auth/refresh` → token mới.
7. Đập login 11 lần → 429 tiếng Việt.

## 11. Câu hỏi likely (TV1)

- **Dependency Injection trong Nest hoạt động thế nào?** → Provider đăng ký trong module, Nest container inject qua constructor; singleton scope mặc định.
- **Middleware vs Guard vs Interceptor vs Pipe khác nhau?** → Middleware: request/response thô (Express); Guard: quyết định cho phép vào route (auth); Pipe: transform/validate input; Interceptor: bọc response, logging, cache; Filter: xử lý exception.
- **Vì sao refresh token lưu hash?** → Nếu DB bị rò rỉ, attacker không dùng được token gốc; logout thu hồi bằng xóa hash.
- **Passport strategy là gì?** → Plugin xác thực, `JwtStrategy` validate token và trả user.
- **Global guard đăng ký ở đâu?** → `APP_GUARD` provider trong `AppModule`.

## 12. Ghi chú học thêm

- Đọc Nest docs: Modules, Controllers, Providers, Middleware, Guards, Interceptors, Pipes, Exception Filters.
- File `docs/ARCHITECTURE.md` mục "Luồng Xử Lý Nghiệp Vụ Cốt Lõi" → luồng Auth.
- `docs/BUGS.md` để biết các lỗi đã gặp (Express 5 + Apollo, seed path).
