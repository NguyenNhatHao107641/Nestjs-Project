import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Bài 07: Pipe kiểm tra và chuyển đổi MongoDB ObjectId
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        `Tham số ID '${value}' không phải định dạng MongoDB ObjectId hợp lệ`,
      );
    }
    return new Types.ObjectId(value);
  }
}
