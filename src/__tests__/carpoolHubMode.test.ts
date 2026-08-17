import { COACH_CARPOOL_MODE_KEYS } from '../content/coachCarpoolModes';
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

describe('coach carpool mode bar i18n keys', () => {
  it('expose une clé i18n par mode hub', () => {
    expect(COACH_CARPOOL_MODE_KEYS.ride).toBe('coach.portal.carpool.mode.ride');
    expect(COACH_CARPOOL_MODE_KEYS.drive).toBe('coach.portal.carpool.mode.drive');
    expect(COACH_CARPOOL_MODE_KEYS.trips).toBe('coach.portal.carpool.mode.trips');
  });
});
