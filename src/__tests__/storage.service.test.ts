jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(() => ({ path: 'mock-ref' })),
  uploadBytes: jest.fn(),
  uploadString: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  getFirebaseStorage: jest.fn(() => ({})),
}));

import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { normalizeImageMimeType, storageService } from '../services/storage.service';

describe('storage.service', () => {
  const originalOs = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    (getDownloadURL as jest.Mock).mockResolvedValue('https://cdn.test/avatar.jpg');
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('aGVsbG8=');
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });

  it('normalise les MIME images', () => {
    expect(normalizeImageMimeType('image/jpg')).toBe('image/jpeg');
    expect(normalizeImageMimeType('image/png')).toBe('image/png');
    expect(normalizeImageMimeType(null)).toBe('image/jpeg');
  });

  it('upload RN local file via uploadString base64 (pas de Blob ArrayBuffer)', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    const url = await storageService.uploadProfileImage(
      'uid-1',
      { uri: 'file:///tmp/photo.jpg', mimeType: 'image/jpeg' },
      'avatars'
    );

    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file:///tmp/photo.jpg', {
      encoding: 'base64',
    });
    expect(uploadString).toHaveBeenCalledWith(
      expect.anything(),
      'aGVsbG8=',
      'base64',
      { contentType: 'image/jpeg' }
    );
    expect(uploadBytes).not.toHaveBeenCalled();
    expect(url).toBe('https://cdn.test/avatar.jpg');
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

    expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled();
    expect(uploadBytes).toHaveBeenCalledWith(expect.anything(), blob, {
      contentType: 'image/jpeg',
    });
    expect(uploadString).not.toHaveBeenCalled();
  });
});
