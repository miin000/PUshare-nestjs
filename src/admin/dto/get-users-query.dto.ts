// src/admin/dto/get-users-query.dto.ts
import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from 'src/users/schemas/user.schema';

export class GetUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // R2.2.2

  @IsOptional()
  @IsIn(['joinedDate', 'fullName', 'email'])
  sortBy?: string = 'joinedDate'; // R2.2.3

  @IsOptional()
  @IsString()
  @IsIn(Object.values(UserRole))
  role?: UserRole; // Dùng cho R3.4.3 (Lọc Moderator)

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}