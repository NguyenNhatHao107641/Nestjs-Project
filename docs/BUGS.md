# Quản Lý Lỗi & Nhật Ký Khắc Phục (Bug & Issue Tracker)

Tài liệu theo dõi và quản lý các lỗi kỹ thuật phát sinh trong quá trình phát triển và vận hành hệ thống **Website Quản lý và Đặt phòng Homestay / Khách sạn**.

---

## 📌 Danh Sách Bug Đang Xử Lý (Open Bugs)

| ID | Mô tả lỗi | File / Module liên quan | Mức độ | Trạng thái | Hướng giải quyết dự kiến |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-02** | Giới hạn dung lượng tải ảnh phòng khi upload trực tiếp | `src/modules/rooms/` | Thấp | Chờ xử lý | Tích hợp Multer / Cloudinary / AWS S3 để upload file ảnh thay vì URL tĩnh |
| **BUG-03** | Khách hàng có thể hủy đơn khi đã cận kề ngày Check-in | `src/modules/bookings/` | Thấp | Nghiên cứu | Bổ sung quy định chính sách hủy: chỉ được hủy trước 24h hoặc 48h |

---

## ✅ Nhật Ký Lỗi Đã Khắc Phục (Resolved Bugs)

- **[2026-11-16] BUG-01 - Lệnh `npm run seed` trỏ nhầm đường dẫn file biên dịch:**
  - *Mô tả:* Lệnh trong `package.json` trỏ tới `dist/src/scripts/seed.js` nhưng Nest CLI khi biên dịch đặt file tại `dist/scripts/seed.js`, dẫn đến lỗi `Cannot find module`.
  - *Cách khắc phục:* Đã cập nhật lại script trong `package.json` thành `"seed": "node dist/scripts/seed.js"`. File `src/scripts/seed.ts` và `configuration.ts` cũng được tối ưu hỗ trợ đồng thời cả 2 biến `MONGODB_URI` và `MONGO_URI`.

- **[2026-11-16] Tương thích Express 5 với Apollo GraphQL trong NestJS v12:**
  - *Mô tả:* NestJS v12 sử dụng Express v5 làm nền tảng HTTP mặc định, phiên bản Apollo Server chuẩn có thể gặp cảnh báo tương thích với middleware Express 5.
  - *Cách khắc phục:* Cài đặt thêm `@as-integrations/express5` làm cầu nối giữa Apollo Server và Express 5, đảm bảo GraphQL Playground và các Resolver hoạt động ổn định tại `/graphql`.

- **[2026-11-16] Lỗi kết nối ECONNREFUSED 127.0.0.1:27017:**
  - *Mô tả:* Node.js không thể kết nối tới cơ sở dữ liệu MongoDB do tiến trình MongoDB chưa được khởi động trên máy trạm Windows.
  - *Cách khắc phục:* Cung cấp hướng dẫn đăng ký `mongod.exe` thành Windows Service tự động (`MongoDB Service`) hoặc cấu hình chuỗi kết nối linh hoạt tới đám mây MongoDB Atlas trong file `.env`.

---

## 💡 Mẹo Thực Tế Khi Đẩy Code Lên GitHub

Nếu bạn sử dụng kho lưu trữ GitHub cho dự án:
1. **GitHub Issues:** Bạn có thể tạo các Issue trên tab **Issues** của GitHub với các nhãn tương ứng như `bug`, `enhancement`, `documentation`.
2. **Tự động đóng Issue qua Git Commit:** Khi push commit sửa lỗi lên GitHub, hãy thêm từ khóa trong message commit, ví dụ:
   ```bash
   git commit -m "fix(seed): fix dist path for seed script. Fixes #1"
   git push origin main
   ```
   GitHub sẽ tự động đóng Issue `#1` và liên kết commit đó vào nhật ký lỗi.
