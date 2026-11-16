# Website Quản lý và Đặt phòng Homestay / Khách sạn (NestJS + MongoDB)

Hệ thống backend API quản lý và đặt phòng homestay / khách sạn được xây dựng bằng **NestJS** kết hợp cơ sở dữ liệu **MongoDB**. Dự án áp dụng kiến trúc chuẩn Modular & MVC, phân quyền tài khoản (Admin, Host, Customer), xác thực JWT + Refresh Token, bộ lọc phòng nâng cao, kiểm tra trùng lịch đặt phòng và hỗ trợ đồng thời REST API (Swagger) lẫn GraphQL.

---

## 🛠 Yêu Cầu Môi Trường

Trước khi chạy dự án, hãy đảm bảo máy tính đã cài đặt:
- **Node.js**: Phiên bản LTS (Node 20+ hoặc 26+)
- **MongoDB**: MongoDB Community Server đang chạy tại cổng `27017` (hoặc chuỗi kết nối MongoDB Atlas)

---

## 🚀 Cài Đặt & Khởi Chạy

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Cấu hình biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```
Nội dung file `.env` mẫu:
```env
PORT=3000
NODE_ENV=development

# Kết nối MongoDB:
MONGODB_URI=mongodb://127.0.0.1:27017/homestay_booking

# Cấu hình JWT & Refresh Token:
JWT_SECRET=HomestaySecretKey2026_SecureJwtPayloadKey
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=HomestayRefreshTokenSecretKey2026_SuperSecure
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Bước 3: Biên dịch & nạp dữ liệu mẫu
```bash
# 1. Biên dịch dự án
npm run build

# 2. Nạp dữ liệu mẫu (Tài khoản Admin, Host, Khách, Phòng Homestay, Booking)
npm run seed
```

### Bước 4: Khởi động Server
```bash
# Chạy môi trường phát triển (Watch mode)
npm run start:dev

# Hoặc chạy môi trường Production
npm run start:prod
```

Sau khi khởi động thành công:
- **Trang chủ API:** [http://localhost:3000](http://localhost:3000)
- **Tài liệu Swagger API (OpenAPI):** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **GraphQL Playground:** [http://localhost:3000/graphql](http://localhost:3000/graphql)

---

## 🔑 Tài Khoản Thử Nghiệm (Seed Data)

Sau khi chạy lệnh `npm run seed`, hệ thống có sẵn các tài khoản:

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@homestay.com` | `123456` | Quản trị toàn hệ thống, quản lý người dùng, xem toàn bộ đơn đặt phòng |
| **Chủ nhà (Host)** | `host@homestay.com` | `123456` | Tạo, sửa, xóa homestay của mình; xem đơn đặt của khách |
| **Khách hàng (Customer)** | `customer@homestay.com` | `123456` | Tìm phòng, đặt phòng, hủy đặt phòng, đánh giá 5 sao |

---

## 📚 Tài Liệu Bổ Sung

- [Tài liệu Kiến trúc & Bản đồ code (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md)
- [Nhật ký Fix Bug & Quản lý Issue (docs/BUGS.md)](docs/BUGS.md)
