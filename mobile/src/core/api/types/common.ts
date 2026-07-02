/** Shared API envelope — all backend responses use this shape. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

import type {MediaDiagnostics} from '../../../features/media/domain/types';

export interface HealthResponse {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  app: string;
  mongodb?: 'UP' | 'DOWN';
  mediaStatus?: 'UP' | 'DEGRADED' | 'DOWN';
  media?: MediaDiagnostics;
}
