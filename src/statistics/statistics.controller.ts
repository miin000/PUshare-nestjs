// src/statistics/statistics.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('platform')
  getPlatformStats() {
    return this.statisticsService.getPlatformStats();
  }

  @Get('uploads-over-time')
  getUploadsOverTime() {
    return this.statisticsService.getUploadsOverTime();
  }
}