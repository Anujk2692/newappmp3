import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {write as writeExif} from '@lodev09/react-native-exify';
import type {GeoLocation} from './location';

function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

export async function writePhotoGeotag(
  path: string,
  location: GeoLocation,
): Promise<void> {
  try {
    await writeExif(toFileUri(path), {
      GPSLatitude: Math.abs(location.latitude),
      GPSLongitude: Math.abs(location.longitude),
      GPSLatitudeRef: location.latitude >= 0 ? 'N' : 'S',
      GPSLongitudeRef: location.longitude >= 0 ? 'E' : 'W',
      ...(location.altitude != null ? {GPSAltitude: location.altitude} : {}),
    });
  } catch {
    // EXIF tagging is best-effort; backend still stores coordinates.
  }
}

export async function savePhotoToGallery(
  path: string,
  location?: GeoLocation,
): Promise<string> {
  if (location) {
    await writePhotoGeotag(path, location);
  }
  const uri = toFileUri(path);
  const result = await CameraRoll.saveAsset(uri, {type: 'photo'});
  return result.node.image.uri;
}

export async function saveVideoToGallery(path: string): Promise<string> {
  const uri = toFileUri(path);
  const result = await CameraRoll.saveAsset(uri, {type: 'video'});
  return result.node.image.uri;
}

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
