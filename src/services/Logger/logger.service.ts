import { Injectable, Logger } from '@nestjs/common';
import { IErrorLog } from 'src/models/IErrorLog';

@Injectable()
export class LoggerService {
  logger: Logger = new Logger(LoggerService.name);

  static createLogger(loggerName?: string) {
    const logger = new LoggerService();
    if (loggerName) {
      logger.logger = new Logger(loggerName);
    }
    return logger;
  }
  log(message: any) {
    this.logger.log(message);
  }

  error(message: any) {
    let errorMsg = message;
    if (message instanceof IErrorLog) {
      errorMsg = message.Summary;
    }
    this.logger.error(errorMsg);
  }
}
