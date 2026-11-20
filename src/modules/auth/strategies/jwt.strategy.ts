import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  fullName: string;
}

/**
 * Bài 09: Chiến lược xác thực JWT Passport Strategy
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.secret') ||
        'HomestaySecretKey2026_SecureJwtPayloadKey',
    });
  }

  async validate(payload: JwtPayload) {
    let user: Awaited<ReturnType<UsersService['findById']>>;
    try {
      user = await this.usersService.findById(payload.sub);
    } catch (error) {
      // Token cũ có thể còn trong trình duyệt sau khi user bị xóa hoặc chạy lại seed.
      // Trường hợp này là lỗi xác thực, không phải lỗi 404 của tài nguyên users.
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Token không hợp lệ hoặc người dùng không tồn tại');
      }
      throw error;
    }
    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ hoặc người dùng không tồn tại');
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      fullName: payload.fullName,
    };
  }
}
