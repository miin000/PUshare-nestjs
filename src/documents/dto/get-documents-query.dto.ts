import { IsOptional, IsString, IsIn, IsInt, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class GetDocumentsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  faculty?: string;

  @IsOptional()
  @IsIn(['uploadDate', 'downloads'])
  sortBy?: string = 'uploadDate';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'desc';

  @IsOptional()
  @IsString()
  subject?: string; // Trường cũ giữ nguyên

  // ✅ subjects sẽ được xử lý ở Controller level
  // Không cần Transform phức tạp
  @IsOptional()
  @IsArray()
  subjects?: string[];

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}