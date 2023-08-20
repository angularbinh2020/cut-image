import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class DTORoom {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly imageResultHeight: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly titleHeight: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly previewImageHeight: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly imageUrlRaw: string;
}
