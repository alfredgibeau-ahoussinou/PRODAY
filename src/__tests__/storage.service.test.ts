jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  downloadAsync: jest.fn(),
  uploadAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  cacheDirectory: 'file:///cache/',
  FileSystemUploadType: { BINARY_CONTENT: 0, MULTIPART: 1 },
  FileSystemSessionType: { BACKGROUND: 0, FOREGROUND: 1 },
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
      uid: 'uid-1',
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
    (FileSystem.copyAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });

  it('normalise les MIME images', () => {
    expect(normalizeImageMimeType('image/jpg')).toBe('image/jpeg');
    expect(normalizeImageMimeType('image/png')).toBe('image/png');
    expect(normalizeImageMimeType(null)).toBe('image/jpeg');
  });

  it('upload RN file:// via SDK uploadBytes (auth Firebase)', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }) as unknown as typeof fetch;

    const url = await storageService.uploadProfileImage(
      'uid-1',
      { uri: 'file:///tmp/photo.jpg', mimeType: 'image/jpeg' },
      'avatars'
    );

    expect(FileSystem.copyAsync).toHaveBeenCalled();
    expect(uploadBytes).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Uint8Array),
      expect.objectContaining({ contentType: 'image/jpeg' })
    );
    expect(uploadString).not.toHaveBeenCalled();
    expect(url).toBe('https://cdn.test/avatar.jpg');
  });

  it('upload RN content:// galerie via SDK uploadBytes', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }) as unknown as typeof fetch;

    await storageService.uploadProfileImage(
      'uid-1',
      { uri: 'content://media/external/images/media/42', mimeType: 'image/jpeg' },
      'gallery'
    );

    expect(uploadBytes).toHaveBeenCalled();
    expect(uploadString).not.toHaveBeenCalled();
  });

  it('upload RN highlight video via SDK uploadBytes', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }) as unknown as typeof fetch;

    await storageService.uploadProfileHighlightVideo('uid-1', {
      uri: 'file:///tmp/highlight.mp4',
      mimeType: 'video/mp4',
    });

    expect(uploadBytes).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Uint8Array),
      expect.objectContaining({ contentType: 'video/mp4' })
    );
    expect(uploadString).not.toHaveBeenCalled();
  });

  it('upload RN URL distante via downloadAsync + SDK uploadBytes', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }) as unknown as typeof fetch;

    await storageService.uploadActivityThumbnail(
      'uid-1',
      'act-1',
      'https://cdn.test/video-frame.jpg'
    );

    expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
      'https://cdn.test/video-frame.jpg',
      expect.stringMatching(/^file:\/\/\/cache\/upload_\d+$/)
    );
    expect(uploadBytes).toHaveBeenCalled();
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
    if (Platform.OS !== 'web') {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      }) as unknown as typeof fetch;
      await storageService.uploadProfileImage(
        'uid-1',
        { uri: 'https://example.com/photo.jpg', mimeType: 'image/jpeg' },
        'avatars'
      );
      expect(uploadBytes).toHaveBeenCalled();
      return;
    }

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
