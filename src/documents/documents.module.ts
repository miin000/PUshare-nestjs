// src/documents/documents.module.ts
import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Document, DocumentSchema } from './schemas/document.schema';
import { MulterModule } from '@nestjs/platform-express';
import { UsersModule } from 'src/users/users.module'; // Sẽ cần để cập nhật stats

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Document.name, schema: DocumentSchema }]),
    
    // Cấu hình Multer
    MulterModule.register({
      dest: './uploads', // Thư mục lưu file (phải tạo thư mục này ở gốc dự án)
      // Chúng ta sẽ thêm logic lọc file và đổi tên file sau
    }),

    UsersModule, // Import để có thể inject UsersService
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}