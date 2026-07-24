import {
  REEL_UNIVERSE_LABEL,
  instagramUrlForShortCode,
  tiktokUrlForVideo,
  youtubeShortsUrl,
} from '../content/footballReels';
import { polesForUniverse, seedKey, seedsForUniverse } from '../content/reelSeedCatalog';

describe('reelSeedCatalog', () => {
  it('n’expose plus de seeds externes. Contenu acteurs ProDay uniquement', () => {
    for (const universe of ['homme', 'woman', 'pro', 'sante'] as const) {
      expect(seedsForUniverse(universe)).toEqual([]);
    }
  });

  it('filtre les pôles affichés selon l’univers', () => {
    expect(polesForUniverse('homme')).toEqual(['foot', 'mercato', 'sante']);
    expect(polesForUniverse('woman')).toEqual(['foot', 'mercato', 'sante']);
    expect(polesForUniverse('pro')).toEqual(['foot', 'mercato']);
    expect(polesForUniverse('sante')).toEqual(['sante']);
  });

  it('génère des clés stables pour les seeds ProDay', () => {
    const key = seedKey({
      source: 'proday',
      externalId: 'abc',
      authorHandle: 'uid123',
      authorName: 'Joueur',
      tags: ['#proday'],
    });
    expect(key).toBe('proday-abc-uid123');
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

  it('construit les URLs TikTok et YouTube Shorts', () => {
    expect(tiktokUrlForVideo('joueur', '123')).toMatch(/tiktok\.com\/@joueur\/video\/123/);
    expect(youtubeShortsUrl('abc')).toBe('https://www.youtube.com/shorts/abc');
  });
});
