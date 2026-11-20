# Phần 2 — Nghiệp vụ cốt lõi & Dữ liệu (Thành viên 2)

> **Phạm vi:** Toàn bộ domain nghiệp vụ: schema dữ liệu (Room, Booking, Review, Favorite),
> CRUD phòng với lọc nâng cao, luồng đặt phòng chống trùng lịch + tính tiền, quản lý đơn,
> đánh giá tự cập nhật rating, phòng yêu thích server-backed, lịch trống phòng, seed data.

## 1. Mục tiêu phần này

- Hiểu mô hình dữ liệu (Mongoose schema) và quan hệ giữa các collection.
- Hiểu thuật toán kiểm tra trùng lịch đặt phòng (overlap).
- Biết cách xây dựng filter động (city, roomType, guests, price range, keyword).
- Hiểu RBAC ở mức dữ liệu (host chỉ sửa phòng của mình).
- Biết seed data và helper functions.

## 2. File phụ trách

```
src/entities/room.entity.ts
src/entities/booking.entity.ts
src/entities/review.entity.ts
src/entities/favorite.entity.ts
src/modules/rooms/*          # controller, service, module, dto (create/update/filter)
src/modules/bookings/*       # controller, service, module, dto (create/update-status)
src/modules/reviews/*        # controller, service, module, dto
src/modules/favorites/*      # controller, service, module
src/modules/tasks/*          # cron tự hoàn thành booking quá hạn
src/scripts/seed.ts
src/utils/helpers.ts         # calculateNights(), formatCurrencyVND()
```

## 3. Mô hình dữ liệu (Schema)

**User** (TV1): email, password (hash), role, refreshToken (hash), profile.

**Room:** name, description, roomType (homestay/hotel/...), pricePerNight, capacity, address { street, city, district }, amenities[], images[], hostId (ref User), status (available/maintenance), rating, totalReviews, createdAt.

**Booking:** customerId (ref User), roomId (ref Room), checkInDate, checkOutDate, totalGuests, numberOfNights, totalPrice, status (pending/confirmed/cancelled/completed), note, createdAt.

**Review:** roomId, customerId, rating (1-5), comment, createdAt. Sau khi lưu → cập nhật `Room.rating` trung bình + `totalReviews`.

**Favorite:** userId + roomId, index kép unique `(userId, roomId)` → 1 người chỉ lưu mỗi phòng 1 lần.

**Quan hệ:** Booking tham chiếu User & Room; Review tham chiếu User & Room; Favorite tham chiếu User & Room; Room tham chiếu User (host).

## 4. Module Rooms — CRUD + Lọc nâng cao

**Controller routes (JWT where needed):**
- `GET /rooms` (public) + `FilterRoomDto` query: city, roomType, guests, minPrice, maxPrice, keyword.
- `GET /rooms?page=1&limit=12` → pagination `{ items, total, page, limit, totalPages }`.
- `GET /rooms/:id` (public).
- `GET /rooms/:id/availability` (public) → các khoảng ngày đã đặt.
- `GET /rooms/my-rooms` (host) → phòng của tôi.
- `POST /rooms` (host) → tạo phòng.
- `POST /rooms/:id/images` (host/admin, multipart, tối đa 5MB) → upload ảnh.
- `PATCH /rooms/:id` (host/admin, chủ phòng) → sửa.
- `DELETE /rooms/:id` (host/admin, chủ phòng) → xóa.

**Service `findAll(filter)`:** xây query động:
- `status = AVAILABLE`
- city → regex `address.city`
- roomType → exact
- guests → `capacity >= guests`
- minPrice/maxPrice → `pricePerNight` range
- keyword → `$or` name/description regex

**RBAC sở hữu:** `update/remove` kiểm tra `room.hostId === userId` hoặc role admin. Lưu ý bug đã fix: `findById` populate hostId thành object → phải lấy `._id` trước khi so sánh (`(room.hostId as {_id})?._id ?? room.hostId`).

**`findAvailability`:** trả các booking pending/confirmed chưa qua (`checkOutDate > now`), sort theo checkIn — FE hiển thị "Ngày đã có khách đặt".

## 5. Module Bookings — Luồng đặt phòng (TRỌNG TÂM)

**`create(customerId, dto)`:**
1. Parse & validate ngày (checkOut > checkIn).
2. Tìm room → 404 nếu không có; từ chối nếu đang bảo trì.
3. Kiểm tra `totalGuests <= room.capacity`.
4. **Kiểm tra trùng lịch (overlap):**
   ```js
   findOne({
     roomId,
     status: { $in: [PENDING, CONFIRMED] },
     checkInDate: { $lt: checkOut },
     checkOutDate: { $gt: checkIn },
   })
   ```
   → nếu có → 400 "Phòng đã được đặt".
5. Tính `nights = calculateNights(checkIn, checkOut)`, `totalPrice = nights * pricePerNight`.
6. Lưu booking status PENDING.

**Overlap logic giải thích:** Hai khoảng [A,B] và [C,D] trùng nhau khi `A < D && C < B`. Áp dụng cho booking đang pending/confirmed (bỏ qua cancelled/completed).

**Các route:**
- `POST /bookings` (customer, throttled 20/phút).
- `GET /bookings` (admin) → tất cả.
- `GET /bookings/my-bookings` (customer) → đơn của tôi.
- `GET /bookings/host-bookings` (host) → đơn vào phòng của tôi (join qua room.hostId).
- `GET /bookings/:id`.
- `PATCH /bookings/:id/status` → host confirm/complete/cancel; customer chỉ cancel; admin mọi thứ.
- `PATCH /bookings/:id/pay` → thanh toán giả lập, chuyển `paymentStatus` sang `paid`.
- `PATCH /bookings/:id/refund` (admin) → chuyển `paymentStatus` sang `refunded`.

**`updateStatus`:** kiểm tra quyền: customer chỉ được cancel đơn của mình; host chỉ đơn vào phòng mình; admin tất cả. Cũng xử lý populate `_id` như trên.

**Chính sách hủy & cron:** khách chỉ được hủy trước 24 giờ so với check-in; `TasksService` chạy mỗi ngày để chuyển booking `confirmed` đã quá checkout sang `completed`.

## 6. Module Reviews

- `POST /reviews` (customer, đã đặt phòng? — theo code hiện tại chỉ yêu cầu JWT) → lưu review.
- `GET /reviews/room/:roomId` → danh sách đánh giá.
- `DELETE /reviews/:id`.
- Service tự cập nhật `Room.rating` (trung bình) và `totalReviews` qua `RoomsService.updateRating`.

## 7. Module Favorites (server-backed)

- Entity `Favorite { userId, roomId, createdAt }`, index unique kép.
- API:
  - `GET /favorites` → danh sách phòng đã lưu (populate Room, sort mới nhất).
  - `GET /favorites/ids` → mảng ID nhẹ (tô màu nút ♥).
  - `POST /favorites/:roomId/toggle` → bật/tắt, trả `{ favorited, message }`.
  - `POST /favorites/:roomId` → thêm (idempotent, upsert).
  - `DELETE /favorites/:roomId` → xóa (404 nếu chưa lưu).
- Tất cả yêu cầu JWT. Handle duplicate key `11000` khi race 2 lần toggle.

## 8. Seed data (`scripts/seed.ts`)

- Kết nối MongoDB theo `.env`.
- Xóa dữ liệu cũ (users/rooms/bookings/reviews/favorites).
- Tạo 3 tài khoản demo: customer/host/admin (password `123456`, bcrypt).
- Tạo 24 phòng mẫu ở nhiều điểm đến, booking đa trạng thái, review mẫu và tài khoản customer thứ hai.
- Chạy: `npm run build` rồi `npm run seed`.

## 9. Helpers (`utils/helpers.ts`)

- `calculateNights(checkIn, checkOut)` → số đêm.
- `formatCurrencyVND(amount)` → format VND.

## 10. Demo gợi ý (TV2)

1. Swagger: `GET /rooms?city=...&minPrice=...&maxPrice=...&guests=...` → filter.
2. `POST /rooms` (host token) → tạo phòng; `PATCH/DELETE` → ownership check (403 nếu không phải chủ).
3. Customer đặt phòng: `POST /bookings` → PENDING, totalPrice.
4. Đặt lại cùng phòng cùng ngày → 400 trùng lịch.
5. `GET /rooms/:id/availability` → hiển thị khoảng đã đặt.
6. Host `PATCH /bookings/:id/status` → confirmed/completed.
7. Customer review → `GET /reviews/room/:id` + rating phòng cập nhật.
8. `POST /favorites/:roomId/toggle` → `{ favorited: true }`; `GET /favorites/ids`.

## 11. Câu hỏi likely (TV2)

- **Overlap query giải thích?** → Hai khoảng thời gian giao nhau khi start1 < end2 && start2 < end1; chỉ xét booking pending/confirmed.
- **Vì sao populate rồi phải lấy `_id`?** → Mongoose populate thay hostId bằng document user; so sánh object !== string → 403 sai. Fix: `(obj._id ?? obj)`.
- **Filter động xây thế nào?** → Object query rỗng, conditionally thêm key; MongoDB query linh hoạt.
- **Rating trung bình cập nhật khi nào?** → Sau mỗi review mới, service tính lại và gọi `updateRating`.
- **Index unique kép để làm gì?** → Chống duplicate favorite ở mức DB (race condition).
- **Seed script chạy từ dist?** → Nest build output `dist/scripts/seed.js`, package.json script trỏ đúng (đã fix BUG-01).

## 12. Ghi chú học thêm

- Mongoose: Schema, Model, populate, query operators ($regex, $gte, $lte, $in, $or).
- `docs/ARCHITECTURE.md` mục "Luồng Đặt Phòng & Kiểm Tra Trùng Lịch".
- `docs/BUGS.md` BUG-02/03 (upload ảnh, chính sách hủy) là hướng phát triển.
