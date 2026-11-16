import {
  Controller,
  Get,
  Post,
  Body,
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
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';

/**
 * Bài 04 & Bài 06: Controller Đánh giá & Nhận xét
 */
@ApiTags('Reviews - Đánh giá phòng')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Khách hàng gửi nhận xét & chấm điểm sao cho phòng' })
  @ApiResponse({ status: 201, description: 'Đánh giá thành công' })
  create(
    @CurrentUser('sub') customerId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(customerId, createReviewDto);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Lấy tất cả đánh giá của một phòng/homestay' })
  findByRoom(@Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId) {
    return this.reviewsService.findByRoom(roomId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa đánh giá (Người viết hoặc Admin)' })
  remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.reviewsService.remove(id, userId, userRole);
  }
}
