/*
  src/categories/categories.module.ts
  Module CÔNG KHAI, cung cấp API 'GET' cho frontend 
  (để lấy danh sách môn học/ngành học cho form)
*/
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subject, SubjectSchema } from 'src/subjects/schemas/subject.schema';
import { Major, MajorSchema } from 'src/majors/schemas/major.schema';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subject.name, schema: SubjectSchema },
      { name: Major.name, schema: MajorSchema },
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
// Đừng quên import CategoriesModule vào app.module.ts