// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy danh sách vai trò được yêu cầu (từ @Roles decorator)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Nếu endpoint không yêu cầu vai trò nào (không có @Roles)
    //    -> cho phép truy cập (để tương thích với AuthGuard)
    if (!requiredRoles) {
      return true;
    }

    // 3. Lấy thông tin user từ request (đã được JwtStrategy giải mã)
    const { user } = context.switchToHttp().getRequest();

    // 4. So sánh vai trò của user với các vai trò được yêu cầu
    return requiredRoles.some((role) => user.role === role);
  }
}