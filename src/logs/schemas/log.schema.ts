// src/logs/schemas/log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

@Schema({ timestamps: { createdAt: 'timestamp', updatedAt: false } })
export class Log extends mongoose.Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  actor: User; // User thực hiện

  @Prop({ required: true })
  action: string; // 'BLOCK_USER', 'DELETE_DOCUMENT', v.v.

  @Prop()
  targetId: string; // ID của đối tượng bị tác động (user, doc)
}
export const LogSchema = SchemaFactory.createForClass(Log);