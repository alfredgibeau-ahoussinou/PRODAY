import {
  carpoolChapterToHubMode,
  carpoolHubModeToChapter,
} from '../content/carpoolChapters';

describe('carpool hub mode mapping', () => {
  it('mappe les chapters legacy vers Passager / Conducteur / Trajets', () => {
    expect(carpoolChapterToHubMode('reserver')).toBe('ride');
    expect(carpoolChapterToHubMode('evenements')).toBe('ride');
    expect(carpoolChapterToHubMode('proposer')).toBe('drive');
    expect(carpoolChapterToHubMode('mes_trajets')).toBe('trips');
    expect(carpoolChapterToHubMode('equipe')).toBe('trips');
  });

  it('mappe les modes vers un chapter de référence', () => {
    expect(carpoolHubModeToChapter('ride')).toBe('reserver');
    expect(carpoolHubModeToChapter('drive')).toBe('proposer');
    expect(carpoolHubModeToChapter('trips')).toBe('mes_trajets');
  });
});
