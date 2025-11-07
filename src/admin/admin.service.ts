// src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Document, DocumentStatus } from 'src/documents/schemas/document.schema';
import { User, UserRole, UserStatus } from 'src/users/schemas/user.schema';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { LogsService } from 'src/logs/logs.service';
import { StatisticsService } from 'src/statistics/statistics.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Document.name) private documentModel: Model<Document>,
    private logsService: LogsService,
    private statisticsService: StatisticsService,
  ) {}

  private async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { status },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // R2.3.1: Block tài liệu
  async blockDocument(docId: string): Promise<Document> {
    return this.updateDocumentStatus(docId, DocumentStatus.BLOCKED);
  }

  // R2.3.2: Bỏ block tài liệu
  async unblockDocument(docId: string): Promise<Document> {
    return this.updateDocumentStatus(docId, DocumentStatus.VISIBLE);
  }

  private async updateDocumentStatus(docId: string, status: DocumentStatus): Promise<Document> {
    const doc = await this.documentModel.findByIdAndUpdate(
      docId,
      { status },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  // === R3: Admin ===

  // R3.2.1: Xóa tài khoản User
  async deleteUser(userId: string): Promise<{ message: string }> {
    const user = await this.userModel.findByIdAndDelete(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.statisticsService.incrementActiveUsers(-1);
    // TODO: Xóa tất cả tài liệu của user này (hoặc gán cho user "deleted")
    return { message: 'User deleted successfully' };
  }

  // R3.3.1: Xóa tài liệu
  async deleteDocument(docId: string): Promise<{ message: string }> {
    const doc = await this.documentModel.findByIdAndDelete(docId);
    if (!doc) throw new NotFoundException('Document not found');

    await this.statisticsService.incrementTotalUploads(-1);
    // TODO: Xóa file vật lý
    return { message: 'Document deleted successfully' };
  }

  // R3.4.1 & R3.4.2: Thay đổi vai trò
  async setUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // R2.2.1, R2.2.2, R2.2.3, R3.4.3
  async getUsers(queryDto: GetUsersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'joinedDate',
      role,
    } = queryDto;

    const query: FilterQuery<User> = {};

    //Tìm kiếm
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    //Lọc theo vai trò (Moderator, Admin, User,...)
    if (role) {
      query.role = role;
    }

    // Sắp xếp
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortBy === 'joinedDate' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password') // Không bao giờ trả password
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      data: users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
    };
  }

  async blockUser(userId: string, actorId: string): Promise<User> {
    await this.logsService.createLog(actorId, 'BLOCK_USER', userId);

    // CẬP NHẬT MỚI: Giảm activeUsers
    await this.statisticsService.incrementActiveUsers(-1);

    return this.updateUserStatus(userId, UserStatus.BLOCKED);
  }

    // R2.2.5: Bỏ block User
  async unblockUser(userId: string, actorId: string): Promise<User> {
    await this.logsService.createLog(actorId, 'UNBLOCK_USER', userId);

    // CẬP NHẬT MỚI: Tăng activeUsers
    await this.statisticsService.incrementActiveUsers(1);

    return this.updateUserStatus(userId, UserStatus.ACTIVE);
  }

}