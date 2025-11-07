// src/documents/documents.service.ts
import { ForbiddenException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Document } from './schemas/document.schema';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/schemas/user.schema';
import { createReadStream } from 'fs';
import { join } from 'path';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { StatisticsService } from 'src/statistics/statistics.service';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
    private usersService: UsersService, // Inject UsersService
    private statisticsService: StatisticsService,
    private configService: ConfigService,
  ) { }

  // R1.1.1: Tạo bản ghi tài liệu sau khi upload
  async create(
    uploadDocumentDto: UploadDocumentDto,
    file: Express.Multer.File,
    uploaderId: string,
  ): Promise<Document> {

    const baseUrl = this.configService.get<string>('API_URL');
    // file.path là 'uploads/filename.pdf'
    const relativePath = file.path; 
    const fullFileUrl = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;

    const documentData = new this.documentModel({
      ...uploadDocumentDto,
      fileUrl: fullFileUrl, // <-- LƯU URL ĐẦY ĐỦ
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      uploader: uploaderId,
      tags: uploadDocumentDto.tags || [],
    });

    const savedDocument = await documentData.save();
    await this.usersService.incrementUploadCount(uploaderId);

    // CẬP NHẬT MỚI: Tăng totalUploads
    await this.statisticsService.incrementTotalUploads(1);

    // Cập nhật R1.6.2: Tăng số lượng upload của User
    await this.usersService.incrementUploadCount(uploaderId);

    return savedDocument;
  }

  // R1.1.2 & R1.1.3: Download tài liệu
  async download(
    docId: string,
    // userId: string, // Bạn có thể dùng userId để kiểm tra quyền download nếu cần
  ): Promise<{ streamableFile: StreamableFile; doc: Document }> {

    const doc = await this.documentModel.findById(docId);
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const localFilePath = join(process.cwd(), doc.filePath);
    try {
      const file = createReadStream(localFilePath);
      
      // Tăng bộ đếm
      doc.downloadCount += 1;
      await doc.save();
      await this.usersService.incrementTotalDownloads(doc.uploader.toString(), 1);
      await this.statisticsService.incrementTotalDownloads(1);
      
      return {
        streamableFile: new StreamableFile(file),
        doc: doc,
      };

    } catch (error) {
      console.error(error);
      throw new NotFoundException('File not found on server storage.');
    }
  }

  // R1.2.1, R1.3.1, R1.3.2, R1.3.3: Lấy danh sách tài liệu
  async findAll(query: GetDocumentsQueryDto) {
    const {
      search,
      faculty,
      subject,
      documentType,
      sortBy = 'uploadDate',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (faculty) filter.faculty = faculty;
    if (subject) filter.subject = subject;
    if (documentType) filter.type = documentType;

    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const documents = await this.documentModel
      .find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .populate('uploader', 'fullName email')
      .exec();

    const total = await this.documentModel.countDocuments(filter).exec();

    return {
      data: documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // R1.2.2: Xem chi tiết tài liệu
  async findOne(docId: string): Promise<Document> {
    const doc = await this.documentModel
      .findById(docId)
      .populate('uploader', 'fullName avatarUrl'); // Lấy nhiều thông tin hơn

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    // Tăng lượt xem (không cần đợi)
    doc.viewCount += 1;
    doc.save();

    return doc;
  }

  private async getDocumentAndCheckOwnership(docId: string, userId: string): Promise<Document> {
    const doc = await this.documentModel.findById(docId);

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    // So sánh ID người upload (từ CSDL) với ID user (từ token)
    if (doc.uploader.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to modify this document');
    }

    return doc;
  }

  // R1.1.4: Chỉnh sửa tài liệu
  async update(
    docId: string,
    updateDocumentDto: UpdateDocumentDto,
    userId: string,
  ): Promise<Document> {
    await this.getDocumentAndCheckOwnership(docId, userId);

    const updatedDoc = await this.documentModel.findByIdAndUpdate(
      docId,
      updateDocumentDto,
      { new: true },
    );

    if (!updatedDoc) {
      throw new NotFoundException('Document not found');
    }

    return updatedDoc;
  }

  // R1.1.5: Xóa tài liệu
  async remove(docId: string, userId: string): Promise<{ message: string }> {

    // Kiểm tra tài liệu có tồn tại VÀ user có quyền sở hữu không
    const doc = await this.getDocumentAndCheckOwnership(docId, userId);

    // TODO: Xóa file vật lý khỏi thư mục /uploads
    // (Chúng ta sẽ làm điều này sau, bây giờ chỉ xóa CSDL)
    // Ví dụ: fs.unlinkSync(doc.fileUrl);

    await doc.deleteOne();
    await this.usersService.incrementUploadCount(userId, -1);

    // CẬP NHẬT MỚI: Giảm totalUploads
    await this.statisticsService.incrementTotalUploads(-1);

    // Cập nhật lại bộ đếm upload của User
    await this.usersService.incrementUploadCount(userId, -1); // Giảm đi 1

    return { message: 'Document deleted successfully' };
  }

  // R1.2.3: Lấy tài liệu của một user cụ thể
  async findUserDocuments(userId: string, queryDto: GetDocumentsQueryDto) {
    // Gán giá trị mặc định để tránh undefined
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'uploadDate',
    } = queryDto;

    // Bắt đầu với query chỉ lọc theo uploader
    const query: FilterQuery<Document> = {
      uploader: userId as any,
    };

    // Thêm các bộ lọc khác
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Không lọc theo status, user nên thấy cả tài liệu bị block của mình

    // Khai báo rõ ràng kiểu cho sortOptions
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = -1;

    // Bảo đảm page và limit là số chắc chắn
    const skip = (page - 1) * limit;

    const [documents, totalDocuments] = await Promise.all([
      this.documentModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.documentModel.countDocuments(query),
    ]);

    return {
      data: documents,
      pagination: {
        total: totalDocuments,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
      },
    };
  }

}