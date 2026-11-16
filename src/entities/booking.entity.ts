import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

@Schema({ timestamps: true, collection: 'bookings' })
export class Booking {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  roomId!: Types.ObjectId;

  @Prop({ required: true, type: Date })
  checkInDate!: Date;

  @Prop({ required: true, type: Date })
  checkOutDate!: Date;

  @Prop({ required: true, min: 1, default: 1 })
  totalGuests!: number;

  @Prop({ required: true, min: 1, default: 1 })
  numberOfNights!: number;

  @Prop({ required: true, min: 0 })
  totalPrice!: number;

  @Prop({
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING,
  })
  status!: BookingStatus;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.UNPAID,
  })
  paymentStatus!: PaymentStatus;

  @Prop({ default: '' })
  note?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
