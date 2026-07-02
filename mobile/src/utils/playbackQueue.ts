import {api, MediaItem, PlayableMedia} from '../api/client';
import {QueueTrack} from '../context/PlaybackContext';

export function libraryItemToTrack(item: MediaItem): QueueTrack {
  const streamUrl = api.getStreamUrl(item.streamUrl);
  const media: PlayableMedia = {
    title: item.title,
    type: item.type,
    streamUrl,
    thumbnailUrl: item.thumbnailUrl,
    quality: item.quality,
    sourceUrl: item.sourceUrl,
    libraryId: item.id,
  };
  return {id: item.id, media, streamUrl};
}

export function buildLibraryQueue(items: MediaItem[]): QueueTrack[] {
  return items.map(libraryItemToTrack);
}
