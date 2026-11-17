import { Injectable, HttpException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * VNThrottlerGuard — ThrottlerGuard mặc định nhưng thông báo lỗi tiếng Việt
 * (dùng qua APP_GUARD thay cho ThrottlerGuard thường)
 */
@Injectable()
export class VNThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      'Bạn thao tác quá nhanh, vui lòng đợi một phút rồi thử lại.',
      429,
    );
  }
}
