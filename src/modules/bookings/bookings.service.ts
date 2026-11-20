import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Booking,
  BookingDocument,
  BookingStatus,
  PaymentStatus,
} from '../../entities/booking.entity.js';
import { Room, RoomDocument, RoomStatus } from '../../entities/room.entity.js';
import { UserRole } from '../../entities/user.entity.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { calculateNights } from '../../utils/helpers.js';

import * as nodemailer from 'nodemailer';

/**
 * Bài 03 & 06: Service xử lý nghiệp vụ Đặt phòng Homestay / Khách sạn
 */
@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Room.name)
    private readonly roomModel: Model<RoomDocument>,
  ) {}

  async create(
    customerId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingDocument> {
    const checkIn = new Date(createBookingDto.checkInDate);
    const checkOut = new Date(createBookingDto.checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new BadRequestException('Ngày nhận/trả phòng không hợp lệ');
    }

    if (checkOut <= checkIn) {
      throw new BadRequestException('Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày');
    }

    const room = await this.roomModel.findById(createBookingDto.roomId).exec();
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng / homestay yêu cầu');
    }

    if (room.status === RoomStatus.MAINTENANCE) {
      throw new BadRequestException('Phòng hiện đang bảo trì, vui lòng chọn phòng khác');
    }

    if (createBookingDto.totalGuests > room.capacity) {
      throw new BadRequestException(
        `Số lượng khách (${createBookingDto.totalGuests}) vượt quá sức chứa tối đa của phòng (${room.capacity} người)`,
      );
    }

    // Kiểm tra trùng lịch đặt phòng (Overlap Booking Conflict)
    const conflictingBooking = await this.bookingModel
      .findOne({
        roomId: room._id,
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        checkInDate: { $lt: checkOut },
        checkOutDate: { $gt: checkIn },
      })
      .exec();

    if (conflictingBooking) {
      throw new BadRequestException(
        'Phòng này đã được khách khác đặt trong khoảng thời gian bạn chọn. Vui lòng chọn ngày khác.',
      );
    }

    const nights = calculateNights(checkIn, checkOut);
    const totalPrice = nights * room.pricePerNight;

    const newBooking = new this.bookingModel({
      customerId: new Types.ObjectId(customerId),
      roomId: room._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalGuests: createBookingDto.totalGuests,
      numberOfNights: nights,
      totalPrice,
      note: createBookingDto.note || '',
      status: BookingStatus.PENDING,
    });

    const saved = await newBooking.save();

    // Gửi email xác nhận (nếu cấu hình SMTP) — không làm fail request nếu lỗi
    // Gui email xac nhan (neu cau hinh SMTP) - khong lam fail request neu loi
    try {
      const customer = await this.roomModel.db
        .collection('users')
        .findOne({ _id: new Types.ObjectId(customerId) });
      if (customer?.email) {
        await this.sendEmail(
          customer.email,
          'Xac nhan dat phong - ' + room.name,
          '<h2>Dat phong thanh cong!</h2>'
            + '<p>Xin chao ' + (customer.fullName || 'ban') + ',</p>'
            + '<p>Ban da dat phong <strong>' + room.name + '</strong> (' + (room.address?.city || '') + ').</p>'
            + '<p>Nhan phong: ' + checkIn.toLocaleDateString('vi-VN') + ' - Tra phong: ' + checkOut.toLocaleDateString('vi-VN') + ' (' + nights + ' dem)</p>'
            + '<p>Tong tien: ' + totalPrice.toLocaleString('vi-VN') + 'd</p>'
            + '<p>Trang thai: Cho xac nhan. Chu nha se phan hoi trong 24 gio.</p>',
        );
      }
    } catch (err) {
      // Bo qua loi email
    }

    return saved;
  }

  async findAll(): Promise<BookingDocument[]> {
    return this.bookingModel
      .find()
      .populate('customerId', 'fullName email phoneNumber avatar')
      .populate('roomId', 'name roomType pricePerNight address images')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Tu dong hoan thanh cac don da het han checkout (confirmed -> completed).
   * Dung cho cron job. Tra ve so don da cap nhat.
   */
  async autoCompleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.bookingModel
      .updateMany(
        { status: BookingStatus.CONFIRMED, checkOutDate: { $lt: now } },
        { $set: { status: BookingStatus.COMPLETED } },
      )
      .exec();
    return result.modifiedCount ?? 0;
  }

  async findMyBookings(customerId: string): Promise<BookingDocument[]> {
    return this.bookingModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .populate('roomId', 'name roomType pricePerNight address images hostId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findHostBookings(hostId: string): Promise<BookingDocument[]> {
    // Tìm tất cả các phòng của chủ nhà
    const hostRooms = await this.roomModel
      .find({ hostId: new Types.ObjectId(hostId) })
      .select('_id')
      .exec();

    const roomIds = hostRooms.map((r) => r._id);

    return this.bookingModel
      .find({ roomId: { $in: roomIds } })
      .populate('customerId', 'fullName email phoneNumber')
      .populate('roomId', 'name pricePerNight address')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: Types.ObjectId | string): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('customerId', 'fullName email phoneNumber avatar')
      .populate('roomId', 'name roomType pricePerNight address images hostId')
      .exec();

    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn đặt phòng với ID: ${id}`);
    }
    return booking;
  }

  async updateStatus(
    id: Types.ObjectId | string,
    userId: string,
    userRole: string,
    updateDto: UpdateBookingStatusDto,
  ): Promise<BookingDocument> {
    const booking = await this.findById(id);
    const room = await this.roomModel.findById(booking.roomId).exec();

    // Lưu ý: findById đã populate customerId thành object user → phải lấy _id để so sánh
    const bookingCustomerId =
      (booking.customerId as { _id?: unknown })?._id ?? booking.customerId;
    const isCustomer = bookingCustomerId.toString() === userId.toString();
    const isHost = room && room.hostId.toString() === userId.toString();
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isCustomer && !isHost && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên đơn đặt phòng này');
    }

    // Nếu là khách hàng chỉ được phép hủy đơn (CANCELLED)
    if (isCustomer && !isHost && !isAdmin) {
      if (
        updateDto.status &&
        updateDto.status !== BookingStatus.CANCELLED
      ) {
        throw new ForbiddenException('Khách hàng chỉ có quyền yêu cầu hủy đơn');
      }
      // Chính sách hủy: chỉ được hủy trước 24 giờ so với ngày nhận phòng
      if (updateDto.status === BookingStatus.CANCELLED) {
        const checkIn = new Date(booking.checkInDate);
        const cutoff = new Date(checkIn.getTime() - 24 * 60 * 60 * 1000);
        if (new Date() > cutoff) {
          throw new BadRequestException(
            'Chỉ được hủy trước 24 giờ so với ngày nhận phòng. Vui lòng liên hệ chủ nhà.',
          );
        }
      }
    }

    // Không cho hủy/hoàn thành đơn đã kết thúc
    if (
      (booking.status === BookingStatus.CANCELLED ||
        booking.status === BookingStatus.COMPLETED) &&
      updateDto.status
    ) {
      throw new BadRequestException('Đơn đặt phòng đã kết thúc, không thể thay đổi trạng thái.');
    }

    const updated = await this.bookingModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate('customerId', 'fullName email phoneNumber')
      .populate('roomId', 'name roomType pricePerNight address')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy đơn đặt phòng');
    }

    // Nếu hủy đơn đã thanh toán → đánh dấu hoàn tiền
    if (updateDto.status === BookingStatus.CANCELLED && booking.paymentStatus === PaymentStatus.PAID) {
      await this.bookingModel.findByIdAndUpdate(id, { paymentStatus: PaymentStatus.REFUNDED }).exec();
      updated.paymentStatus = PaymentStatus.REFUNDED;
    }

    return updated;
  }

  /**
   * Thanh toan (gia lap): danh dau don la da thanh toan.
   * Customer (chu don) hoac admin. Tra ve booking cap nhat.
   */
  async pay(
    id: Types.ObjectId | string,
    userId: string,
    userRole: string,
  ): Promise<BookingDocument> {
    const booking = await this.findById(id);
    const customerId =
      (booking.customerId as { _id?: unknown })?._id ?? booking.customerId;
    const isCustomer = customerId.toString() === userId.toString();
    const isAdmin = userRole === UserRole.ADMIN;
    if (!isCustomer && !isAdmin) {
      throw new ForbiddenException('Ban khong co quyen thanh toan don nay');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Don da huy, khong the thanh toan');
    }
    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Don da duoc thanh toan truoc do');
    }

    const updated = await this.bookingModel
      .findByIdAndUpdate(id, { paymentStatus: PaymentStatus.PAID }, { new: true })
      .populate('customerId', 'fullName email phoneNumber')
      .populate('roomId', 'name roomType pricePerNight address')
      .exec();

    if (!updated) throw new NotFoundException('Khong tim thay don dat phong');

    // Gui bien lai email (neu cau hinh SMTP)
    try {
      const cust = updated.customerId as { email?: string; fullName?: string };
      if (cust?.email) {
        await this.sendEmail(
          cust.email,
          'Bien lai thanh toan - ' + ((updated.roomId as { name?: string })?.name || ''),
          '<h2>Thanh toan thanh cong!</h2><p>Cam on ' + (cust.fullName || 'ban') + '.</p>'
            + '<p>Ma don: ' + updated._id + '</p>'
            + '<p>Tong tien: ' + updated.totalPrice.toLocaleString('vi-VN') + 'd - Da thanh toan.</p>',
        );
      }
    } catch (err) {
      // bo qua
    }

    return updated;
  }

  /**
   * Hoan tien (admin): danh dau refunded.
   */
  async refund(id: Types.ObjectId | string): Promise<BookingDocument> {
    const updated = await this.bookingModel
      .findByIdAndUpdate(id, { paymentStatus: PaymentStatus.REFUNDED }, { new: true })
      .populate('customerId', 'fullName email phoneNumber')
      .populate('roomId', 'name roomType pricePerNight address')
      .exec();
    if (!updated) throw new NotFoundException('Khong tim thay don dat phong');
    return updated;
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const host = process.env.SMTP_HOST;
    if (!host) {
      // Chua cau hinh SMTP: ghi log de khong lam fail request
      console.log('[email:skip] SMTP_HOST chua cau hinh. To:', to, '| Subject:', subject);
      return;
    }
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'StayNest <noreply@staynest.com>',
      to,
      subject,
      html,
    });
  }
}
