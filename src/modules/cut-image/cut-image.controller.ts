import { Controller, Post, Body } from '@nestjs/common';
import { DTORoom } from 'src/dto/room.dto';
import { CutImageService } from 'src/services/CutImageService/cut-image.service';

@Controller('cut-image')
export class CutImageController {
  @Post()
  async cutImage(@Body() room: DTORoom): Promise<string> {
    const cutImageService = new CutImageService(
      room.panorama_360_url,
      room.id,
      room.upload_image_api_url,
      room.panorama_url_preview,
      room.file_path,
    );
    return await cutImageService.cutImage();
  }
}
