import { TimeService } from './Time/time.service';
import { AxiosService } from './Axios/axios.service';
import { LoggerService } from './Logger/logger.service';
import { Module } from '@nestjs/common';

const globalServices = [LoggerService, AxiosService, TimeService];
@Module({
  imports: [],
  controllers: [],
  providers: globalServices,
  exports: globalServices,
})
export class ServicesModule {}
