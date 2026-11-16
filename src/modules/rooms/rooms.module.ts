import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsService } from './rooms.service.js';
import { RoomsController } from './rooms.controller.js';
import { Room, RoomSchema } from '../../entities/room.entity.js';

/**
 * Bài 02: RoomsModule
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService, MongooseModule],
})
export class RoomsModule {}
