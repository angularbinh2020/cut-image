import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { DD_MM_YY_HH_MM_SS } from 'src/const/date-time-format';

@Injectable()
export class TimeService {
  getCurrentTime(format: string = DD_MM_YY_HH_MM_SS) {
    return dayjs().format(format);
  }
}
