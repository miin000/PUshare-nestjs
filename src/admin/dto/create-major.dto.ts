import { IsString, IsNotEmpty, IsArray, IsMongoId, IsOptional } from 'class-validator';

export class CreateMajorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsMongoId({ each: true }) // Đảm bảo mỗi phần tử là một MongoID
  @IsOptional()
  subjects?: string[]; // Mảng các ID của môn học
}