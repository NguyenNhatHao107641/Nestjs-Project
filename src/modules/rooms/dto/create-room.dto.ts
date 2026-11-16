import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoomType, RoomStatus } from '../../../entities/room.entity.js';

export class AddressDto {
  @ApiPropertyOptional({ example: '123 Đường Trần Phú' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: 'Phường 1' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'Đà Lạt', description: 'Tỉnh / Thành phố' })
  @IsString()
  @IsNotEmpty({ message: 'Tỉnh / Thành phố không được để trống' })
  city!: string;

  @ApiPropertyOptional({ example: 'Việt Nam', default: 'Việt Nam' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class CreateRoomDto {
  @ApiProperty({ example: 'Homestay Mây Trắng Giữa Rừng Thông', description: 'Tên homestay/phòng' })
  @IsString()
  @IsNotEmpty({ message: 'Tên phòng/homestay không được để trống' })
  name!: string;

  @ApiProperty({
    example: 'Căn hộ view núi cực đẹp, không gian yên tĩnh, đầy đủ tiện nghi BBQ',
    description: 'Mô tả chi tiết',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  description!: string;

  @ApiProperty({
    enum: RoomType,
    default: RoomType.ENTIRE_HOMESTAY,
    description: 'standard | deluxe | suite | villa | entire_homestay',
  })
  @IsEnum(RoomType)
  roomType!: RoomType;

  @ApiProperty({ example: 850000, description: 'Giá phòng mỗi đêm (VNĐ)' })
  @IsNumber()
  @Min(0, { message: 'Giá phòng không được âm' })
  pricePerNight!: number;

  @ApiProperty({ example: 4, description: 'Số khách tối đa' })
  @IsNumber()
  @Min(1, { message: 'Sức chứa tối thiểu 1 người' })
  capacity!: number;

  @ApiPropertyOptional({ example: 2, description: 'Số phòng ngủ' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  bedroomCount?: number;

  @ApiPropertyOptional({ example: 1, description: 'Số phòng tắm' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  bathroomCount?: number;

  @ApiPropertyOptional({
    example: ['Wifi', 'Điều hòa', 'Bếp nấu', 'Bếp nướng BBQ', 'Chỗ để ô tô'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  amenities?: string[];

  @ApiPropertyOptional({
    example: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ApiPropertyOptional({ enum: RoomStatus, default: RoomStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;
}
