import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from 'src/documents/schemas/document.schema';
import { User } from 'src/users/schemas/user.schema';
import { PlatformStats, GLOBAL_STATS_ID } from './schemas/platform-stats.schema'; // <-- Import

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(PlatformStats.name) private platformStatsModel: Model<PlatformStats>, // <-- Inject
  ) {}

  // ID của document thống kê duy nhất
  private statsId = GLOBAL_STATS_ID;

  /**
   * API CHÍNH: Lấy thống kê (cực nhanh)
   */
  async getPlatformStats() {
    // Luôn tìm/tạo document stats với ID cố định
    const stats = await this.platformStatsModel.findById(this.statsId);
    if (!stats) {
      // Nếu chưa có, tạo mới
      const newStats = await this.platformStatsModel.create({ _id: this.statsId });
      return this.formatStats(newStats);
    }
    
    return this.formatStats(stats);
  }
  
  // Helper để tính toán Avg và trả về
  private formatStats(stats: PlatformStats) {
    const { totalUploads, totalDownloads, activeUsers } = stats;
    const avgDlPerDoc = totalUploads > 0 ? (totalDownloads / totalUploads) : 0;

    return {
      totalUploads,
      totalDownloads,
      activeUsers,
      avgDlPerDoc: parseFloat(avgDlPerDoc.toFixed(2)),
    };
  }
  
  /**
   * API phụ (lấy biểu đồ, không cần sửa)
   */
  async getUploadsOverTime(days: number = 30) {
    // Tính toán ngày bắt đầu
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0); // Đặt về đầu ngày

    const results = await this.documentModel.aggregate([
      {
        // 1. Lọc các tài liệu trong khoảng 'days' ngày qua
        $match: {
          uploadDate: { $gte: startDate },
        },
      },
      {
        // 2. Nhóm các tài liệu theo ngày (định dạng YYYY-MM-DD)
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$uploadDate' },
          },
          count: { $sum: 1 }, // Đếm số lượng
        },
      },
      {
        // 3. Sắp xếp theo ngày tăng dần
        $sort: { _id: 1 },
      },
      {
        // 4. Định dạng lại output
        $project: {
          _id: 0,
          date: '$_id',
          count: '$count',
        },
      },
    ]);
    
    return results;
  }

  /**
   * CÁC HÀM CẬP NHẬT (dùng $inc để đảm bảo an toàn)
   * upsert: true = Tự động tạo doc stats nếu nó chưa tồn tại.
   */
  async incrementTotalUploads(amount: number = 1) {
    await this.platformStatsModel.updateOne(
      { _id: this.statsId },
      { $inc: { totalUploads: amount } },
      { upsert: true },
    );
  }

  async incrementTotalDownloads(amount: number = 1) {
    await this.platformStatsModel.updateOne(
      { _id: this.statsId },
      { $inc: { totalDownloads: amount } },
      { upsert: true },
    );
  }

  async incrementActiveUsers(amount: number = 1) {
    await this.platformStatsModel.updateOne(
      { _id: this.statsId },
      { $inc: { activeUsers: amount } },
      { upsert: true },
    );
  }
}