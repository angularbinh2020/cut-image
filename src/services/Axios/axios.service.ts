import { Injectable } from '@nestjs/common';
import { LoggerService } from '../Logger/logger.service';
import Axios, { AxiosInstance } from 'axios';
@Injectable()
export class AxiosService {
  axios: AxiosInstance;
  constructor(private readonly loggerService: LoggerService) {
    this.axios = Axios.create();
    this.axios.interceptors.request.use(
      (config) => {
        this.loggerService.log(
          `[${config.method.toUpperCase()}] ${config.url}`,
        );
        return config;
      },
      function (error) {
        return Promise.reject(error);
      },
    );
  }

  get get() {
    return this.axios.get;
  }

  get post() {
    return this.axios.post;
  }

  get patch() {
    return this.axios.patch;
  }
}
