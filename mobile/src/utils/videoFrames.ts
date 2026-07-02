import {Platform} from 'react-native';
import {createThumbnail} from 'react-native-create-thumbnail';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

export interface VideoFrame {
  uri: string;
  timestampMs: number;
}

/** Resolve ph:// or content URIs to a path createThumbnail can read. */
async function resolveVideoUri(uri: string, assetId?: string): Promise<string> {
  if (uri.startsWith('file://') || uri.startsWith('/')) {
    return uri.startsWith('file://') ? uri : `file://${uri}`;
  }

  if (Platform.OS === 'ios' && assetId) {
    try {
      const data = await CameraRoll.iosGetImageDataById(assetId);
      const path = data.node.image.filepath;
      if (path) {
        return path.startsWith('file://') ? path : `file://${path}`;
      }
    } catch {
      // fall through
    }
  }

  return uri;
}

/**
 * Sample frames from a video for face scanning.
 * Short clips: start + middle. Longer: 4 evenly spaced points.
 */
export async function extractVideoFrames(
  uri: string,
  durationSec: number,
  assetId?: string,
): Promise<VideoFrame[]> {
  const videoUri = await resolveVideoUri(uri, assetId);
  const durationMs = Math.max(1000, Math.round(durationSec * 1000));
  const timestamps =
    durationMs <= 12000
      ? [0, Math.floor(durationMs * 0.5)]
      : [
          0,
          Math.floor(durationMs * 0.25),
          Math.floor(durationMs * 0.5),
          Math.floor(durationMs * 0.75),
        ];

  const frames: VideoFrame[] = [];
  for (const ts of timestamps) {
    try {
      const thumb = await createThumbnail({
        url: videoUri,
        timeStamp: ts,
        format: 'jpeg',
        maxWidth: 1280,
        maxHeight: 1280,
      });
      const path = thumb.path.startsWith('file://') ? thumb.path : `file://${thumb.path}`;
      frames.push({uri: path, timestampMs: ts});
    } catch {
      // skip unreadable frame
    }
  }

  if (frames.length === 0 && uri) {
    frames.push({uri, timestampMs: 0});
  }

  return frames;
}

export function formatVideoTimestamp(ms?: number): string {
  if (ms == null || ms <= 0) {
    return '';
  }
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
