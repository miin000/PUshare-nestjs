// src/categories/categories.controller.ts

import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // GET /api/categories/subjects
  @Get('subjects')
  getAllSubjects() {
    return this.categoriesService.getAllSubjects();
  }

  // GET /api/categories/majors
  @Get('majors')
  getAllMajors() {
    return this.categoriesService.getAllMajors();
  }

  // GET /api/categories/majors/:id
  @Get('majors/:id')
  getMajorById(@Param('id') id: string) {
    return this.categoriesService.getMajorById(id);
  }
}