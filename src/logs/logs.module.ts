// src/logs/logs.module.ts
import { Module, Global } from '@nestjs/common';
import { LogsService } from './logs.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Log, LogSchema } from './schemas/log.schema';
import { LogsController } from './logs.controller';

@Global() // <-- Đánh dấu Global để service có thể được inject ở mọi nơi
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
  ],
  providers: [LogsService],
  exports: [LogsService],
  controllers: [LogsController], // <-- Export service
})
export class LogsModule {}