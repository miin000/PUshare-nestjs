// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password'); // Loại bỏ password
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateUserDto, { new: true })
      .select('-password');

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  // Cập nhật R1.6.2: Cho phép tăng hoặc giảm
  async incrementUploadCount(userId: string, amount: number = 1) {
    await this.userModel.updateOne({ _id: userId }, { $inc: { uploadsCount: amount } });
  }

  // Cập nhật R1.6.1: Cho phép tăng hoặc giảm
  async incrementTotalDownloads(userId: string, amount: number = 1) {
    await this.userModel.updateOne({ _id: userId }, { $inc: { downloadsCount: amount } });
  }

  // Lấy thống kê cho trang profile (image_e95cc0.png)
  async getMyStats(userId: string) {
    const userStats = await this.userModel
      .findById(userId)
      .select('uploadsCount downloadsCount')
      .lean(); // .lean() để trả về object JS thuần

    if (!userStats) {
      throw new NotFoundException('User not found');
    }

    // Tính Avg Downloads/Doc
    const avgDownloads = userStats.uploadsCount > 0
        ? (userStats.downloadsCount / userStats.uploadsCount)
        : 0;

    return {
      totalUploads: userStats.uploadsCount,
      totalDownloads: userStats.downloadsCount,
      avgDownloadsPerDoc: parseFloat(avgDownloads.toFixed(2)),
    };
  }
}