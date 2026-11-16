import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  BookingStatus,
  PaymentStatus,
} from '../../../entities/booking.entity.js';

export class UpdateBookingStatusDto {
  @ApiPropertyOptional({
    enum: BookingStatus,
    description: 'pending | confirmed | cancelled | completed',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: 'unpaid | paid | refunded',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
