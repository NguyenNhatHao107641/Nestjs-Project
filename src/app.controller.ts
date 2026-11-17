import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

/**
 * Endpoint thông tin hệ thống được chuyển sang "/api"
 * để nhường "/" cho trang chủ Frontend (thư mục public/)
 */
@ApiTags('Root - Hệ thống')
@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Trang chủ API & Thông tin hệ thống' })
  getHello() {
    return this.appService.getHello();
  }
}
