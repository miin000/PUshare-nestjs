// /* eslint-disable no-console */
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { getModelToken } from '@nestjs/mongoose';
// import { User, UserRole } from './users/schemas/user.schema';
// import { Model } from 'mongoose';
// import * as bcrypt from 'bcrypt';

// /**
//  * Đây là một kịch bản (script) độc lập để tạo người dùng Admin.
//  * Nó sẽ khởi chạy một phiên bản ứng dụng NestJS tối thiểu
//  * để truy cập vào các service và model.
//  */
// async function bootstrap() {
//   console.log('Bắt đầu kịch bản seed Admin...');
  
//   // Khởi tạo ứng dụng NestJS (chỉ context, không phải web server)
//   const app = await NestFactory.createApplicationContext(AppModule);

//   // Lấy User model
//   const userModel = app.get<Model<User>>(getModelToken(User.name));

//   const adminEmail = 'admin@gmail.com';
//   const adminPassword = 'admin';
//   const adminFullName = 'Admin';
//   const adminRole = UserRole.ADMIN;

//   try {
//     // 1. Kiểm tra xem admin đã tồn tại chưa
//     const existingAdmin = await userModel.findOne({ email: adminEmail }).exec();
//     if (existingAdmin) {
//       console.log('Người dùng Admin với email này đã tồn tại.');
//       await app.close();
//       return;
//     }

//     // 2. Hash mật khẩu
//     const hashedPassword = await bcrypt.hash(adminPassword, 10);
//     console.log('Đã hash mật khẩu.');

//     // 3. Tạo bản ghi admin mới
//     const adminUser = new userModel({
//       email: adminEmail,
//       fullName: adminFullName,
//       password: hashedPassword,
//       role: adminRole,
//       status: 'ACTIVE', // Đảm bảo tài khoản được kích hoạt
//     });

//     await adminUser.save();
    
//     console.log('=======================================');
//     console.log('TẠO ADMIN THÀNH CÔNG');
//     console.log(` Email: ${adminEmail}`);
//     console.log(` Mật khẩu: ${adminPassword}`);
//     console.log('=======================================');

//   } catch (error) {
//     console.error('Lỗi khi tạo admin:', error);
//   } finally {
//     // 4. Đóng kết nối
//     await app.close();
//     console.log('Đã đóng kết nối.');
//   }
// }

// // Chạy kịch bản
// bootstrap();