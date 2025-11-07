import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const GLOBAL_STATS_ID = 'GLOBAL_STATS';

@Schema()
export class PlatformStats extends Document {
  @Prop({ default: GLOBAL_STATS_ID })
  declare _id: string;

  @Prop({ default: 0 })
  totalUploads: number;

  @Prop({ default: 0 })
  totalDownloads: number;

  @Prop({ default: 0 })
  activeUsers: number;
}


export const PlatformStatsSchema = SchemaFactory.createForClass(PlatformStats);