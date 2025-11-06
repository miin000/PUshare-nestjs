// src/admin/admin.controller.ts
import { Controller, Post, Param, UseGuards, Patch, Body, Delete, Get, Query, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';
import { GetUsersQueryDto } from './dto/get-users-query.dto';

// Áp dụng cho toàn bộ Controller:
@UseGuards(AuthGuard('jwt'), RolesGuard) // 1. Yêu cầu đăng nhập, 2. Kiểm tra vai trò
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- R2: Moderator Endpoints ---
  // (Admin cũng có thể dùng vì Admin kế thừa Mod)

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post('users/:id/block')
  blockUser(@Param('id') userId: string, @Request() req) {
    return this.adminService.blockUser(userId, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post('users/:id/unblock')
  unblockUser(@Param('id') userId: string, @Request() req) {
    return this.adminService.unblockUser(userId, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post('documents/:id/block')
  blockDocument(@Param('id') docId: string) {
    return this.adminService.blockDocument(docId);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post('documents/:id/unblock')
  unblockDocument(@Param('id') docId: string) {
    return this.adminService.unblockDocument(docId);
  }

  // --- R3: Admin Only Endpoints ---

  @Roles(UserRole.ADMIN)
  @Delete('users/:id')
  deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Roles(UserRole.ADMIN)
  @Delete('documents/:id')
  deleteDocument(@Param('id') docId: string) {
    return this.adminService.deleteDocument(docId);
  }

  @Roles(UserRole.ADMIN)
  @Patch('users/:id/role')
  setUserRole(
    @Param('id') userId: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.setUserRole(userId, role);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Get('users')
  getUsers(@Query() queryDto: GetUsersQueryDto) {
    return this.adminService.getUsers(queryDto);
  }
}