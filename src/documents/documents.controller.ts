// src/documents/documents.controller.ts
import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, 
    Body, Request, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, 
    Param,
    Res,
    Get,
    Query,
    Delete,
    Patch} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadDocumentDto } from './dto/upload-document.dto';
import express from 'express';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@UseGuards(AuthGuard('jwt')) // Yêu cầu đăng nhập
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // R1.1.1: Upload tài liệu
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'file' là tên trường (field name) trong form-data
  uploadDocument(
    @Request() req,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile(
      // Thêm Pipe để validate file
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          // new FileTypeValidator({ fileType: 'application/pdf' }), // Ví dụ: chỉ cho phép PDF
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    // req.user.userId lấy từ AuthGuard
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

    // Lấy tên file gốc để trình duyệt hiển thị
    const originalFilename = doc.fileUrl.split('/').pop();

    // Set headers
    res.set({
      'Content-Type': doc.fileType,
      'Content-Disposition': `attachment; filename="${originalFilename}"`,
    });

    return streamableFile;
  }

  @Get()
  findAll(@Query() queryDto: GetDocumentsQueryDto) {
    return this.documentsService.findAll(queryDto);
  }

  // R1.2.2: Xem chi tiết tài liệu
  @Get(':id')
  findOne(@Param('id') docId: string) {
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

  // R1.2.3: Xem danh sách tài liệu từ User đó
  @Get('my-uploads')
  getMyUploads(
    @Request() req,
    @Query() queryDto: GetDocumentsQueryDto
  ) {
    const userId = req.user.userId;
    return this.documentsService.findUserDocuments(userId, queryDto);
  }
}