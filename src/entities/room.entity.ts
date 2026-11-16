import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoomDocument = HydratedDocument<Room>;

export enum RoomType {
  STANDARD = 'standard',
  DELUXE = 'deluxe',
  SUITE = 'suite',
  VILLA = 'villa',
  ENTIRE_HOMESTAY = 'entire_homestay',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  MAINTENANCE = 'maintenance',
}

@Schema({ _id: false })
export class Address {
  @Prop({ default: '' })
  street!: string;

  @Prop({ default: '' })
  district!: string;

  @Prop({ required: true, default: 'Hà Nội' })
  city!: string;

  @Prop({ default: 'Việt Nam' })
  country!: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ timestamps: true, collection: 'rooms' })
export class Room {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({
    type: String,
    enum: Object.values(RoomType),
    default: RoomType.ENTIRE_HOMESTAY,
  })
  roomType!: RoomType;

  @Prop({ required: true, min: 0 })
  pricePerNight!: number;

  @Prop({ required: true, min: 1, default: 2 })
  capacity!: number;

  @Prop({ default: 1, min: 1 })
  bedroomCount!: number;

  @Prop({ default: 1, min: 1 })
  bathroomCount!: number;

  @Prop({ type: [String], default: [] })
  amenities!: string[];

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ type: AddressSchema, required: true })
  address!: Address;

  @Prop({
    type: String,
    enum: Object.values(RoomStatus),
    default: RoomStatus.AVAILABLE,
  })
  status!: RoomStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  hostId!: Types.ObjectId;

  @Prop({ default: 5, min: 1, max: 5 })
  rating!: number;

  @Prop({ default: 0, min: 0 })
  totalReviews!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
