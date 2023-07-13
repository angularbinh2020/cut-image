import { Worker } from 'cluster';

export interface ICluster {
  isReady: boolean;
  cluster: Worker;
}
