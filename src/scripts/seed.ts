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


  // ─── Thêm dữ liệu mở rộng (nhiều thành phố / phòng / booking hơn) ───
  console.log('📦 Đang thêm dữ liệu mở rộng...');
  const customer2 = await db.collection('users').insertOne({
    email: 'customer2@homestay.com',
    password: passwordHash,
    fullName: 'Trần Thị Lan',
    phoneNumber: '0907777888',
    role: 'customer',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const customerId2 = customer2.insertedId;

  const extraRooms = [
    {
      name: 'Nha Trang Sea Breeze Villa',
      description: 'Villa sát biển Nha Trang, hồ bơi riêng, view hoàng hôn tuyệt đẹp. Phù hợp gia đình và nhóm bạn.',
      roomType: 'villa',
      pricePerNight: 2500000,
      capacity: 8,
      bedroomCount: 4,
      bathroomCount: 3,
      amenities: ['Hồ bơi riêng', 'Wifi', 'Bếp đầy đủ', 'Điều hòa', 'Ban công view biển', 'BBQ', 'Chỗ đậu xe'],
      images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'],
      address: { street: 'Trần Phú', district: 'Lộc Thọ', city: 'Nha Trang', country: 'Việt Nam' },
      status: 'available', hostId: hostId, rating: 4.7, totalReviews: 5,
    },
    {
      name: 'Phú Quốc Sunset Bungalow',
      description: 'Bungalow gỗ ấm cúng ngay bãi biển Phú Quốc, thức dậy với tiếng sóng và hoàng hôn rực rỡ.',
      roomType: 'entire_homestay',
      pricePerNight: 1800000,
      capacity: 3,
      bedroomCount: 1,
      bathroomCount: 1,
      amenities: ['Wifi', 'Máy lạnh', 'Bồn tắm', 'Ban công', 'BBQ', 'Xe đạp miễn phí'],
      images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'],
      address: { street: 'Bãi Trường', district: 'Dương Tơ', city: 'Phú Quốc', country: 'Việt Nam' },
      status: 'available', hostId: hostId, rating: 4.9, totalReviews: 8,
    },
    {
      name: 'Sa Pa Mountain View Lodge',
      description: 'Lodge trên núi Sa Pa, view thung lũng Mường Hoa và ruộng bậc thang. Không khí trong lành, lý tưởng cho trekking.',
      roomType: 'villa',
      pricePerNight: 1200000,
      capacity: 6,
      bedroomCount: 3,
      bathroomCount: 2,
      amenities: ['Lò sưởi', 'Wifi', 'Bếp', 'Ban công view núi', 'Chỗ đậu xe', 'Bữa sáng'],
      images: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
      address: { street: 'Fansipan', district: 'Sa Pa', city: 'Sa Pa', country: 'Việt Nam' },
      status: 'available', hostId: hostId, rating: 4.6, totalReviews: 3,
    },
    {
      name: 'Hội An Ancient Town Studio',
      description: 'Studio phong cách cổ Hội An, đi bộ 2 phút tới phố cổ. Đèn lồng, gạch hoa và không gian yên tĩnh.',
      roomType: 'standard',
      pricePerNight: 600000,
      capacity: 2,
      bedroomCount: 1,
      bathroomCount: 1,
      amenities: ['Wifi', 'Điều hòa', 'Xe đạp miễn phí', 'Bếp nhỏ', 'Máy giặt'],
      images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994'],
      address: { street: 'Nguyễn Thái Học', district: 'Minh An', city: 'Hội An', country: 'Việt Nam' },
      status: 'available', hostId: hostId, rating: 4.8, totalReviews: 6,
    },
    {
      name: 'Mộc Châu Green Valley Retreat',
      description: 'Nhà gỗ giữa đồi chè Mộc Châu, không gian yên tĩnh, nhiều góc sống ảo và bữa sáng địa phương.',
      roomType: 'entire_homestay', pricePerNight: 850000, capacity: 4, bedroomCount: 2, bathroomCount: 1,
      amenities: ['Wifi', 'Lò sưởi', 'Sân vườn', 'BBQ', 'Bữa sáng', 'Chỗ đậu xe'],
      images: ['https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8', 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e'],
      address: { street: 'Tiểu khu 34', district: 'Nông trường Mộc Châu', city: 'Mộc Châu', country: 'Việt Nam' },
      status: 'available', hostId: hostId, rating: 4.7, totalReviews: 0,
    },
    {
      name: 'Huế Riverside Garden House',
      description: 'Ngôi nhà nhỏ bên sông Hương, phong cách cổ điển, gần Đại Nội và các điểm tham quan nổi tiếng.',
      roomType: 'deluxe', pricePerNight: 700000, capacity: 3, bedroomCount: 2, bathroomCount: 1,
      amenities: ['Wifi', 'Điều hòa', 'Sân vườn', 'Xe đạp miễn phí', 'Bếp nhỏ'],
      images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0'],
      address: { street: 'Nguyễn Sinh Cung', district: 'Vỹ Dạ', city: 'Huế', country: 'Việt Nam' },
      status: 'available', hostId: hostId, rating: 4.5, totalReviews: 0,
    },
    {
      name: 'Vũng Tàu Lighthouse Seaview',
      description: 'Căn hộ hiện đại nhìn ra biển và ngọn hải đăng, gần Bãi Sau, thích hợp cho chuyến nghỉ cuối tuần.',
      roomType: 'suite', pricePerNight: 950000, capacity: 4, bedroomCount: 2, bathroomCount: 2,
      amenities: ['Wifi', 'Hồ bơi', 'Điều hòa', 'Bếp', 'Ban công view biển', 'Phòng gym'],
      images: ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3'],
      address: { street: 'Thùy Vân', district: 'Thắng Tam', city: 'Vũng Tàu', country: 'Việt Nam' },
      status: 'available', hostId: hostId, rating: 4.6, totalReviews: 0,
    },
    {
      name: 'Quy Nhơn Coral Bay Homestay',
      description: 'Homestay thoáng mát gần biển Quy Nhơn, nội thất trẻ trung, phù hợp nhóm bạn và gia đình nhỏ.',
      roomType: 'standard', pricePerNight: 550000, capacity: 3, bedroomCount: 1, bathroomCount: 1,
      amenities: ['Wifi', 'Máy lạnh', 'Bếp chung', 'Sân thượng', 'Chỗ đậu xe'],
      images: ['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85'],
      address: { street: 'An Dương Vương', district: 'Nguyễn Văn Cừ', city: 'Quy Nhơn', country: 'Việt Nam' },
      status: 'available', hostId: hostId, rating: 4.4, totalReviews: 0,
    },
    {
      name: 'Tam Đảo Cloudy Pine Villa',
      description: 'Villa trên mây Tam Đảo, khí hậu mát mẻ quanh năm, có sân BBQ và view rừng thông.',
      roomType: 'villa', pricePerNight: 2100000, capacity: 10, bedroomCount: 5, bathroomCount: 4,
      amenities: ['Wifi', 'Hồ bơi', 'BBQ', 'Bếp đầy đủ', 'Lò sưởi', 'Sân vườn', 'Karaoke'],
      images: ['https://images.unsplash.com/photo-1510798831971-661eb04b3739', 'https://images.unsplash.com/photo-1542718610-a1d656d1884c'],
      address: { street: 'Khu 1', district: 'Tam Đảo', city: 'Tam Đảo', country: 'Việt Nam' },
      status: 'available', hostId: hostId, rating: 4.8, totalReviews: 0,
    },
    {
      name: 'Đà Nẵng Beachfront Apartment',
      description: 'Căn hộ cao cấp view biển Mỹ Khê, ban công lớn, đầy đủ tiện nghi. Gần cầu Rồng và trung tâm.',
      roomType: 'deluxe',
      pricePerNight: 1100000,
      capacity: 4,
      bedroomCount: 2,
      bathroomCount: 2,
      amenities: ['Wifi', 'Hồ bơi', 'Phòng gym', 'Điều hòa', 'Bếp', 'Ban công view biển', 'Chỗ đậu xe'],
      images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
      address: { street: 'Võ Nguyên Giáp', district: 'Ngũ Hành Sơn', city: 'Đà Nẵng', country: 'Việt Nam' },
      status: 'available', hostId: hostId, rating: 4.7, totalReviews: 4,
    },
  ];
  const moreRooms = [
    {
      name: 'Hạ Long Bay Panorama Villa', description: 'Villa rộng rãi nhìn ra vịnh Hạ Long, có sân thượng và không gian sinh hoạt chung cho gia đình.', roomType: 'villa', pricePerNight: 2800000, capacity: 10, bedroomCount: 5, bathroomCount: 4,
      amenities: ['Wifi', 'Hồ bơi', 'BBQ', 'Bếp đầy đủ', 'Ban công view biển', 'Chỗ đậu xe'], images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'], address: { street: 'Bãi Cháy', district: 'Bãi Cháy', city: 'Hạ Long', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.8, totalReviews: 0,
    },
    {
      name: 'Cát Bà Ocean View Room', description: 'Phòng nghỉ thoáng mát gần biển Cát Bà, phù hợp cho chuyến du lịch khám phá đảo.', roomType: 'deluxe', pricePerNight: 900000, capacity: 3, bedroomCount: 1, bathroomCount: 1,
      amenities: ['Wifi', 'Điều hòa', 'Ban công view biển', 'Bữa sáng', 'Xe đạp miễn phí'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a'], address: { street: '1/4', district: 'Cát Hải', city: 'Cát Bà', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.5, totalReviews: 0,
    },
    {
      name: 'Ninh Bình Lotus Riverside', description: 'Nhà nghỉ ven sông giữa thiên nhiên Ninh Bình, gần Tràng An và Tam Cốc.', roomType: 'entire_homestay', pricePerNight: 780000, capacity: 4, bedroomCount: 2, bathroomCount: 1,
      amenities: ['Wifi', 'Sân vườn', 'Xe đạp miễn phí', 'Bữa sáng', 'Chỗ đậu xe'], images: ['https://images.unsplash.com/photo-1544986581-efac024faf62'], address: { street: 'Tràng An', district: 'Hoa Lư', city: 'Ninh Bình', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.7, totalReviews: 0,
    },
    {
      name: 'Hà Giang Stone Mountain House', description: 'Nhà đá mang nét văn hóa vùng cao, view núi hùng vĩ và không khí trong lành.', roomType: 'standard', pricePerNight: 650000, capacity: 4, bedroomCount: 2, bathroomCount: 1,
      amenities: ['Wifi', 'Lò sưởi', 'Sân vườn', 'Bữa sáng', 'Chỗ đậu xe'], images: ['https://images.unsplash.com/photo-1510798831971-661eb04b3739'], address: { street: 'Đường Hạnh Phúc', district: 'Đồng Văn', city: 'Hà Giang', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.6, totalReviews: 0,
    },
    {
      name: 'Buôn Ma Thuột Coffee Garden', description: 'Homestay giữa vườn cà phê, thiết kế mộc mạc và yên tĩnh, thích hợp nghỉ dưỡng.', roomType: 'standard', pricePerNight: 500000, capacity: 3, bedroomCount: 1, bathroomCount: 1,
      amenities: ['Wifi', 'Sân vườn', 'Bếp chung', 'Bữa sáng', 'Chỗ đậu xe'], images: ['https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8'], address: { street: 'Y Ngông', district: 'Tân Lợi', city: 'Buôn Ma Thuột', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.4, totalReviews: 0,
    },
    {
      name: 'Cần Thơ Mekong Garden Stay', description: 'Không gian xanh bên sông Mekong, gần chợ nổi Cái Răng và các làng nghề địa phương.', roomType: 'deluxe', pricePerNight: 720000, capacity: 4, bedroomCount: 2, bathroomCount: 1,
      amenities: ['Wifi', 'Sân vườn', 'Bữa sáng', 'Xe đạp miễn phí', 'Bếp nhỏ'], images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85'], address: { street: 'Phong Điền', district: 'Phong Điền', city: 'Cần Thơ', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.6, totalReviews: 0,
    },
    {
      name: 'Mũi Né Sand Dunes Resort Room', description: 'Phòng nghỉ gần đồi cát Mũi Né, hồ bơi rộng và không gian biển đầy nắng.', roomType: 'suite', pricePerNight: 1300000, capacity: 4, bedroomCount: 2, bathroomCount: 2,
      amenities: ['Wifi', 'Hồ bơi', 'Điều hòa', 'Ban công', 'Bữa sáng', 'Chỗ đậu xe'], images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791'], address: { street: 'Huỳnh Tấn Phát', district: 'Hàm Tiến', city: 'Mũi Né', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.5, totalReviews: 0,
    },
    {
      name: 'Côn Đảo Tropical Hideaway', description: 'Căn nhà nhiệt đới riêng tư gần biển Côn Đảo, phù hợp nghỉ dưỡng và khám phá thiên nhiên.', roomType: 'entire_homestay', pricePerNight: 1900000, capacity: 5, bedroomCount: 2, bathroomCount: 2,
      amenities: ['Wifi', 'Bếp đầy đủ', 'Sân vườn', 'BBQ', 'Xe đạp miễn phí'], images: ['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2'], address: { street: 'Nguyễn Huệ', district: 'Côn Đảo', city: 'Côn Đảo', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.8, totalReviews: 0,
    },
    {
      name: 'Lý Sơn Blue Horizon Homestay', description: 'Homestay nhỏ xinh với view biển Lý Sơn, chủ nhà thân thiện và hải sản tươi ngon.', roomType: 'standard', pricePerNight: 450000, capacity: 2, bedroomCount: 1, bathroomCount: 1,
      amenities: ['Wifi', 'Điều hòa', 'Ban công view biển', 'Bữa sáng', 'Xe máy cho thuê'], images: ['https://images.unsplash.com/photo-1507525428845-0f7b3b0f3f6b'], address: { street: 'An Vĩnh', district: 'Lý Sơn', city: 'Lý Sơn', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.5, totalReviews: 0,
    },
    {
      name: 'Bắc Hà Highland Wooden Lodge', description: 'Lodge gỗ giữa núi rừng Bắc Hà, gần chợ phiên và các bản làng vùng cao.', roomType: 'deluxe', pricePerNight: 680000, capacity: 4, bedroomCount: 2, bathroomCount: 1,
      amenities: ['Wifi', 'Lò sưởi', 'Sân vườn', 'Bữa sáng', 'Chỗ đậu xe'], images: ['https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8'], address: { street: 'Na Hối', district: 'Bắc Hà', city: 'Bắc Hà', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.3, totalReviews: 0,
    },
    {
      name: 'Phan Rang Sunny Coast Villa', description: 'Villa tràn ngập ánh nắng gần biển Ninh Chữ, có hồ bơi và sân BBQ riêng.', roomType: 'villa', pricePerNight: 2200000, capacity: 8, bedroomCount: 4, bathroomCount: 3,
      amenities: ['Wifi', 'Hồ bơi riêng', 'BBQ', 'Bếp đầy đủ', 'Ban công', 'Chỗ đậu xe'], images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811'], address: { street: 'Yên Ninh', district: 'Kinh Dinh', city: 'Phan Rang', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.7, totalReviews: 0,
    },
    {
      name: 'Kon Tum Forest Edge Bungalow', description: 'Bungalow ven rừng Kon Tum, gần gũi thiên nhiên và văn hóa bản địa, rất phù hợp nghỉ chậm.', roomType: 'entire_homestay', pricePerNight: 620000, capacity: 3, bedroomCount: 1, bathroomCount: 1,
      amenities: ['Wifi', 'Sân vườn', 'Bếp chung', 'Bữa sáng', 'Chỗ đậu xe'], images: ['https://images.unsplash.com/photo-1542718610-a1d656d1884c'], address: { street: 'Kon Kơ Tu', district: 'Kon Plông', city: 'Kon Tum', country: 'Việt Nam' }, status: 'available', hostId, rating: 4.4, totalReviews: 0,
    },
  ];
  const allRooms = [...extraRooms, ...moreRooms];
  const extraRoomIds = [];
  for (const r of allRooms) {
    const doc = await db.collection('rooms').insertOne({ ...r, createdAt: new Date(), updatedAt: new Date() });
    extraRoomIds.push(doc.insertedId);
  }

  // Đánh giá cho các phòng mới
  const reviewComments = [
    { rating: 5, comment: 'Phòng đẹp, view tuyệt vời, chủ nhà rất thân thiện. Sẽ quay lại!' },
    { rating: 4, comment: 'Vị trí thuận tiện, sạch sẽ. Giá hợp lý cho chất lượng.' },
    { rating: 5, comment: 'Trải nghiệm đáng nhớ, không gian ấm cúng và đầy đủ tiện nghi.' },
  ];
  for (let i = 0; i < extraRoomIds.length; i++) {
    for (let j = 0; j < 2; j++) {
      const rc = reviewComments[(i + j) % reviewComments.length];
      await db.collection('reviews').insertOne({
        customerId: j === 0 ? customerId : customerId2,
        roomId: extraRoomIds[i],
        rating: rc.rating,
        comment: rc.comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // Cập nhật rating trung bình cho các phòng mới
  for (const rid of extraRoomIds) {
    const all = await db.collection('reviews').find({ roomId: rid }).toArray();
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await db.collection('rooms').updateOne({ _id: rid }, { $set: { rating: Number(avg.toFixed(1)), totalReviews: all.length } });
  }

  // Thêm vài booking mẫu cho các phòng mới
  const now = new Date();
  const mkDate = (d: number) => { const x = new Date(now); x.setDate(x.getDate() + d); return x; };
  await db.collection('bookings').insertMany([
    { customerId: customerId, roomId: extraRoomIds[0], checkInDate: mkDate(14), checkOutDate: mkDate(17), totalGuests: 4, numberOfNights: 3, totalPrice: 7500000, status: 'confirmed', paymentStatus: 'paid', note: 'Gia đình 4 người', createdAt: new Date(), updatedAt: new Date() },
    { customerId: customerId2, roomId: extraRoomIds[1], checkInDate: mkDate(20), checkOutDate: mkDate(23), totalGuests: 2, numberOfNights: 3, totalPrice: 5400000, status: 'pending', paymentStatus: 'unpaid', note: 'Tuần trăng mật', createdAt: new Date(), updatedAt: new Date() },
    { customerId: customerId2, roomId: extraRoomIds[2], checkInDate: mkDate(5), checkOutDate: mkDate(8), totalGuests: 3, numberOfNights: 3, totalPrice: 3600000, status: 'completed', paymentStatus: 'paid', note: '', createdAt: new Date(), updatedAt: new Date() },
    { customerId: customerId, roomId: extraRoomIds[3], checkInDate: mkDate(10), checkOutDate: mkDate(12), totalGuests: 2, numberOfNights: 2, totalPrice: 1200000, status: 'confirmed', paymentStatus: 'unpaid', note: 'Cuối tuần', createdAt: new Date(), updatedAt: new Date() },
    { customerId: customerId2, roomId: extraRoomIds[4], checkInDate: mkDate(3), checkOutDate: mkDate(5), totalGuests: 4, numberOfNights: 2, totalPrice: 2200000, status: 'cancelled', paymentStatus: 'refunded', note: 'Thay đổi kế hoạch', createdAt: new Date(), updatedAt: new Date() },
  ]);

  console.log('📦 Đã thêm 22 phòng mở rộng tại nhiều điểm đến; tổng cộng 24 phòng, đánh giá và booking mẫu.');

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
