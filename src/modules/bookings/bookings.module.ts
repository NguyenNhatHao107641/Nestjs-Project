import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsService } from './bookings.service.js';
import { BookingsController } from './bookings.controller.js';
import { Booking, BookingSchema } from '../../entities/booking.entity.js';
import { Room, RoomSchema } from '../../entities/room.entity.js';
import { RoomsModule } from '../rooms/rooms.module.js';

/**
 * Bài 02: BookingsModule
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
    RoomsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService, MongooseModule],
})
export class BookingsModule {}
