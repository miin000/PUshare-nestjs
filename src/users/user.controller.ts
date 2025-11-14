// src/users/users.controller.ts
import { Controller, Get, Body, Patch, Param, UseGuards, Request, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { ChangePasswordDto } from './dto/change-password.dto';

@UseGuards(AuthGuard('jwt')) // Bảo vệ tất cả các route trong controller này
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // R1.5.1: Sửa thông tin cá nhân
  @Patch('me/profile')
  updateMyProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    // req.user.userId lấy từ token
    return this.usersService.updateProfile(req.user.userId, updateUserDto);
  }

  @Post('me/change-password')
  changeMyPassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.userId, changePasswordDto);
  }

  // R1.2.4: Xem hồ sơ của User khác
  @Get('profile/:userId')
  getUserProfile(@Param('userId') userId: string) {
    return this.usersService.findById(userId);
  }

  // Bổ sung: Lấy hồ sơ của chính mình (để hiển thị trên navbar/profile page)
  @Get('me/profile')
  getMyProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  // R1.6.1, R1.6.2: Xem tổng số lượt tải/upload (cho trang profile)
  @Get('me/stats')
  getMyStats(@Request() req) {
    return this.usersService.getMyStats(req.user.userId);
  }

  @Get(':userId/stats')
  getUserStats(@Param('userId') userId: string) {
    return this.usersService.getMyStats(userId); // Dùng lại hàm cũ
  }
}