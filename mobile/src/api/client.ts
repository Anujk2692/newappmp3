import {API_BASE_URL} from '../config';
import {normalizeFaceImage} from '../utils/imageUpload';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface MediaSearchResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channel: string;
  durationSeconds?: number;
  sourceUrl: string;
  audioFormat?: string;
  videoFormat?: string;
  audioStreamUrl?: string;
  videoStreamUrl?: string;
}

export interface PlayableMedia {
  title: string;
  type: 'AUDIO' | 'VIDEO';
  streamUrl: string;
  thumbnailUrl?: string;
  quality?: string;
  sourceUrl?: string;
  videoId?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  sourceUrl: string;
  type: 'AUDIO' | 'VIDEO';
  fileName: string;
  streamUrl: string;
  thumbnailUrl: string;
  fileSizeBytes?: number;
  quality?: string;
  durationSeconds?: number;
  downloadedAt?: string;
}

export type FaceViewHint = 'AUTO' | 'FRONT' | 'LEFT' | 'RIGHT' | 'PARTIAL';

export interface Person {
  id: string;
  name: string;
  notes?: string;
  imageUrl?: string;
  createdAt?: string;
  photoCount?: number;
  lastRegisteredView?: string;
  registeredViews?: string[];
}

export interface PersonPhoto {
  id: string;
  personId: string;
  imageUrl: string;
  confidence: number;
  matchedAt?: string;
}

export interface LibraryScanResult {
  devicePhotoId?: string;
  matched: boolean;
  saved: boolean;
  confidence: number;
  photoId?: string;
}

export interface PlayUrlResponse {
  videoId: string;
  type: 'AUDIO' | 'VIDEO';
  streamUrl: string;
  contentType: string;
  quality?: string;
  cached: boolean;
}

export interface FaceStatus {
  engineReady: boolean;
  registeredCount: number;
  message: string;
}

export interface FaceCandidate {
  personId: string;
  personName: string;
  confidence: number;
}

export interface FaceIdentifyResult {
  personId?: string;
  personName?: string;
  confidence: number;
  matched: boolean;
  facesScanned?: number;
  matchGap?: number;
  candidates?: FaceCandidate[];
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 120000,
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body instanceof FormData
          ? {}
          : {'Content-Type': 'application/json'}),
        ...(options.headers as Record<string, string>),
      },
    });

    const text = await response.text();
    const json = text ? JSON.parse(text) : {success: false, message: 'Empty response'};

    if (!response.ok) {
      throw new Error(
        json.message || json.error || `Request failed (${response.status})`,
      );
    }
    return json;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Check backend connection.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  health: () => request<{status: string; app: string}>('/api/health'),

  searchMedia: (q: string) =>
    request<MediaSearchResult[]>(
      `/api/media/search?q=${encodeURIComponent(q)}&limit=15`,
    ),

  downloadMedia: (payload: {
    videoId: string;
    title: string;
    sourceUrl: string;
    type: 'AUDIO' | 'VIDEO';
  }) =>
    request<MediaItem>('/api/media/download', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 600000),

  preparePlayUrl: (videoId: string, type: 'AUDIO' | 'VIDEO') =>
    request<PlayUrlResponse>(`/api/media/play/${videoId}?type=${type}`, {}, 300000),

  getAudioLibrary: () =>
    request<MediaItem[]>('/api/media/library/audio'),

  getVideoLibrary: () =>
    request<MediaItem[]>('/api/media/library/video'),

  deleteMedia: (id: string) =>
    request<void>(`/api/media/${id}`, {method: 'DELETE'}),

  getPersons: () => request<Person[]>('/api/faces'),

  getFaceStatus: () => request<FaceStatus>('/api/faces/status'),

  registerPerson: async (
    name: string,
    notes: string,
    imageUri: string,
    viewHint: FaceViewHint = 'AUTO',
  ) => {
    const uri = await normalizeFaceImage(imageUri);
    const form = new FormData();
    form.append('name', name);
    form.append('notes', notes);
    form.append('viewHint', viewHint);
    form.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'face.jpg',
    } as unknown as Blob);
    return request<Person>('/api/faces/register', {
      method: 'POST',
      body: form,
    });
  },

  identifyFace: async (imageUri: string) => {
    const uri = await normalizeFaceImage(imageUri);
    const form = new FormData();
    form.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'query.jpg',
    } as unknown as Blob);
    return request<FaceIdentifyResult>('/api/faces/identify', {
      method: 'POST',
      body: form,
    });
  },

  deletePerson: (id: string) =>
    request<void>(`/api/faces/${id}`, {method: 'DELETE'}),

  getPersonPhotos: (personId: string) =>
    request<PersonPhoto[]>(`/api/faces/person/${personId}/photos`),

  scanLibraryPhoto: async (
    personId: string,
    imageUri: string,
    devicePhotoId?: string,
    iosAssetId?: string,
  ) => {
    const uri = await normalizeFaceImage(imageUri, iosAssetId);
    const form = new FormData();
    form.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'library.jpg',
    } as unknown as Blob);
    if (devicePhotoId) {
      form.append('devicePhotoId', devicePhotoId);
    }
    return request<LibraryScanResult>(`/api/faces/person/${personId}/scan-library`, {
      method: 'POST',
      body: form,
    });
  },

  deletePersonPhoto: (photoId: string) =>
    request<void>(`/api/faces/photos/${photoId}`, {method: 'DELETE'}),

  getStreamUrl: (streamUrl: string) => `${API_BASE_URL}${streamUrl}`,

  getPlayStreamUrl: (videoId: string, type: 'AUDIO' | 'VIDEO') =>
    `${API_BASE_URL}/api/media/play/${videoId}?type=${type}`,

  getImageUrl: (imageUrl?: string) =>
    imageUrl ? `${API_BASE_URL}${imageUrl}` : undefined,
};
