/* src/subjects/schemas/subject.schema.ts
  Lưu trữ danh sách TẤT CẢ các môn học. 
  Mỗi môn học chỉ tồn tại 1 LẦN.
*/
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Subject extends mongoose.Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string; // Tên môn học (VD: "Toán rời rạc")

  @Prop({ required: true, unique: true, trim: true })
  code: string; // Mã học phần (VD: "CSE703024")

  @Prop({ required: true, trim: true })
  managingFaculty: string; // Khoa quản lý (VD: "CSE", "FFS")
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);