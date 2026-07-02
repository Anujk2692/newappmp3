import {Alert} from 'react-native';
import {api, MediaSearchResult, PlayableMedia} from '../api/client';
import {openPlayerScreen} from '../navigation/navigationRef';
import {resolveStreamUrl} from './mediaPlayback';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isServerPipeUrl(url: string): boolean {
  return url.includes('/api/media/stream/');
}

/** Poll prepare until CDN or cached file URL is ready (Render pipe stream often times out). */
async function waitForPlayableUrl(
  videoId: string,
  type: 'AUDIO' | 'VIDEO',
  initialPath: string,
): Promise<string> {
  if (!isServerPipeUrl(initialPath)) {
    return initialPath;
  }

  let path = initialPath;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await sleep(3000);
    try {
      const prep = await api.preparePlayUrl(videoId, type);
      if (prep.success && prep.data?.streamUrl && !isServerPipeUrl(prep.data.streamUrl)) {
        return prep.data.streamUrl;
      }
      if (prep.success && prep.data?.cached && prep.data.streamUrl) {
        return prep.data.streamUrl;
      }
    } catch {
      // keep polling
    }
  }
  return path;
}

export async function prepareAndStartPlayback(
  item: MediaSearchResult,
  type: 'AUDIO' | 'VIDEO',
  startPlayback: (media: PlayableMedia, streamUrl: string) => void,
): Promise<void> {
  const prep = await api.preparePlayUrl(item.videoId, type);
  if (!prep.success || !prep.data) {
    throw new Error(prep.message || 'Could not prepare playback');
  }

  let streamPath =
    prep.data.streamUrl || `/api/media/stream/${item.videoId}?type=${type}`;

  if (isServerPipeUrl(streamPath)) {
    streamPath = await waitForPlayableUrl(item.videoId, type, streamPath);
  }

  const streamUrl = resolveStreamUrl(streamPath);
  const media: PlayableMedia = {
    title: item.title,
    type,
    streamUrl,
    thumbnailUrl: item.thumbnailUrl,
    quality: prep.data.quality || (type === 'AUDIO' ? item.audioFormat : item.videoFormat),
    sourceUrl: item.sourceUrl,
    videoId: item.videoId,
  };

  startPlayback(media, streamUrl);
  openPlayerScreen(media, streamUrl);
}

export function showPlaybackError(error: unknown): void {
  Alert.alert(
    'Playback failed',
    error instanceof Error
      ? error.message
      : 'Stream could not start. Check connection and try again.',
  );
}
