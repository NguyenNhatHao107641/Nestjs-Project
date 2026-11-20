import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument, RoomStatus } from '../../entities/room.entity.js';
import { Booking, BookingDocument, BookingStatus } from '../../entities/booking.entity.js';
import { UserRole } from '../../entities/user.entity.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
import { FilterRoomDto } from './dto/filter-room.dto.js';

/**
 * Bài 03 & 06: Rooms Service xử lý nghiệp vụ quản lý homestay / khách sạn
 */
@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name)
    private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  async create(
    hostId: string,
    createRoomDto: CreateRoomDto,
  ): Promise<RoomDocument> {
    const room = new this.roomModel({
      ...createRoomDto,
      hostId: new Types.ObjectId(hostId),
    });
    return room.save();
  }

  async findAll(filter: FilterRoomDto): Promise<any> {
    const query: Record<string, any> = {
      status: RoomStatus.AVAILABLE,
    };

    if (filter.city) {
      query['address.city'] = { $regex: new RegExp(filter.city, 'i') };
    }

    if (filter.roomType) {
      query.roomType = filter.roomType;
    }

    if (filter.guests) {
      query.capacity = { $gte: filter.guests };
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      query.pricePerNight = {};
      if (filter.minPrice !== undefined) {
        query.pricePerNight.$gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        query.pricePerNight.$lte = filter.maxPrice;
      }
    }

    if (filter.keyword) {
      query.$or = [
        { name: { $regex: new RegExp(filter.keyword, 'i') } },
        { description: { $regex: new RegExp(filter.keyword, 'i') } },
      ];
    }

    const usePagination = !!filter.page || !!filter.limit;
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 12;

    const base = this.roomModel
      .find(query)
      .populate('hostId', 'fullName email phoneNumber avatar')
      .sort({ createdAt: -1 });

    if (!usePagination) {
      return base.exec();
    }

    const [items, total] = await Promise.all([
      base.skip((page - 1) * limit).limit(limit).exec(),
      this.roomModel.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Them anh vao phong (URL). Dung cho upload: controller luu file roi goi ham nay.
   */
  async addImage(
    id: Types.ObjectId | string,
    imageUrl: string,
    userId?: string,
    userRole?: string,
  ): Promise<RoomDocument> {
    const room = await this.findById(id);
    const hostId = (room.hostId as { _id?: unknown })?._id ?? room.hostId;
    if (userRole !== UserRole.ADMIN && (!userId || hostId.toString() !== userId.toString())) {
      throw new ForbiddenException('Ban khong co quyen them anh cho phong nay');
    }
    const images = Array.isArray(room.images) ? room.images.slice() : [];
    images.push(imageUrl);
    const updated = await this.roomModel.findByIdAndUpdate(id, { images }, { new: true }).exec();
    if (!updated) throw new NotFoundException('Khong tim thay phong');
    return updated;
  }

  async findById(id: Types.ObjectId | string): Promise<RoomDocument> {
    const room = await this.roomModel
      .findById(id)
      .populate('hostId', 'fullName email phoneNumber avatar')
      .exec();
    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng với ID: ${id}`);
    }
    return room;
  }

  async findByHost(hostId: string): Promise<RoomDocument[]> {
    return this.roomModel
      .find({ hostId: new Types.ObjectId(hostId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: Types.ObjectId | string,
    userId: string,
    userRole: string,
    updateRoomDto: UpdateRoomDto,
  ): Promise<RoomDocument> {
    const room = await this.findById(id);

    // Lưu ý: findById đã populate hostId thành object user → phải lấy _id để so sánh
    const roomHostId = (room.hostId as { _id?: unknown })?._id ?? room.hostId;
    if (
      userRole !== UserRole.ADMIN &&
      roomHostId.toString() !== userId.toString()
    ) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa phòng này');
    }

    const updated = await this.roomModel
      .findByIdAndUpdate(id, updateRoomDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Không tìm thấy phòng với ID: ${id}`);
    }
    return updated;
  }

  async remove(
    id: Types.ObjectId | string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string }> {
    const room = await this.findById(id);

    // Lưu ý: findById đã populate hostId thành object user → phải lấy _id để so sánh
    const roomHostId = (room.hostId as { _id?: unknown })?._id ?? room.hostId;
    if (
      userRole !== UserRole.ADMIN &&
      roomHostId.toString() !== userId.toString()
    ) {
      throw new ForbiddenException('Bạn không có quyền xóa phòng này');
    }

    await this.roomModel.findByIdAndDelete(id).exec();
    return { message: 'Đã xóa phòng/homestay thành công' };
  }

  async updateRating(
    roomId: Types.ObjectId | string,
    rating: number,
    totalReviews: number,
  ): Promise<void> {
    await this.roomModel
      .findByIdAndUpdate(roomId, { rating, totalReviews })
      .exec();
  }

  /**
   * Lịch khả dụng của phòng: các khoảng ngày đã có khách đặt (pending/confirmed)
   * từ hôm nay trở đi — frontend dùng để chặn ngày trùng & hiển thị lịch
   */
  async findAvailability(
    roomId: Types.ObjectId | string,
  ): Promise<{ roomId: string; bookedRanges: Array<{ checkInDate: Date; checkOutDate: Date; status: string }> }> {
    await this.findById(roomId); // 404 nếu phòng không tồn tại

    const bookings = await this.bookingModel
      .find({
        roomId: new Types.ObjectId(roomId),
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        checkOutDate: { $gt: new Date() },
      })
      .select('checkInDate checkOutDate status')
      .sort({ checkInDate: 1 })
      .exec();

    return {
      roomId: String(roomId),
      bookedRanges: bookings.map((b) => ({
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        status: b.status,
      })),
    };
  }
}
