import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Document, DocumentSchema } from './schemas/document.schema';
import { MulterModule } from '@nestjs/platform-express';
import { UsersModule } from 'src/users/users.module';
import { diskStorage } from 'multer'; // <-- Import diskStorage
import { extname } from 'path'; // <-- Import extname (để lấy đuôi file)
import { randomBytes } from 'crypto'; // <-- Import crypto (để tạo tên ngẫu nhiên)

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Document.name, schema: DocumentSchema }]),

    // --- SỬA LỖI Ở ĐÂY ---
    // Cấu hình Multer chi tiết
    MulterModule.registerAsync({
      useFactory: () => ({
        // Không dùng 'dest', dùng 'storage'
        storage: diskStorage({
          // 1. Nơi lưu file
          destination: './uploads',

          // 2. Định nghĩa lại tên file
          filename: (req, file, callback) => {
            // Tạo một tên file ngẫu nhiên (16 bytes -> 32 ký tự hex)
            const randomName = randomBytes(16).toString('hex');
            // Lấy phần mở rộng file gốc (ví dụ: '.pdf')
            const fileExtName = extname(file.originalname);
            // Tên file mới: randomName + fileExtName (ví dụ: 1a2b...3c4d.pdf)
            callback(null, `${randomName}${fileExtName}`);
          },
        }),
        // 3. (Tùy chọn) Thêm bộ lọc file
        fileFilter: (req, file, callback) => {
          const allowedMimes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'image/jpeg',
            'image/png',
            'application/zip',
            'application/x-zip-compressed',
          ];
          if (allowedMimes.includes(file.mimetype)) {
            callback(null, true); // Chấp nhận file
          } else {
            callback(new Error('Invalid file type.'), false); // Từ chối file
          }
        },
      }),
    }),
    // --- KẾT THÚC SỬA LỖI ---
    
    UsersModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}