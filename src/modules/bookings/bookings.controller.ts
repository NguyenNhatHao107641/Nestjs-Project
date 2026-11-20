import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Throttle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';
import { UserRole } from '../../entities/user.entity.js';

/**
 * Bài 04 & Bài 06: Controller Đặt phòng Homestay / Khách sạn
 */
@ApiTags('Bookings - Đặt phòng & Quản lý đơn')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  // Chống spam đặt phòng: tối đa 20 đơn / phút
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Khách hàng đặt phòng homestay / khách sạn' })
  @ApiResponse({ status: 201, description: 'Đặt phòng thành công' })
  create(
    @CurrentUser('sub') customerId: string,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(customerId, createBookingDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy tất cả đơn đặt phòng (Chỉ Admin)' })
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Lấy danh sách các đơn đặt phòng của tôi' })
  findMyBookings(@CurrentUser('sub') customerId: string) {
    return this.bookingsService.findMyBookings(customerId);
  }

  @Get('host-bookings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Chủ nhà xem các đơn đặt phòng của các homestay mình quản lý' })
  findHostBookings(@CurrentUser('sub') hostId: string) {
    return this.bookingsService.findHostBookings(hostId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết đơn đặt phòng' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.bookingsService.findById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn đặt (Xác nhận, Hủy, Hoàn thành)' })
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() updateDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, userId, userRole, updateDto);
  }


  @Patch(':id/pay')
  @ApiOperation({ summary: 'Thanh toán đơn đặt phòng (giả lập) — đánh dấu đã thanh toán' })
  @ApiBearerAuth('access-token')
  pay(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.bookingsService.pay(id, userId, userRole);
  }

  @Patch(':id/refund')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Hoàn tiền cho đơn đã thanh toán (chỉ Admin)' })
  @ApiBearerAuth('access-token')
  refund(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.bookingsService.refund(id);
  }
}
