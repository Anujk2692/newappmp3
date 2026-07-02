import {ensureMediaServer} from '../core/api/httpClient';
import {mediaApi} from '../features/media/api/mediaApi';
import type {MediaSearchResult} from '../features/media/domain/types';

const PREFETCH_TTL_MS = 30 * 60 * 1000;
const prefetched = new Set<string>();
const prefetching = new Set<string>();
const readyCache = new Map<
  string,
  {streamPath: string; quality?: string; expiresAt: number}
>();

let mediaServerWarm: Promise<string> | null = null;

function jobKey(videoId: string, type: 'AUDIO' | 'VIDEO'): string {
  return `${type}:${videoId}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isPlayablePath(path: string): boolean {
  if (!path || path.includes('/api/media/prepare/')) {
    return false;
  }
  return (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('/files/') ||
    path.startsWith('/api/media/stream/') ||
    path.startsWith('file://')
  );
}

export function getPrefetchedStream(
  videoId: string,
  type: 'AUDIO' | 'VIDEO',
): {streamPath: string; quality?: string} | null {
  const hit = readyCache.get(jobKey(videoId, type));
  if (!hit || Date.now() > hit.expiresAt) {
    readyCache.delete(jobKey(videoId, type));
    return null;
  }
  return hit;
}

export function putPrefetchedStream(
  videoId: string,
  type: 'AUDIO' | 'VIDEO',
  streamPath: string,
  quality?: string,
): void {
  if (!isPlayablePath(streamPath)) {
    return;
  }
  readyCache.set(jobKey(videoId, type), {
    streamPath,
    quality,
    expiresAt: Date.now() + PREFETCH_TTL_MS,
  });
}

/** Keep media server discovery hot so play/download taps feel instant. */
export function warmMediaServer(force = false): Promise<string> {
  if (force) {
    mediaServerWarm = null;
  }
  if (!mediaServerWarm) {
    mediaServerWarm = ensureMediaServer().catch(error => {
      mediaServerWarm = null;
      throw error;
    });
  }
  return mediaServerWarm;
}

export function invalidateMediaServerWarm(): void {
  mediaServerWarm = null;
}

async function pollPrepareUntilReady(
  videoId: string,
  type: 'AUDIO' | 'VIDEO',
): Promise<void> {
  const key = jobKey(videoId, type);
  if (prefetching.has(key)) {
    return;
  }
  prefetching.add(key);

  try {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const existing = getPrefetchedStream(videoId, type);
      if (existing) {
        return;
      }

      const response = await mediaApi.prepare(videoId, type);
      if (!response.success || !response.data) {
        return;
      }

      const {data} = response;
      if (data.status === 'FAILED') {
        return;
      }

      if (data.status === 'READY' && data.streamUrl && isPlayablePath(data.streamUrl)) {
        putPrefetchedStream(videoId, type, data.streamUrl, data.quality);
        return;
      }

      await sleep(attempt < 15 ? 250 : 500);
    }
  } finally {
    prefetching.delete(key);
  }
}

/** Start backend prepare in the background before the user taps play. */
export function prefetchMediaPrepare(
  videoId: string,
  type: 'AUDIO' | 'VIDEO' = 'AUDIO',
): void {
  const key = jobKey(videoId, type);
  if (prefetched.has(key) || getPrefetchedStream(videoId, type)) {
    return;
  }
  prefetched.add(key);

  void warmMediaServer()
    .then(() => pollPrepareUntilReady(videoId, type))
    .catch(() => {
      prefetched.delete(key);
    });
}

/** Warm server and prefetch top search hits while the list is visible. */
export function prefetchSearchResults(
  items: MediaSearchResult[],
  limit = 8,
): void {
  if (items.length === 0) {
    return;
  }
  void warmMediaServer().catch(() => undefined);
  items.slice(0, limit).forEach(item => {
    prefetchMediaPrepare(item.videoId, 'AUDIO');
  });
}
