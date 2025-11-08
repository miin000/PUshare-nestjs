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
  // documents.service.ts

  async create(uploadDocumentDto: UploadDocumentDto, file: Express.Multer.File, uploaderId: string): Promise<Document> {
    const baseUrl = this.configService.get<string>('API_URL');
    const relativePath = file.path;
    const fullFileUrl = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;

    const documentData = new this.documentModel({
      ...uploadDocumentDto,
      fileUrl: fullFileUrl,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      uploader: uploaderId,
      tags: uploadDocumentDto.tags || [],
    });

    const savedDocument = await documentData.save();

    // 🧾 Thêm log kiểm tra subject sau khi save
    console.log('📄 [BEFORE POPULATE] savedDocument.subject =', savedDocument.subject);

    await savedDocument.populate([
      { path: 'subject', select: 'name code' },
      { path: 'uploader', select: 'fullName avatarUrl' },
    ]);

    // 🧾 Log sau khi populate
    console.log('✅ [AFTER POPULATE] savedDocument.subject =', savedDocument.subject);

    await this.usersService.incrementUploadCount(uploaderId, 1);
    // Cập nhật bộ đếm toàn trang
    await this.statisticsService.incrementTotalUploads(1);

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
async findAll(queryDto: GetDocumentsQueryDto) {
  console.log('📦 [findAll] incoming queryDto =', queryDto);

  const {
    page = 1,
    limit = 10,
    search,
    subject,
    subjects,
    documentType,
    sortBy = 'uploadDate',
    sortOrder = 'desc',
  } = queryDto;

  const query: FilterQuery<Document> = { status: 'VISIBLE' };

  // Search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // ✅ FIX: Ưu tiên subjects[] nếu có, fallback về subject
  if (subjects && subjects.length > 0) {
    query.subject = { $in: subjects };
    console.log('✅ [findAll] Filtering by subjects:', subjects);
  } else if (subject) {
    query.subject = subject;
    console.log('✅ [findAll] Filtering by single subject:', subject);
  }

  if (documentType) {
    query.documentType = documentType;
  }

  console.log('🧭 [findAll] built query =', JSON.stringify(query));

  // Sort
  const sortOptions = {};
  const sortField = sortBy === 'downloads' ? 'downloadCount' : sortBy;
  const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
  sortOptions[sortField] = sortOrderValue;

  // Pagination
  const skip = (page - 1) * limit;

  const [documents, totalDocuments] = await Promise.all([
    this.documentModel
      .find(query)
      .populate('uploader', 'fullName')
      .populate('subject', 'name code')
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

  // R1.2.2: Xem chi tiết tài liệu
  async findOne(docId: string): Promise<Document> {
    const doc = await this.documentModel
      .findById(docId)
      .populate('uploader', 'fullName avatarUrl') // Lấy nhiều thông tin hơn
      .populate('subject', 'name code managingFaculty');

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    // Tăng lượt xem (không cần đợi)
    doc.viewCount += 1;
    doc.save();

    return doc;
  }

  private async getDocumentAndCheckOwnership(docId: string, userId: any): Promise<Document> {
    const doc = await this.documentModel.findById(docId);

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (!doc.uploader.equals(userId)) {
      // (Code cũ: doc.uploader.toString() !== userId)
      throw new ForbiddenException('You do not have permission to modify this document');
    }
    // --- KẾT THÚC SỬA LỖI ---

    return doc;
  }

  // R1.1.4: Chỉnh sửa tài liệu
  async update(
    docId: string,
    updateDocumentDto: UpdateDocumentDto,
    userId: string,
  ): Promise<Document> {
    await this.getDocumentAndCheckOwnership(docId, userId);

    const updatedDoc = await this.documentModel
      .findByIdAndUpdate(docId, updateDocumentDto, { new: true })
      .populate('subject', 'name code') // ✅ Thêm dòng này
      .populate('uploader', 'fullName avatarUrl'); // ✅ Cho đồng nhất với các API khác

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
    // Ví dụ: fs.unlinkSync(doc.filePath);

    await doc.deleteOne();

    // Cập nhật lại bộ đếm upload của User
    await this.usersService.incrementUploadCount(userId.toString(), -1); // Chuyển sang string ở đây
    await this.statisticsService.incrementTotalUploads(-1);

    return { message: 'Document deleted successfully' };
  }

  // R1.2.3: Lấy tài liệu của một user cụ thể
  async findUserDocuments(userId: string, queryDto: GetDocumentsQueryDto) {
    const { page = 1, limit = 10, search, sortBy = 'uploadDate', sortOrder = 'desc' } = queryDto;
    const query: FilterQuery<Document> = { uploader: userId as any };
    if (search) query.title = { $regex: search, $options: 'i' };
    const sortOptions = {};
    const sortField = sortBy === 'downloads' ? 'downloadCount' : sortBy;
    const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
    sortOptions[sortField] = sortOrderValue;
    const skip = (page - 1) * limit;
    const [documents, totalDocuments] = await Promise.all([
      this.documentModel
        .find(query)
        // --- SỬA LỖI Ở ĐÂY ---
        .populate('subject', 'name code') // <-- THÊM DÒNG NÀY
        // --- KẾT THÚC ---
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