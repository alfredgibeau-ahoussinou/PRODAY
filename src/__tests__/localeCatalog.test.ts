import {
  findLocaleOption,
  getLocaleCatalog,
  resolveSupportedLocale,
  resetLocaleCatalogCache,
} from '../i18n/localeCatalog';

describe('localeCatalog', () => {
  afterEach(() => {
    resetLocaleCatalogCache();
  });

  it('expose les cinq langues supportées', () => {
    const catalog = getLocaleCatalog();
    expect(catalog).toHaveLength(5);
    expect(catalog.map((item) => item.code)).toEqual(['fr', 'en', 'es', 'de', 'ko']);
  });

  it('retourne des entrées complètes', () => {
    const catalog = getLocaleCatalog();
    expect(catalog[0]).toMatchObject({
      code: expect.any(String),
      label: expect.any(String),
      nativeLabel: expect.any(String),
    });
  });

  it('inclut le français avec libellés lisibles', () => {
    const fr = findLocaleOption('fr');
    expect(fr).toBeDefined();
    expect(fr?.label).toBe('French');
    expect(fr?.nativeLabel).toBe('Français');
  });

  it('inclut l’allemand et le coréen', () => {
    expect(findLocaleOption('de')?.nativeLabel).toBe('Deutsch');
    expect(findLocaleOption('ko')?.nativeLabel).toBe('한국어');
  });

  it('ramène les locales inconnues vers le français', () => {
    expect(resolveSupportedLocale('pt-BR')).toBe('fr');
    expect(resolveSupportedLocale('ja')).toBe('fr');
  });

  it('résout les codes régionaux vers la langue de base', () => {
    expect(resolveSupportedLocale('en-US')).toBe('en');
    expect(findLocaleOption('en-US')?.code).toBe('en');
  });
});
