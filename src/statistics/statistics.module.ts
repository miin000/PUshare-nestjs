import { Module, Global } from '@nestjs/common'; // <-- Thêm Global
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Document, DocumentSchema } from 'src/documents/schemas/document.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { PlatformStats, PlatformStatsSchema } from './schemas/platform-stats.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Document.name, schema: DocumentSchema },
      { name: User.name, schema: UserSchema },
      { name: PlatformStats.name, schema: PlatformStatsSchema },
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}