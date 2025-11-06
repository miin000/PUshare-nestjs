// src/documents/schemas/document.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export enum DocumentStatus {
  PROCESSING = 'PROCESSING', // Đang chờ (ví dụ: quét virus, nén)
  VISIBLE = 'VISIBLE',       // Hiển thị công khai
  BLOCKED = 'BLOCKED',       // Bị admin/mod khóa
}

@Schema({ timestamps: { createdAt: 'uploadDate', updatedAt: true } })
export class Document extends mongoose.Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  fileUrl: string; // Đường dẫn tới file đã lưu (ví dụ: /uploads/ten-file.pdf)

  @Prop({ required: true })
  fileType: string; // 'PDF', 'DOCX', v.v.

  @Prop({ required: true })
  fileSize: number; // Kích thước file (bytes)

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  uploader: User; // Tham chiếu đến User đã upload

  @Prop({ type: String, enum: DocumentStatus, default: DocumentStatus.VISIBLE })
  status: DocumentStatus;

  @Prop({ type: [String] })
  tags: string[]; // ['Physics', 'Exam Paper']

  @Prop()
  faculty: string; // 'Information Technology'

  @Prop({ default: 0 })
  downloadCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  // uploadDate được tự động thêm bởi timestamps
}

export const DocumentSchema = SchemaFactory.createForClass(Document);