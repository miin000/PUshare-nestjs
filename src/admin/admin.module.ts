// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from 'src/users/users.module';
import { DocumentsModule } from 'src/documents/documents.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { Document, DocumentSchema } from 'src/documents/schemas/document.schema';
import { Subject, SubjectSchema } from 'src/subjects/schemas/subject.schema';
import { Major, MajorSchema } from 'src/majors/schemas/major.schema';

@Module({
  imports: [
    UsersModule,
    DocumentsModule,
    // Import trực tiếp schema để AdminService có thể inject Model
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Major.name, schema: MajorSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}