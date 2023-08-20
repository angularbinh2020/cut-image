import { LoggerService } from 'src/services/Logger/logger.service';
import { AxiosService } from 'src/services/Axios/axios.service';
import imageSizeOf from 'image-size';
import { convertImage } from 'src/libs/panorama-to-cubemap';
import { ICubeImage } from 'src/models/ICubeImage';
import { getFaceNameByFileName } from 'src/utils';
import * as sharp from 'sharp';
import { IErrorLog } from 'src/models/IErrorLog';
import { writeFile, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
const TILE_SIZE = 512;
const FOLDER_PATHS = __dirname.split('\\').slice(0, -2);
const IMAGE_FOLDER = join(...FOLDER_PATHS, 'images');
if (!existsSync(IMAGE_FOLDER)) {
  mkdirSync(IMAGE_FOLDER);
}
const getPathSaved = (fileName: string) =>
  join(...FOLDER_PATHS, 'images', fileName);
interface Options {
  imageUrlRaw: string;
  titleHeight: number;
  imageResultHeight: number;
  previewImageHeight: number;
}
export class CutImageService {
  logger: LoggerService;
  axios: AxiosService;
  imageUrlRaw: string;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  facesImage: ICubeImage[];
  facesImageResized: ICubeImage[];
  facesImage1024: ICubeImage[];
  facesImage2048: ICubeImage[];
  roomId: string | number;
  titleSize: number;
  faceSize: number;
  previewImageBuffer: Buffer;
  previewImageUrl: string;
  titleImageUrls: string[] = [];
  titleImagesCount: number;
  panoramaPreviewImgUrlRaw: string;
  panoramaPreviewImgUrl: string;
  folderFilePath: string;
  fileName: string;
  imageResultHeight: number;
  titleHeight: number;
  previewImageHeight: number;
  constructor({
    imageUrlRaw,
    imageResultHeight,
    titleHeight,
    previewImageHeight,
  }: Options) {
    this.fileName = imageUrlRaw
      .split('/')
      .pop()
      .split('.')
      .slice(0, -1)
      .join('');
    this.previewImageHeight = previewImageHeight;
    this.imageResultHeight = imageResultHeight;
    this.titleHeight = titleHeight;
    this.imageUrlRaw = imageUrlRaw;
    this.imageUrl = encodeURI(imageUrlRaw);
    this.logger = LoggerService.createLogger(this.fileName);
    this.axios = new AxiosService(this.logger);
  }
  options = {
    rotation: 360,
    interpolation: 'lanczos',
    outformat: 'jpg',
    outtype: 'buffer',
    width: Infinity,
  };

  cutImage(): Promise<string> {
    console.log(__dirname);
    return new Promise(async (resolve, reject) => {
      const imageUrl = this.imageUrl;
      this.logger.log(`Start convert image: ${this.imageUrlRaw}`);
      try {
        const startTime = new Date();
        const response = await this.axios.get(imageUrl, {
          responseType: 'arraybuffer',
        });
        this.logger.log(`Download completed`);
        const fileData: Buffer = response.data;
        const dimension = imageSizeOf(fileData);
        this.originalWidth = dimension.width;
        this.originalHeight = dimension.height;
        this.isImageRatioCorrect();
        this.facesImage = await convertImage(fileData, this.options);
        const result = await this.resizeFaceImages(this.imageResultHeight);
        this.logger.log(`Convert panaroma to cube image completed`);
        await this.createPreviewImage();
        await this.createTitleImages({
          facesImages: result,
          layerIndex: 1,
          faceSize: this.imageResultHeight,
        });
        const currentTime = new Date();
        this.logger.log(
          `Convert image completed in ${
            (currentTime.getTime() - startTime.getTime()) / 1000
          }s`,
        );
        resolve('done');
      } catch (e) {
        this.logger.error(`Convert image error: ${imageUrl}`);
        this.logger.error(e);
        reject(e);
      }
    });
  }

  isImageRatioCorrect(): void {
    const rawImageRatio = this.originalWidth / this.originalHeight;
    const isNotPanoramaImage = rawImageRatio !== 2;
    if (isNotPanoramaImage) {
      throw new IErrorLog({
        Summary: `Ảnh ${this.imageUrlRaw} không thể xử lý, do kích cỡ ảnh không phù hợp. Tỉ lệ rộng / cao phải bằng 2. Nhưng tỉ lệ thực tế lại là ${rawImageRatio}.`,
      });
    }
    this.logger.log(`Image dimension correct.`);
  }
  async resizeFaceImages(faceSize: number) {
    const resizeProcess = this.facesImage.map((faceImage) =>
      sharp(faceImage.buffer)
        .resize({
          width: faceSize,
          height: faceSize,
        })
        .toBuffer(),
    );
    const resized = await Promise.all(resizeProcess);
    return resized.map((imageBuffer, index) => ({
      buffer: imageBuffer,
      filename: this.facesImage[index].filename,
    }));
  }
  async createPreviewImage() {
    const resizeImageProcess = this.facesImage.map((faceImage) => {
      return sharp(faceImage.buffer)
        .resize({
          width: this.previewImageHeight,
          height: this.previewImageHeight,
        })
        .webp()
        .toBuffer();
    });
    const buffers = await Promise.all(resizeImageProcess);
    buffers.forEach((imgBuffer, index) => {
      const faceImageName = getFaceNameByFileName(
        this.facesImage[index].filename,
      );
      const faceName = `${faceImageName}.webp`;
      const pathSaved = getPathSaved(faceName);
      writeFile(pathSaved, imgBuffer, {}, (e) => {
        if (e) {
          console.log('error: ', e);
        } else {
          console.log('saved: ', pathSaved);
        }
      });
    });
  }

  async createTitleImages({
    faceSize,
    layerIndex,
    facesImages,
  }: {
    faceSize: number;
    layerIndex: number;
    facesImages: ICubeImage[];
  }) {
    const imagesOneRow = faceSize / this.titleHeight;
    const titleIndexMax = imagesOneRow - 1;
    this.titleImagesCount = imagesOneRow * imagesOneRow * 6;
    return new Promise((resolve, reject) => {
      const onUploadImageCompleted = () => {
        this.titleImageUrls.push('');
        const isUploadAllTitleImages =
          this.titleImageUrls.length === this.titleImagesCount;
        if (isUploadAllTitleImages) resolve(null);
      };
      facesImages.forEach((faceImage) => {
        const faceImageName = getFaceNameByFileName(faceImage.filename);
        try {
          for (
            let titleXIndex = 0;
            titleXIndex <= titleIndexMax;
            titleXIndex++
          ) {
            for (
              let titleYIndex = 0;
              titleYIndex <= titleIndexMax;
              titleYIndex++
            ) {
              const cropConfig = {
                top: titleYIndex * this.titleHeight,
                left: titleXIndex * this.titleHeight,
                height: this.titleHeight,
                width: this.titleHeight,
              };
              sharp(faceImage.buffer)
                .extract(cropConfig)
                .webp()
                .toBuffer()
                .then((data: Buffer) => {
                  const fileName = `${faceImageName}_${layerIndex}_${titleXIndex}_${titleYIndex}.webp`;
                  const savedPath = getPathSaved(fileName);
                  writeFile(savedPath, data, () => {
                    onUploadImageCompleted();
                  });
                })
                .catch((e) => {
                  reject(e);
                });
            }
          }
        } catch (e) {
          this.logger.error(`Error: Can not crop face image`);
          reject(e);
        }
      });
    });
  }

  getImageJson() {
    const imageJson = {
      preview: this.previewImageUrl,
      titleImages: this.titleImageUrls,
      titleSize: this.titleSize,
      originalWidth: this.originalWidth,
      originalHeight: this.originalHeight,
      faceSize: this.faceSize,
      roomPreview: this.panoramaPreviewImgUrl,
    };

    return JSON.stringify(imageJson);
  }

  sendEmailInformError(error: IErrorLog) {
    const log = new IErrorLog({
      Summary: '',
    });
    const description = {
      roomId: this.roomId,
      imageUrl: this.imageUrlRaw,
      message: '',
    };
    if (error instanceof IErrorLog) {
      log.Summary = error.Summary;
    } else {
      log.Summary = `Ảnh ${this.imageUrlRaw} không thể xử lý, lỗi không xác định`;
      try {
        description.message = JSON.stringify(error);
      } catch (e) {
        this.logger.error('Không thể convert lỗi sang json');
        this.logger.error(e);
        description.message = 'Lỗi không xác định';
      }
    }
    log.Description = JSON.stringify(description);
  }
}
