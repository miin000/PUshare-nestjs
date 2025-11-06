// src/documents/dto/upload-document.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  faculty?: string;
}