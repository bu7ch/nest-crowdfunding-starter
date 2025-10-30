// src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Swagger
  const config = new DocumentBuilder()
    .setTitle('Crowdfunding API')
    .setDescription('Simple crowdfunding endpoints')
    .setVersion('1.0')
    .addBearerAuth() // si tu utilises JWT plus tard
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 2. CORS (facultatif mais pratique pour front)
  app.enableCors();

  // 3. Démarrage
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log('Swagger UI:        http://localhost:3000/api');
}
bootstrap();