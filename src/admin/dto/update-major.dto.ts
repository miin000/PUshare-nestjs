import { IsString, IsArray, IsMongoId, IsOptional } from 'class-validator';

export class UpdateMajorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  subjects?: string[];
}