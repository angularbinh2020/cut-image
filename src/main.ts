import { LoggerService } from './services/Logger/logger.service';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = LoggerService.createLogger();
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT;
  app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
    .setTitle('Cut image')
    .setDescription('Api xử lý ảnh')
    .setVersion('1.0')
    .addTag('cut-image')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(port);
  logger.log(`Listening at: http://localhost:${port}`);
}
bootstrap();
