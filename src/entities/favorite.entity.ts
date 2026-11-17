import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FavoriteDocument = HydratedDocument<Favorite>;

/**
 * Yêu thích (lưu phòng) — quan hệ nhiều-nhiều giữa User và Room
 * Index kép (userId + roomId) đảm bảo 1 người chỉ lưu 1 phòng 1 lần
 */
@Schema({ timestamps: true, collection: 'favorites' })
export class Favorite {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  roomId!: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// 1 user chỉ được lưu mỗi phòng 1 lần
FavoriteSchema.index({ userId: 1, roomId: 1 }, { unique: true });
