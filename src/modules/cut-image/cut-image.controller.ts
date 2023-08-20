import { Controller, Post, Body } from '@nestjs/common';
import { DTORoom } from 'src/dto/room.dto';
import { CutImageService } from 'src/services/CutImageService/cut-image.service';

@Controller('cut-image')
export class CutImageController {
  @Post()
  async cutImage(@Body() room: DTORoom): Promise<string> {
    const cutImageService = new CutImageService(room);
    return await cutImageService.cutImage();
  }
}
