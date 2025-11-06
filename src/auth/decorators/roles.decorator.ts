// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/schemas/user.schema';

// Tên của metadata key
export const ROLES_KEY = 'roles';

// Decorator @Roles() sẽ nhận vào các vai trò
// Ví dụ: @Roles(UserRole.ADMIN, UserRole.MODERATOR)
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);