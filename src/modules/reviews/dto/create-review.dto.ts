import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: '665000000000000000000001',
    description: 'ID của phòng / homestay được đánh giá',
  })
  @IsMongoId({ message: 'roomId phải là mã MongoDB ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'roomId không được để trống' })
  roomId!: string;

  @ApiProperty({ example: 5, description: 'Điểm đánh giá từ 1 đến 5 sao' })
  @IsInt({ message: 'Điểm đánh giá phải là số nguyên' })
  @Min(1, { message: 'Điểm đánh giá tối thiểu là 1 sao' })
  @Max(5, { message: 'Điểm đánh giá tối đa là 5 sao' })
  rating!: number;

  @ApiProperty({
    example: 'Phòng cực kỳ sạch sẽ, chủ nhà thân thiện, view ngắm hoàng hôn rất chill!',
    description: 'Nội dung nhận xét',
  })
  @IsString({ message: 'Nội dung nhận xét phải là chuỗi' })
  @IsNotEmpty({ message: 'Nội dung nhận xét không được để trống' })
  comment!: string;
}
