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
} from '../../entities/booking.entity.js';
import { Room, RoomDocument, RoomStatus } from '../../entities/room.entity.js';
import { UserRole } from '../../entities/user.entity.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { calculateNights } from '../../utils/helpers.js';

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

    return newBooking.save();
  }

  async findAll(): Promise<BookingDocument[]> {
    return this.bookingModel
      .find()
      .populate('customerId', 'fullName email phoneNumber avatar')
      .populate('roomId', 'name roomType pricePerNight address images')
      .sort({ createdAt: -1 })
      .exec();
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

    const isCustomer = booking.customerId.toString() === userId.toString();
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
    }

    const updated = await this.bookingModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate('customerId', 'fullName email phoneNumber')
      .populate('roomId', 'name roomType pricePerNight address')
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy đơn đặt phòng');
    }

    return updated;
  }
}
