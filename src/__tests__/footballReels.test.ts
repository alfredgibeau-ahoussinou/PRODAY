import {
  REEL_UNIVERSE_LABEL,
  instagramUrlForShortCode,
  tiktokUrlForVideo,
  youtubeShortsUrl,
} from '../content/footballReels';
import { REEL_SEEDS, polesForUniverse, seedKey, seedsForUniverse } from '../content/reelSeedCatalog';

describe('reelSeedCatalog', () => {
  it('fournit des seeds sociales distinctes par univers', () => {
    for (const universe of ['homme', 'woman', 'pro'] as const) {
      const seeds = seedsForUniverse(universe);
      const keys = seeds.map(seedKey);
      expect(seeds.length).toBeGreaterThanOrEqual(4);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('filtre les pôles affichés selon l’univers', () => {
    expect(polesForUniverse('homme')).toEqual(['foot', 'mercato', 'sante']);
    expect(polesForUniverse('woman')).toEqual(['foot', 'mercato', 'sante']);
    expect(polesForUniverse('pro')).toEqual(['foot', 'mercato']);
    expect(polesForUniverse('sante')).toEqual(['sante']);
  });

  it('référence des URLs valides par source', () => {
    for (const universe of ['homme', 'woman', 'pro'] as const) {
      for (const seed of REEL_SEEDS[universe]) {
        if (seed.source === 'instagram') {
          expect(seed.externalId.length).toBeGreaterThanOrEqual(10);
          expect(instagramUrlForShortCode(seed.externalId, seed.authorHandle)).toMatch(
            /instagram\.com\/.*reel\//,
          );
        }
        if (seed.source === 'tiktok') {
          expect(tiktokUrlForVideo(seed.authorHandle, seed.externalId)).toMatch(
            /tiktok\.com\/@.+\/video\//,
          );
        }
        if (seed.source === 'youtube') {
          expect(youtubeShortsUrl(seed.externalId)).toMatch(/youtube\.com\/shorts\//);
        }
      }
    }
  });
});

describe('footballReels helpers', () => {
  it('associe chaque univers à un libellé foot', () => {
    expect(REEL_UNIVERSE_LABEL.homme).toBe('Foot masculin');
    expect(REEL_UNIVERSE_LABEL.woman).toBe('Foot féminin');
    expect(REEL_UNIVERSE_LABEL.pro).toBe('Foot pro & staff');
  });

  it('construit une URL Instagram avec ou sans handle', () => {
    expect(instagramUrlForShortCode('DHHD7GOIRn0')).toBe(
      'https://www.instagram.com/reel/DHHD7GOIRn0/',
    );
    expect(instagramUrlForShortCode('DHHD7GOIRn0', '433')).toBe(
      'https://www.instagram.com/433/reel/DHHD7GOIRn0/',
    );
  });
});
