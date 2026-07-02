import {Alert} from 'react-native';
import {api, MediaSearchResult, PlayableMedia} from '../api/client';
import {openPlayerScreen} from '../navigation/navigationRef';
import {resolveStreamUrl} from './mediaPlayback';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isBrokenPipeUrl(url: string): boolean {
  return url.includes('/api/media/stream/');
}

function isPlayablePath(path: string): boolean {
  if (!path) {
    return false;
  }
  if (isBrokenPipeUrl(path)) {
    return false;
  }
  return (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('/files/')
  );
}

/** Wait for server-side cache/CDN URL — required on Render (pipe stream times out). */
export async function waitForMediaReady(
  videoId: string,
  type: 'AUDIO' | 'VIDEO',
): Promise<{streamPath: string; quality?: string}> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const status = await api.prepareMedia(videoId, type);
    if (!status.success || !status.data) {
      throw new Error(status.message || 'Could not prepare media');
    }

    const {data} = status;
    if (data.status === 'FAILED') {
      throw new Error(data.message || 'Media prepare failed on server');
    }

    if (data.status === 'READY' && data.streamUrl && isPlayablePath(data.streamUrl)) {
      return {streamPath: data.streamUrl, quality: data.quality};
    }

    await sleep(3000);
  }

  throw new Error('Prepare timed out. Try Download, or wait and retry.');
}

export async function prepareAndStartPlayback(
  item: MediaSearchResult,
  type: 'AUDIO' | 'VIDEO',
  startPlayback: (media: PlayableMedia, streamUrl: string) => void,
): Promise<void> {
  const {streamPath, quality} = await waitForMediaReady(item.videoId, type);
  const streamUrl = resolveStreamUrl(streamPath);

  const media: PlayableMedia = {
    title: item.title,
    type,
    streamUrl,
    thumbnailUrl: item.thumbnailUrl,
    quality: quality || (type === 'AUDIO' ? item.audioFormat : item.videoFormat),
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
