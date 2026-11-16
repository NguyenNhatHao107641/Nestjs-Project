import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: 'Homestay & Hotel Booking API',
      version: '1.0.0',
      description:
        'Hệ thống Quản lý và Đặt phòng Homestay / Khách sạn xây dựng bằng NestJS & MongoDB',
      docs: '/api/docs',
      graphql: '/graphql',
      status: 'online',
      timestamp: new Date().toISOString(),
    };
  }
}
