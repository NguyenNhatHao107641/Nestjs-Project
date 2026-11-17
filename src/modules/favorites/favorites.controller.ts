import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { FavoritesService } from './favorites.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';

/**
 * Favorites — Danh sách phòng yêu thích của người dùng
 */
@ApiTags('Favorites - Phòng yêu thích')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách phòng yêu thích của tôi (populate đầy đủ)' })
  @ApiResponse({ status: 200, description: 'Trả về mảng Room' })
  findMy(@CurrentUser('sub') userId: string) {
    return this.favoritesService.findMy(userId);
  }

  @Get('ids')
  @ApiOperation({ summary: 'Danh sách ID phòng đã lưu (dùng tô màu nút ♥)' })
  findMyIds(@CurrentUser('sub') userId: string) {
    return this.favoritesService.findMyIds(userId);
  }

  @Post(':roomId/toggle')
  @ApiOperation({ summary: 'Bật/tắt yêu thích cho một phòng (toggle)' })
  @ApiResponse({ status: 201, description: 'Trả về { favorited, message }' })
  toggle(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @CurrentUser('sub') userId: string,
  ) {
    return this.favoritesService.toggle(userId, roomId);
  }

  @Post(':roomId')
  @ApiOperation({ summary: 'Thêm phòng vào yêu thích' })
  add(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @CurrentUser('sub') userId: string,
  ) {
    return this.favoritesService.add(userId, roomId);
  }

  @Delete(':roomId')
  @ApiOperation({ summary: 'Xóa phòng khỏi yêu thích' })
  remove(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @CurrentUser('sub') userId: string,
  ) {
    return this.favoritesService.remove(userId, roomId);
  }
}
