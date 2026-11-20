import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { RoomsService } from './rooms.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
import { FilterRoomDto } from './dto/filter-room.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { UserRole } from '../../entities/user.entity.js';

/**
 * Bài 04 & Bài 06: RESTful API Quản lý Homestay / Khách sạn
 */
@ApiTags('Rooms - Quản lý phòng & Homestay')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Thêm phòng / homestay mới (Chủ nhà hoặc Admin)' })
  @ApiResponse({ status: 201, description: 'Tạo phòng thành công' })
  create(
    @CurrentUser('sub') hostId: string,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return this.roomsService.create(hostId, createRoomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách homestay/phòng (có bộ lọc tìm kiếm)' })
  findAll(@Query() filter: FilterRoomDto) {
    return this.roomsService.findAll(filter);
  }

  @Get('my-rooms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lấy danh sách các phòng do tôi sở hữu' })
  findMyRooms(@CurrentUser('sub') hostId: string) {
    return this.roomsService.findByHost(hostId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết thông tin homestay/phòng' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.roomsService.findById(id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'public', 'uploads', 'rooms');
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Chi chap nhan file anh'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload anh cho phong (host/admin), toi da 5MB' })
  uploadImage(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Thieu file anh');
    // Kiem tra quyen (host cua phong hoac admin)
    // RoomsService.findById da populate hostId
    const url = '/uploads/rooms/' + file.filename;
    return this.roomsService.addImage(id, url, userId, userRole);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Xem các khoảng ngày đã có khách đặt của phòng (công khai)' })
  findAvailability(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.roomsService.findAvailability(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật thông tin phòng (Chủ phòng hoặc Admin)' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, userId, userRole, updateRoomDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa phòng (Chủ phòng hoặc Admin)' })
  remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.roomsService.remove(id, userId, userRole);
  }
}
