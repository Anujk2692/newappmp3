import {Platform} from 'react-native';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

/**
 * Ensure photos from iPhone (HEIC / ph://) are readable by the backend as JPEG.
 * Pass iosAssetId from CameraRoll node.id when scanning the library.
 */
export async function normalizeFaceImage(
  uri: string,
  iosAssetId?: string,
): Promise<string> {
  if (Platform.OS !== 'ios') {
    return uri;
  }

  if (uri.startsWith('file://')) {
    return uri;
  }

  const assetId = iosAssetId || extractIosAssetId(uri);
  if (!assetId) {
    return uri;
  }

  try {
    const photo = await CameraRoll.iosGetImageDataById(assetId, {
      convertHeicImages: true,
    });
    return photo.node.image.filepath || uri;
  } catch {
    return uri;
  }
}

function extractIosAssetId(uri: string): string | undefined {
  if (!uri.startsWith('ph://')) {
    return undefined;
  }
  return uri.replace('ph://', '').split('/')[0];
}
