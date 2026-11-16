import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Bật CORS cho phép các ứng dụng Frontend kết nối
  app.enableCors();

  // Bài 07: ValidationPipe toàn cục - kiểm tra DTO tự động
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các thuộc tính không có trong DTO
      transform: true, // Tự động convert kiểu dữ liệu (vd string sang number theo decorator)
      forbidNonWhitelisted: false,
    }),
  );

  // Bài 12: Bộ lọc ngoại lệ toàn cục - Chuẩn hóa response lỗi
  app.useGlobalFilters(new HttpExceptionFilter());

  // Bài 02: Interceptor toàn cục - Chuẩn hóa response trả về
  app.useGlobalInterceptors(new TransformInterceptor());

  // Cấu hình Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Homestay & Hotel Booking API')
    .setDescription(
      'Hệ sinh thái API Quản lý và Đặt phòng Homestay / Khách sạn hoàn chỉnh với NestJS & MongoDB',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập access token JWT của bạn',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth - Xác thực người dùng')
    .addTag('Users - Quản lý người dùng')
    .addTag('Rooms - Quản lý phòng & Homestay')
    .addTag('Bookings - Đặt phòng & Quản lý đơn')
    .addTag('Reviews - Đánh giá phòng')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Ứng dụng NestJS đang chạy tại: http://localhost:${port}`);
  logger.log(`📖 Tài liệu Swagger API Docs: http://localhost:${port}/api/docs`);
  logger.log(`🔮 GraphQL Playground: http://localhost:${port}/graphql`);
}

await bootstrap();
