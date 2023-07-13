import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class DTORoom {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly id: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly panorama_360_url: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly upload_image_api_url: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly panorama_url_preview: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly file_path: string;
}
