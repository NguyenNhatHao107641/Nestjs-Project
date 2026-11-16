import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

/**
 * Bài 02: Interceptor chuẩn hóa dữ liệu trả về của toàn bộ API
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    const ctxType = context.getType<string>();
    // Nếu là GraphQL request thì không transform response dạng REST
    if (ctxType === 'graphql') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const statusCode = response?.statusCode ?? 200;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        data,
      })),
    );
  }
}
