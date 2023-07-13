export class IErrorLog {
  Summary: string;
  Description?: string;
  Priority = 1;
  BusinessService = 'Panaroma to cube images - panaroma_service';
  constructor({ Summary }) {
    this.Summary = Summary;
  }
}
