// src/documents/documents.controller.ts
import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, 
    Body, Request, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, 
    Param,
    Res,
    Get,
    Query,
    Delete,
    Patch,
    BadRequestException} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadDocumentDto } from './dto/upload-document.dto';
import express from 'express';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Types } from 'mongoose';

@UseGuards(AuthGuard('jwt'))
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // R1.1.1: Upload tài liệu
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Request() req,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    const uploaderId = req.user.userId;
    return this.documentsService.create(uploadDocumentDto, file, uploaderId);
  }

  // R1.1.2 & R1.1.3: Download tài liệu
  @Get(':id/download')
  async downloadDocument(
    @Param('id') docId: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { streamableFile, doc } = await this.documentsService.download(docId);
    const originalFilename = doc.fileUrl.split('/').pop();

    res.set({
      'Content-Type': doc.fileType,
      'Content-Disposition': `attachment; filename="${originalFilename}"`,
    });

    return streamableFile;
  }

  // ✅ FIX: Xử lý subjects[] ở controller level
  @Get()
  findAll(@Query() query: any) {
    const dto = new GetDocumentsQueryDto();
    
    // Copy tất cả fields
    Object.assign(dto, query);
    
    // ✅ Xử lý đặc biệt cho subjects[]
    if (query['subjects[]']) {
      const raw = query['subjects[]'];
      dto.subjects = Array.isArray(raw) ? raw : [raw];
      console.log('✅ [Controller] Processed subjects[] ->', dto.subjects);
    } else if (query.subjects) {
      const raw = query.subjects;
      dto.subjects = Array.isArray(raw) ? raw : [raw];
      console.log('✅ [Controller] Processed subjects ->', dto.subjects);
    }

    return this.documentsService.findAll(dto);
  }

  // R1.2.3: Xem danh sách tài liệu từ User đó
  @Get('my-uploads')
  getMyUploads(
    @Request() req,
    @Query() queryDto: GetDocumentsQueryDto
  ) {
    const userId = req.user.userId;
    return this.documentsService.findMyDocuments(userId, queryDto);
  }

  @Get('user/:userId/uploads')
  getUserUploads(
    @Param('userId') userId: string,
    @Query() queryDto: GetDocumentsQueryDto
  ) {
    // Gọi hàm mới: findUserDocuments
    return this.documentsService.findUserDocuments(userId, queryDto);
  }

  // R1.2.2: Xem chi tiết tài liệu
  @Get(':id')
  findOne(@Param('id') docId: string) {
    if (!Types.ObjectId.isValid(docId)) {
      throw new BadRequestException('Invalid document ID format');
    }
    return this.documentsService.findOne(docId);
  }

  // R1.1.4: Chỉnh sửa tài liệu đã upload
  @Patch(':id')
  update(
    @Param('id') docId: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.documentsService.update(docId, updateDocumentDto, userId);
  }

  // R1.1.5: Xóa tài liệu đã upload
  @Delete(':id')
  remove(
    @Param('id') docId: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.documentsService.remove(docId, userId);
  }
}