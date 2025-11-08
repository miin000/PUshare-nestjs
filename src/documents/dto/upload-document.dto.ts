// src/documents/dto/upload-document.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId() // Đảm bảo đây là một ID của MongoDB
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  schoolYear?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  faculty?: string;
}