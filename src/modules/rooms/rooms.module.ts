import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsService } from './rooms.service.js';
import { RoomsController } from './rooms.controller.js';
import { Room, RoomSchema } from '../../entities/room.entity.js';
import { Booking, BookingSchema } from '../../entities/booking.entity.js';

/**
 * Bài 02: RoomsModule
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      // Booking được inject vào RoomsService để tra lịch đã đặt của phòng (availability)
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService, MongooseModule],
})
export class RoomsModule {}
