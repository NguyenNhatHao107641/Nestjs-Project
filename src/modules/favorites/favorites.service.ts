import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from '../../entities/favorite.entity.js';
import { Room, RoomDocument } from '../../entities/room.entity.js';
import { RoomsService } from '../rooms/rooms.service.js';

/**
 * FavoritesService — lưu & quản lý danh sách phòng yêu thích của người dùng
 */
@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,
    @InjectModel(Room.name)
    private readonly roomModel: Model<RoomDocument>,
    private readonly roomsService: RoomsService,
  ) {}

  /** Danh sách phòng yêu thích (populate đầy đủ thông tin phòng) */
  async findMy(userId: string): Promise<RoomDocument[]> {
    const favorites = await this.favoriteModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    const roomIds = favorites.map((f) => f.roomId);
    return this.roomModel
      .find({ _id: { $in: roomIds } })
      .sort({ createdAt: -1 })
      .exec();
  }

  /** Danh sách ID phòng đã lưu (nhẹ — dùng để tô màu nút ♥ trên card) */
  async findMyIds(userId: string): Promise<string[]> {
    const favorites = await this.favoriteModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('roomId')
      .exec();
    return favorites.map((f) => String(f.roomId));
  }

  /** Thêm phòng vào yêu thích (idempotent — lưu lại không lỗi) */
  async add(userId: string, roomId: Types.ObjectId | string) {
    const room = await this.roomsService.findById(roomId);
    await this.favoriteModel.updateOne(
      {
        userId: new Types.ObjectId(userId),
        roomId: room._id,
      },
      { $setOnInsert: { userId: new Types.ObjectId(userId), roomId: room._id } },
      { upsert: true },
    );
    return { message: 'Đã lưu vào danh sách yêu thích', roomId: String(room._id) };
  }

  /** Xóa phòng khỏi yêu thích */
  async remove(userId: string, roomId: Types.ObjectId | string) {
    const room = await this.roomsService.findById(roomId);
    const deleted = await this.favoriteModel
      .deleteOne({
        userId: new Types.ObjectId(userId),
        roomId: room._id,
      })
      .exec();

    if (deleted.deletedCount === 0) {
      throw new NotFoundException('Phòng này không nằm trong danh sách yêu thích của bạn');
    }
    return { message: 'Đã xóa khỏi danh sách yêu thích', roomId: String(room._id) };
  }

  /** Toggle: đang lưu → xóa, chưa lưu → thêm. Trả trạng thái mới cho UI */
  async toggle(userId: string, roomId: Types.ObjectId | string) {
    const room = await this.roomsService.findById(roomId);
    const existing = await this.favoriteModel
      .findOne({
        userId: new Types.ObjectId(userId),
        roomId: room._id,
      })
      .exec();

    if (existing) {
      await existing.deleteOne();
      return { favorited: false, message: 'Đã xóa khỏi danh sách yêu thích' };
    }

    try {
      await this.favoriteModel.create({
        userId: new Types.ObjectId(userId),
        roomId: room._id,
      });
    } catch (err) {
      // 11000 = duplicate key: race giữa 2 lần toggle gần nhau → coi như đã lưu
      if ((err as { code?: number }).code === 11000) {
        throw new ConflictException('Phòng đã có trong danh sách yêu thích');
      }
      throw err;
    }
    return { favorited: true, message: 'Đã lưu vào danh sách yêu thích' };
  }
}
