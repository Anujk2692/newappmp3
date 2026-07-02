import {normalizeFaceImage} from '../../../utils/imageUpload';
import {httpRequest} from '../../../core/api/httpClient';
import type {
  FaceIdentifyResult,
  FaceStatus,
  FaceViewHint,
  LibraryScanResult,
  Person,
  PersonPhoto,
} from '../domain/types';

export const faceApi = {
  getPersons: () => httpRequest<Person[]>('/api/faces'),

  getStatus: () => httpRequest<FaceStatus>('/api/faces/status'),

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
    return httpRequest<Person>('/api/faces/register', {method: 'POST', body: form});
  },

  identifyFace: async (imageUri: string) => {
    const uri = await normalizeFaceImage(imageUri);
    const form = new FormData();
    form.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'query.jpg',
    } as unknown as Blob);
    return httpRequest<FaceIdentifyResult>('/api/faces/identify', {method: 'POST', body: form});
  },

  deletePerson: (id: string) => httpRequest<void>(`/api/faces/${id}`, {method: 'DELETE'}),

  updatePerson: (id: string, data: {name?: string; notes?: string}) =>
    httpRequest<Person>(`/api/faces/${id}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    }),

  getPersonPhotos: (personId: string) =>
    httpRequest<PersonPhoto[]>(`/api/faces/person/${personId}/photos`),

  scanLibraryPhoto: async (
    personId: string,
    imageUri: string,
    devicePhotoId?: string,
    iosAssetId?: string,
    sourceType: 'PHOTO' | 'VIDEO' = 'PHOTO',
    sourceTimestampMs?: number,
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
    form.append('sourceType', sourceType);
    if (sourceTimestampMs != null) {
      form.append('sourceTimestampMs', String(sourceTimestampMs));
    }
    return httpRequest<LibraryScanResult>(`/api/faces/person/${personId}/scan-library`, {
      method: 'POST',
      body: form,
    });
  },

  deletePersonPhoto: (photoId: string) =>
    httpRequest<void>(`/api/faces/photos/${photoId}`, {method: 'DELETE'}),
};
