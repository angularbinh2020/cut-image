import { ServicesModule } from './services/services.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CutImageModule } from './modules/cut-image/cut-image.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [CutImageModule, ServicesModule, ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
