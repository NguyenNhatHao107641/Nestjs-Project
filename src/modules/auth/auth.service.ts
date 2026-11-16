import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

/**
 * Bài 09 & Bài 10: Authentication và Refresh Token Service
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const tokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    await this.usersService.updateRefreshToken(user._id, tokens.refreshToken);

    return {
      message: 'Đăng ký tài khoản thành công',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const tokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    // Lưu hash của refresh token vào DB (Bài 10)
    await this.usersService.updateRefreshToken(user._id, tokens.refreshToken);

    return {
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    const refreshSecret =
      this.configService.get<string>('refreshToken.secret') ||
      'HomestayRefreshTokenSecretKey2026_SuperSecure';

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Quyền truy cập bị từ chối');
    }

    // So khớp refresh token với hash trong DB
    const isTokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isTokenMatch) {
      throw new UnauthorizedException('Refresh token không khớp');
    }

    // Cấp lại cặp token mới (Token Rotation - Bài 10)
    const newTokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    await this.usersService.updateRefreshToken(user._id, newTokens.refreshToken);

    return {
      message: 'Làm mới token thành công',
      ...newTokens,
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Đăng xuất thành công' };
  }

  private async generateTokens(payload: JwtPayload) {
    const jwtSecret =
      this.configService.get<string>('jwt.secret') ||
      'HomestaySecretKey2026_SecureJwtPayloadKey';
    const jwtExpiresIn = this.configService.get<string>('jwt.expiresIn') || '1h';

    const refreshSecret =
      this.configService.get<string>('refreshToken.secret') ||
      'HomestayRefreshTokenSecretKey2026_SuperSecure';
    const refreshExpiresIn =
      this.configService.get<string>('refreshToken.expiresIn') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: jwtExpiresIn,
    };
  }
}
