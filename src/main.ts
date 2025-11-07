import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    // Cho phép frontend của bạn (thường là localhost:3000)
    origin: 'http://localhost:3000', 
    
    // Đây là chìa khóa: Cho phép frontend đọc header 'Content-Disposition'
    exposedHeaders: ['Content-Disposition'], 
  });

  app.useGlobalPipes(new ValidationPipe());

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
