import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: '665000000000000000000001',
    description: 'ID của phòng / homestay cần đặt',
  })
  @IsMongoId({ message: 'roomId phải là mã MongoDB ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'roomId không được để trống' })
  roomId!: string;

  @ApiProperty({
    example: '2026-12-01T14:00:00.000Z',
    description: 'Ngày nhận phòng (ISO 8601 string)',
  })
  @IsDateString({}, { message: 'checkInDate phải là định dạng ngày ISO hợp lệ' })
  @IsNotEmpty({ message: 'checkInDate không được để trống' })
  checkInDate!: string;

  @ApiProperty({
    example: '2026-12-04T12:00:00.000Z',
    description: 'Ngày trả phòng (ISO 8601 string)',
  })
  @IsDateString({}, { message: 'checkOutDate phải là định dạng ngày ISO hợp lệ' })
  @IsNotEmpty({ message: 'checkOutDate không được để trống' })
  checkOutDate!: string;

  @ApiProperty({ example: 2, description: 'Số lượng khách' })
  @IsNumber()
  @Min(1, { message: 'Số lượng khách tối thiểu là 1' })
  totalGuests!: number;

  @ApiPropertyOptional({
    example: 'Chúng tôi sẽ đến vào khoảng 15h, cần phòng tầng cao',
    description: 'Ghi chú thêm',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
