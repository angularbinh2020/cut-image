import { LoggerService } from 'src/services/Logger/logger.service';
import { AxiosService } from 'src/services/Axios/axios.service';
import imageSizeOf from 'image-size';
import { convertImage } from 'src/libs/panorama-to-cubemap';
import { ICubeImage } from 'src/models/ICubeImage';
import { getPreviewImageWidth, getFaceNameByFileName } from 'src/utils';
import * as sharp from 'sharp';
import * as FormData from 'form-data';
import { IErrorLog } from 'src/models/IErrorLog';
import { writeFile } from 'fs';
const TILE_SIZE = 512;
export class CutImageService {
  logger: LoggerService;
  axios: AxiosService;
  imageUrlRaw: string;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  facesImage: ICubeImage[];
  roomId: string | number;
  titleSize: number;
  faceSize: number;
  previewImageBuffer: Buffer;
  previewImageUrl: string;
  titleImageUrls: string[] = [];
  titleImagesCount: number;
  apiUrl: string;
  panoramaPreviewImgUrlRaw: string;
  panoramaPreviewImgUrl: string;
  folderFilePath: string;
  constructor(
    imageUrlRaw: string,
    roomId: string | number,
    apiUrl: string,
    panoramaPreviewImgUrlRaw?: string,
    folderFilePath?: string,
  ) {
    this.roomId = roomId;
    this.imageUrlRaw = imageUrlRaw;
    this.imageUrl = encodeURI(imageUrlRaw);
    this.logger = LoggerService.createLogger(`Room-${roomId}`);
    this.axios = new AxiosService(this.logger);
    this.apiUrl = apiUrl;
    this.panoramaPreviewImgUrlRaw = panoramaPreviewImgUrlRaw;
    this.folderFilePath = folderFilePath;
  }
  options = {
    rotation: 360,
    interpolation: 'lanczos',
    outformat: 'jpg',
    outtype: 'buffer',
    // width: Infinity,
    width: 1024,
  };

  cutImage(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const imageUrl = this.imageUrl;
      this.logger.log(`Start convert image: ${this.imageUrlRaw}`);
      try {
        const startTime = new Date();
        await this.createAndUpload360PreviewImage();
        const response = await this.axios.get(imageUrl, {
          responseType: 'arraybuffer',
        });
        this.logger.log(`Download completed`);
        const fileData: Buffer = response.data;
        const dimension = imageSizeOf(fileData);
        this.originalWidth = dimension.width;
        this.originalHeight = dimension.height;
        this.isImageRatioCorrect();
        this.createFaceSizeTitleSize();
        this.facesImage = await convertImage(fileData, this.options);
        this.logger.log(`Convert panaroma to cube image completed`);
        await this.createPreviewImage();
        await this.uploadPreviewImage();
        await this.createTitleImages();
        const jsonResult = this.getImageJson();
        const currentTime = new Date();
        this.logger.log(
          `Convert image completed in ${
            (currentTime.getTime() - startTime.getTime()) / 1000
          }s`,
        );
        resolve(jsonResult);
      } catch (e) {
        this.logger.error(`Convert image error: ${imageUrl}`);
        this.logger.error(e);
        this.sendEmailInformError(e);
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

  createPreviewImage() {
    return new Promise((resolve, reject) => {
      // const previewImageWidth = getPreviewImageWidth(this.titleSize);
      const imageOrder = 'bdflru';
      const listImageResized = [];
      const onResized = (imageResizedBufferType, rawImage) => {
        const faceImageName = getFaceNameByFileName(rawImage.filename);
        listImageResized.push({
          filename: faceImageName,
          buffer: imageResizedBufferType,
        });
        const isAllFacesResized = listImageResized.length === 6;
        if (isAllFacesResized) {
          const orderedImages = [];
          imageOrder.split('').map((charValue) => {
            const imageMatch = listImageResized.find(
              (x) => x.filename === charValue,
            );
            orderedImages.push(imageMatch);

            listImageResized.forEach((img) => {
              writeFile(`/preview/${img.filename}.webp`, img.buffer, () => {
                console.log('saved: ', `${img.filename}.webp`);
              });
            });
          });
          // const composeImages = orderedImages.map((file, fileIndex) => {
          //   return {
          //     input: file.buffer,
          //     top: fileIndex * previewImageWidth,
          //     left: 0,
          //   };
          // });
          resolve(null);

          // const createConfig = {
          //   create: {
          //     width: previewImageWidth,
          //     height: previewImageWidth * 6,
          //     channels: 4,
          //     background: { r: 255, g: 0, b: 0, alpha: 0.5 },
          //   },
          // };

          //   sharp(createConfig)
          //     .composite(composeImages)
          //     .webp()
          //     .toBuffer()
          //     .then((bufferImage: Buffer) => {
          //       this.logger.log('Created image preview completed');
          //       this.previewImageBuffer = bufferImage;
          //       resolve(null);
          //     });
        }
      };

      this.facesImage.map((faceImage) => {
        sharp(faceImage.buffer)
          .resize({
            width: TILE_SIZE,
            height: TILE_SIZE,
          })
          .toBuffer()
          .then((resultBuffer) => {
            onResized(resultBuffer, faceImage);
          })
          .catch(reject);
      });
    });
  }

  createAndUpload360PreviewImage() {
    return new Promise(async (resolve, reject) => {
      try {
        this.logger.log(`Create 360 preview`);
        // const response = await this.axios.get(this.panoramaPreviewImgUrlRaw, {
        //   responseType: 'arraybuffer',
        // });
        // const fileData: Buffer = response.data;
        // const previewBuffer = await sharp(fileData)
        //   .resize({ width: 800, height: 418 })
        //   .webp()
        //   .toBuffer();
        // const fileName = `panorama_${this.roomId}_preview.webp`;
        this.logger.log(`Upload 360 preview`);
        // this.panoramaPreviewImgUrl = await this.uploadFile(
        //   previewBuffer,
        //   fileName,
        // );
        this.logger.log(`Upload 360 preview completed`);
        resolve(null);
      } catch (e) {
        reject(e);
      }
    });
  }

  uploadPreviewImage() {
    return new Promise(async (resolve, reject) => {
      try {
        this.previewImageUrl = await this.uploadFile(
          this.previewImageBuffer,
          `${this.roomId}_preview.webp`,
        );
        this.previewImageBuffer = null;
        this.logger.log('Upload preview Image completed.');
        resolve(null);
      } catch (e) {
        reject(e);
      }
    });
  }

  createTitleImages() {
    // const imagesOneRow = this.faceSize / this.titleSize;
    const imagesOneRow = 2;
    const titleIndexMax = imagesOneRow - 1;
    this.titleImagesCount = imagesOneRow * imagesOneRow * 6;
    return new Promise((resolve, reject) => {
      const onUploadImageCompleted = (imageUrl: string) => {
        this.titleImageUrls.push(imageUrl);
        const isUploadAllTitleImages =
          this.titleImageUrls.length === this.titleImagesCount;
        if (isUploadAllTitleImages) resolve(null);
      };
      this.facesImage.forEach((faceImage) => {
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
                top: titleYIndex * this.titleSize,
                left: titleXIndex * this.titleSize,
                height: this.titleSize,
                width: this.titleSize,
              };
              sharp(faceImage.buffer)
                .extract(cropConfig)
                .webp()
                .toBuffer()
                .then((data: Buffer) => {
                  const fileName = `${faceImageName}_${titleXIndex}_${titleYIndex}_${this.roomId}.webp`;
                  this.uploadFile(data, fileName)
                    .then((fileUrl) => {
                      onUploadImageCompleted(fileUrl);
                    })
                    .catch(reject);
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

  createFaceSizeTitleSize() {
    this.faceSize = this.originalWidth / 4;
    let titleSize = this.faceSize;
    const smallTitleSize = titleSize / 2;
    if (smallTitleSize === Math.ceil(smallTitleSize))
      titleSize = smallTitleSize;
    this.titleSize = titleSize;
    this.logger.log(
      `Create Face size ${this.faceSize}px, Title size ${this.titleSize}px completed`,
    );
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

  uploadFile(fileData: Buffer, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', fileData, fileName);
      if (this.folderFilePath)
        formData.append('file_path', this.folderFilePath);
      this.axios
        .post(this.apiUrl, formData)
        .then((res) => {
          resolve(res.data.url);
        })
        .catch(reject);
    });
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
    this.axios
      .post(process.env.API_SEND_EMAIL_INFORM_ERROR, log)
      .then(() => {
        this.logger.log('Send email inform error success.');
      })
      .catch((e) => {
        this.logger.error('Send email inform error fail');
        this.logger.error(e);
      });
  }
}
