// src/logs/logs.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log } from './schemas/log.schema';

@Injectable()
export class LogsService {
  constructor(@InjectModel(Log.name) private logModel: Model<Log>) {}

  // Phương thức chung để tạo log
  async createLog(actorId: string, action: string, targetId?: string) {
    try {
      const newLog = new this.logModel({
        actor: actorId,
        action,
        targetId: targetId || null,
      });
      await newLog.save();
    } catch (error) {
      // Không nên để lỗi logging làm hỏng request chính
      console.error('Failed to create log:', error);
    }
  }

  // R3.5.1: Lấy danh sách logs
  async getLogs(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.logModel
        .find()
        .populate('actor', 'email fullName')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      this.logModel.countDocuments(),
    ]);

    return { 
      data: logs,
      pagination: { total, page, limit, totalPages: Math.ceil(total/limit) }
    };
  }
}