import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FavoritesService } from './favorites.service.js';
import { FavoritesController } from './favorites.controller.js';
import { Favorite, FavoriteSchema } from '../../entities/favorite.entity.js';
import { Room, RoomSchema } from '../../entities/room.entity.js';
import { RoomsModule } from '../rooms/rooms.module.js';

/**
 * FavoritesModule — Quản lý phòng yêu thích của người dùng
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
    RoomsModule,
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
