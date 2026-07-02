export type FeatureFlagKey =
  | 'mediaSearch'
  | 'mediaDownload'
  | 'mediaOfflineCache'
  | 'faceAi'
  | 'faceLibraryScan'
  | 'cameraCapture'
  | 'cameraGeotag'
  | 'deviceStorage';

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  mediaSearch: true,
  mediaDownload: true,
  mediaOfflineCache: true,
  faceAi: true,
  faceLibraryScan: true,
  cameraCapture: true,
  cameraGeotag: true,
  deviceStorage: true,
};
