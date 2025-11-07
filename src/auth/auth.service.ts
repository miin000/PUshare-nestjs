// src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { StatisticsService } from 'src/statistics/statistics.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private statisticsService: StatisticsService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 2. Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Tạo user mới
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      fullName,
    });

    await this.statisticsService.incrementActiveUsers(1);

    // 4. Trả về thông tin (không trả password)
    const { password: _, ...result } = user.toObject();
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Tìm user bằng email
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Tạo JWT Token
    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}