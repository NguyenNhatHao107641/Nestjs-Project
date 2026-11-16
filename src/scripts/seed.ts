import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/homestay_booking';

async function seed() {
  console.log('🔄 Đang kết nối MongoDB tại:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('✅ Đã kết nối thành công tới MongoDB!');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('Không tìm thấy cơ sở dữ liệu');
    process.exit(1);
  }

  // Xóa dữ liệu cũ
  console.log('🧹 Đang làm sạch dữ liệu cũ...');
  await db.collection('users').deleteMany({});
  await db.collection('rooms').deleteMany({});
  await db.collection('bookings').deleteMany({});
  await db.collection('reviews').deleteMany({});

  console.log('🌱 Đang tạo tài khoản mẫu...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  const adminInsert = await db.collection('users').insertOne({
    email: 'admin@homestay.com',
    password: passwordHash,
    fullName: 'Quản Trị Viên Hệ Thống',
    phoneNumber: '0901111222',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const hostInsert = await db.collection('users').insertOne({
    email: 'host@homestay.com',
    password: passwordHash,
    fullName: 'Chủ Homestay Mơ Mộng',
    phoneNumber: '0903333444',
    role: 'host',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const customerInsert = await db.collection('users').insertOne({
    email: 'customer@homestay.com',
    password: passwordHash,
    fullName: 'Nguyễn Văn Khách',
    phoneNumber: '0905555666',
    role: 'customer',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const hostId = hostInsert.insertedId;
  const customerId = customerInsert.insertedId;

  console.log('🏡 Đang tạo dữ liệu Homestay / Khách sạn mẫu...');
  const room1 = await db.collection('rooms').insertOne({
    name: 'The Wilder-Nest Homestay Đà Lạt',
    description:
      'Tọa lạc giữa đồi thông thơ mộng tại Hồ Tuyền Lâm, không gian yên bình, view săn mây và ngắm hoàng hôn tuyệt đẹp.',
    roomType: 'entire_homestay',
    pricePerNight: 950000,
    capacity: 4,
    bedroomCount: 2,
    bathroomCount: 1,
    amenities: [
      'Wifi tốc độ cao',
      'Máy nước nóng',
      'Khu vực BBQ ngoài trời',
      'Bếp đầy đủ gia vị',
      'Chỗ đỗ xe miễn phí',
      'Máy pha cà phê',
    ],
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    ],
    address: {
      street: 'Đường Hoa Cẩm Tú Cầu',
      district: 'Phường 3',
      city: 'Đà Lạt',
      country: 'Việt Nam',
    },
    status: 'available',
    hostId: hostId,
    rating: 4.9,
    totalReviews: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const room2 = await db.collection('rooms').insertOne({
    name: 'Old Quarter Cozy Studio Hà Nội',
    description:
      'Căn hộ phong cách Indochine hoài cổ ngay trung tâm Phố Cổ Hà Nội, cách Hồ Gươm 3 phút đi bộ.',
    roomType: 'suite',
    pricePerNight: 750000,
    capacity: 2,
    bedroomCount: 1,
    bathroomCount: 1,
    amenities: [
      'Wifi',
      'Điều hòa 2 chiều',
      'Smart TV Netflix',
      'Bếp nhỏ',
      'Tủ lạnh',
      'Ban công ngắm phố',
    ],
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843',
    ],
    address: {
      street: 'Hàng Gai',
      district: 'Quận Hoàn Kiếm',
      city: 'Hà Nội',
      country: 'Việt Nam',
    },
    status: 'available',
    hostId: hostId,
    rating: 4.8,
    totalReviews: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('📝 Đang tạo đánh giá mẫu (Reviews)...');
  await db.collection('reviews').insertMany([
    {
      customerId: customerId,
      roomId: room1.insertedId,
      rating: 5,
      comment:
        'Trải nghiệm tuyệt vời! View thung lũng rất đẹp, chủ nhà nhiệt tình chu đáo.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      customerId: customerId,
      roomId: room1.insertedId,
      rating: 5,
      comment: 'Căn nhà gỗ rất ấm cúng, bếp có sẵn đồ dùng nấu ăn, nhất định sẽ quay lại!',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      customerId: customerId,
      roomId: room2.insertedId,
      rating: 5,
      comment: 'Vị trí đắc địa ngay phố cổ, bước chân ra là có phở ngon và cà phê trứng.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log('📅 Đang tạo đơn đặt phòng mẫu (Bookings)...');
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 10);

  await db.collection('bookings').insertOne({
    customerId: customerId,
    roomId: room1.insertedId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    totalGuests: 2,
    numberOfNights: 3,
    totalPrice: 2850000,
    status: 'confirmed',
    paymentStatus: 'paid',
    note: 'Yêu cầu phòng chuẩn bị thêm 2 chai nước khoáng',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('🎉 Seed dữ liệu mẫu hoàn tất!');
  console.log('----------------------------------------------------');
  console.log('Tài khoản mẫu:');
  console.log('👉 Admin:    admin@homestay.com    / 123456');
  console.log('👉 Host:     host@homestay.com     / 123456');
  console.log('👉 Customer: customer@homestay.com / 123456');
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Lỗi khi seed dữ liệu:', err);
  process.exit(1);
});
