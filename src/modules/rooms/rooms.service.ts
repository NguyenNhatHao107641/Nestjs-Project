import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument, RoomStatus } from '../../entities/room.entity.js';
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

  async findAll(filter: FilterRoomDto): Promise<RoomDocument[]> {
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

    return this.roomModel
      .find(query)
      .populate('hostId', 'fullName email phoneNumber avatar')
      .sort({ createdAt: -1 })
      .exec();
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

    if (
      userRole !== UserRole.ADMIN &&
      room.hostId.toString() !== userId.toString()
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

    if (
      userRole !== UserRole.ADMIN &&
      room.hostId.toString() !== userId.toString()
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
}
