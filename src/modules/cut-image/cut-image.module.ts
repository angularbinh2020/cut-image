import { ServicesModule } from './../../services/services.module';
import { Module } from '@nestjs/common';
import { CutImageController } from './cut-image.controller';

@Module({
  imports: [ServicesModule],
  controllers: [CutImageController],
  providers: [],
})
export class CutImageModule {}
