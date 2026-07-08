jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  downloadAsync: jest.fn(),
  uploadAsync: jest.fn(),
  cacheDirectory: 'file:///cache/',
  FileSystemUploadType: { BINARY_CONTENT: 0, MULTIPART: 1 },
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn((_, path: string) => ({ fullPath: path, path: 'mock-ref' })),
  uploadBytes: jest.fn(),
  uploadString: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  firebaseConfig: { storageBucket: 'test-bucket.appspot.com' },
}));

jest.mock('../lib/firebase', () => ({
  getFirebaseStorage: jest.fn(() => ({})),
  getFirebaseAuth: jest.fn(() => ({
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
    },
  })),
}));

import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import {
  normalizeImageMimeType,
  readFileAsBase64ForUpload,
  resolveLocalFileUriForUpload,
  storageService,
} from '../services/storage.service';

describe('storage.service', () => {
  const originalOs = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    (getDownloadURL as jest.Mock).mockResolvedValue('https://cdn.test/avatar.jpg');
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('aGVsbG8=');
    (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
      uri: 'file:///cache/upload_123',
    });
    (FileSystem.uploadAsync as jest.Mock).mockResolvedValue({
      status: 200,
      body: '{"name":"avatars/uid-1/1.jpg"}',
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });

  it('normalise les MIME images', () => {
    expect(normalizeImageMimeType('image/jpg')).toBe('image/jpeg');
    expect(normalizeImageMimeType('image/png')).toBe('image/png');
    expect(normalizeImageMimeType(null)).toBe('image/jpeg');
  });

  it('upload RN file:// via REST uploadAsync (pas uploadString ni Blob)', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    const url = await storageService.uploadProfileImage(
      'uid-1',
      { uri: 'file:///tmp/photo.jpg', mimeType: 'image/jpeg' },
      'avatars'
    );

    expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
      expect.stringContaining('firebasestorage.googleapis.com/v0/b/test-bucket.appspot.com/o'),
      'file:///tmp/photo.jpg',
      expect.objectContaining({
        httpMethod: 'POST',
        uploadType: 0,
        headers: expect.objectContaining({
          Authorization: 'Firebase mock-id-token',
          'Content-Type': 'image/jpeg',
        }),
      })
    );
    expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled();
    expect(uploadString).not.toHaveBeenCalled();
    expect(uploadBytes).not.toHaveBeenCalled();
    expect(url).toBe('https://cdn.test/avatar.jpg');
  });

  it('upload RN content:// galerie via REST uploadAsync', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });

    await storageService.uploadProfileImage(
      'uid-1',
      { uri: 'content://media/external/images/media/42', mimeType: 'image/jpeg' },
      'gallery'
    );

    expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
      expect.any(String),
      'content://media/external/images/media/42',
      expect.any(Object)
    );
    expect(uploadString).not.toHaveBeenCalled();
    expect(uploadBytes).not.toHaveBeenCalled();
  });

  it('upload RN highlight video via REST uploadAsync', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    await storageService.uploadProfileHighlightVideo('uid-1', {
      uri: 'file:///tmp/highlight.mp4',
      mimeType: 'video/mp4',
    });

    expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
      expect.stringContaining('name=highlights%2Fuid-1%2F'),
      'file:///tmp/highlight.mp4',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'video/mp4' }),
      })
    );
    expect(uploadString).not.toHaveBeenCalled();
  });

  it('upload RN URL distante via downloadAsync + REST uploadAsync', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    await storageService.uploadActivityThumbnail(
      'uid-1',
      'act-1',
      'https://cdn.test/video-frame.jpg'
    );

    expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
      'https://cdn.test/video-frame.jpg',
      expect.stringMatching(/^file:\/\/\/cache\/upload_\d+$/)
    );
    expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
      expect.any(String),
      'file:///cache/upload_123',
      expect.any(Object)
    );
    expect(uploadString).not.toHaveBeenCalled();
  });

  it('readFileAsBase64ForUpload lit une URI locale sans fetch', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    const base64 = await readFileAsBase64ForUpload('ph://asset-id/local');

    expect(base64).toBe('aGVsbG8=');
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('ph://asset-id/local', {
      encoding: 'base64',
    });
  });

  it('resolveLocalFileUriForUpload télécharge les URLs distantes', async () => {
    const localUri = await resolveLocalFileUriForUpload('https://cdn.test/remote.jpg');
    expect(localUri).toBe('file:///cache/upload_123');
  });

  it('upload web via uploadBytes', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const blob = new Blob(['hello'], { type: 'image/jpeg' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: async () => blob,
    }) as unknown as typeof fetch;

    await storageService.uploadProfileImage(
      'uid-1',
      { uri: 'https://example.com/photo.jpg', mimeType: 'image/jpeg' },
      'avatars'
    );

    expect(FileSystem.uploadAsync).not.toHaveBeenCalled();
    expect(uploadBytes).toHaveBeenCalledWith(expect.anything(), blob, {
      contentType: 'image/jpeg',
    });
    expect(uploadString).not.toHaveBeenCalled();
  });
});
