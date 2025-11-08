// src/categories/categories.service.ts hoặc tương tự

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Major } from '../majors/schemas/major.schema';
import { Subject } from '../subjects/schemas/subject.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Major.name) private majorModel: Model<Major>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
  ) {}

  // ✅ Lấy tất cả majors với subjects đầy đủ
  async getAllMajors() {
    const majors = await this.majorModel
      .find()
      .populate('subjects', '_id name code') // ✅ ĐẢM BẢO POPULATE subjects
      .exec();

    console.log('✅ [CategoriesService] getAllMajors result:');
    majors.forEach(m => {
      console.log(`  - ${m.name}: ${m.subjects?.length || 0} subjects`, 
        m.subjects?.map((s: any) => s.name)
      );
    });

    return majors;
  }

  // ✅ Lấy major cụ thể với subjects
  async getMajorById(id: string) {
    const major = await this.majorModel
      .findById(id)
      .populate('subjects', '_id name code')
      .exec();
    
    if (major) {
      console.log(`✅ [CategoriesService] getMajorById(${id}):`, {
        name: major.name,
        subjectCount: major.subjects?.length || 0
      });
    }

    return major;
  }

  // ✅ Lấy tất cả subjects
  async getAllSubjects() {
    const subjects = await this.subjectModel.find().exec();
    console.log(`✅ [CategoriesService] getAllSubjects: ${subjects.length} subjects`);
    return subjects;
  }
}