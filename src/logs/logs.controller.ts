// src/logs/logs.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';
import { LogsService } from './logs.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN) // Chỉ Admin được xem logs
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  getLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.logsService.getLogs(page, limit);
  }
}