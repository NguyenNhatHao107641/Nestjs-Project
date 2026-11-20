import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RoomType } from '../../../entities/room.entity.js';

export class FilterRoomDto {
  @ApiPropertyOptional({ example: 'Đà Lạt', description: 'Tìm theo tỉnh / thành phố' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: RoomType, description: 'Lọc theo loại phòng' })
  @IsOptional()
  @IsEnum(RoomType)
  roomType?: RoomType;

  @ApiPropertyOptional({ example: 500000, description: 'Giá thấp nhất (VNĐ)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 2000000, description: 'Giá cao nhất (VNĐ)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 2, description: 'Số lượng khách' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  guests?: number;

  @ApiPropertyOptional({ example: 'mây trắng', description: 'Từ khóa tìm kiếm theo tên/mô tả' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ example: 1, description: 'Trang (phan trang)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 12, description: 'So ban ghi moi trang (phan trang)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

}
