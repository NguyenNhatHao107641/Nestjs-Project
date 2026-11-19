import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LoggerMiddleware } from './common/middlewares/logger.middleware.js';
import { VNThrottlerGuard } from './common/guards/vn-throttler.guard.js';

// Các module chức năng (theo cấu trúc Bài 02)
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { RoomsModule } from './modules/rooms/rooms.module.js';
import { BookingsModule } from './modules/bookings/bookings.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { FavoritesModule } from './modules/favorites/favorites.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { AppGraphQLModule } from './modules/graphql/app-graphql.module.js';

/**
 * Bài 02: AppModule - Module gốc của dự án
 * Tích hợp ConfigModule (Bài 11), MongooseModule (Bài 05), Middleware (Bài 08), GraphQL (Bài 13)
 */
@Module({
  imports: [
    // Bài 11: Cấu hình biến môi trường toàn cục
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // Bài 05: Kết nối Database MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('database.uri') ||
          'mongodb://127.0.0.1:27017/homestay_booking',
      }),
      inject: [ConfigService],
    }),

    // Giới hạn tần suất gọi API (rate limiting): mặc định 120 req/phút cho mỗi IP
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
    ]),

    // Các module nghiệp vụ
    UsersModule,
    AuthModule,
    RoomsModule,
    BookingsModule,
    ReviewsModule,
    FavoritesModule,
    ChatModule,
    AppGraphQLModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guard toàn cục: chặn spam theo giới hạn trên (thông báo tiếng Việt)
    { provide: APP_GUARD, useClass: VNThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  // Bài 08: Áp dụng LoggerMiddleware cho toàn bộ các route
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
