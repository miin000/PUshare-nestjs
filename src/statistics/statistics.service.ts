// src/statistics/statistics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from 'src/documents/schemas/document.schema';
import { User } from 'src/users/schemas/user.schema';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getPlatformStats() {
    const totalUploads = await this.documentModel.countDocuments();
    const activeUsers = await this.userModel.countDocuments({ status: 'ACTIVE' });

    // Tính tổng downloads bằng Aggregation
    const downloadAgg = await this.documentModel.aggregate([
      { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
    ]);
    const totalDownloads = downloadAgg[0]?.totalDownloads || 0;

    const avgDlPerDoc = totalUploads > 0 ? (totalDownloads / totalUploads) : 0;

    return {
      totalUploads,
      totalDownloads,
      activeUsers,
      avgDlPerDoc: parseFloat(avgDlPerDoc.toFixed(2)),
    };
  }

  async getUploadsOverTime() {
    // (Logic phức tạp hơn, ví dụ: group theo ngày)
    // Tạm thời trả về dữ liệu giả
    return [
      { date: '2025-10-01', count: 45 },
      { date: '2025-10-08', count: 52 },
      { date: '2025-10-15', count: 68 },
      { date: '2025-10-22', count: 71 },
      { date: '2025-10-29', count: 85 },
    ];
  }
}