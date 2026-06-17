jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  getAllKeys: jest.fn(async () => []),
  multiRemove: jest.fn(async () => undefined),
}));

import {
  toTranslateTarget,
  translateMessageCatalog,
} from '../services/uiTranslation.service';

describe('uiTranslation.service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mappe les locales supportées vers Google Translate', () => {
    expect(toTranslateTarget('de')).toBe('de');
    expect(toTranslateTarget('fr-x-acd')).toBe('fr');
    expect(toTranslateTarget('ase')).toBe('ase');
    expect(toTranslateTarget('en')).toBeNull();
  });

  it('traduit un catalogue en conservant les paramètres', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [[['Il y a __PD0__ min']]],
    }) as unknown as typeof fetch;

    const result = await translateMessageCatalog(
      { 'preferences.syncedMinutes': 'Il y a {{n}} min' },
      'de'
    );

    expect(result['preferences.syncedMinutes']).toContain('{{n}}');
    expect(global.fetch).toHaveBeenCalled();
  });
});
