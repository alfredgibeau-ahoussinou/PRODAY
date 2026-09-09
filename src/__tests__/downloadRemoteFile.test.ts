jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  downloadAsync: jest.fn(async (_url: string, dest: string) => ({ uri: dest })),
}));

import { Platform, Share, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { downloadRemoteFile } from '../utils/downloadRemoteFile';

describe('downloadRemoteFile', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
    jest.restoreAllMocks();
  });

  it('refuse une URL non https', async () => {
    const res = await downloadRemoteFile('gs://bucket/x.pdf', 'x.pdf');
    expect(res).toEqual({ ok: false, error: 'URL fichier invalide' });
  });

  it('télécharge puis ouvre Share sur native', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const res = await downloadRemoteFile('https://example.com/file.pdf', 'kbis.pdf');
    expect(res).toEqual({ ok: true });
    expect(FileSystem.downloadAsync).toHaveBeenCalled();
    expect(shareSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'kbis.pdf' }),
    );
  });

  it('ouvre Linking en secours si Share échoue', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('share fail'));
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const res = await downloadRemoteFile('https://example.com/a.pdf', 'a.pdf');
    expect(res).toEqual({ ok: true });
    expect(openSpy).toHaveBeenCalledWith('https://example.com/a.pdf');
  });
});
