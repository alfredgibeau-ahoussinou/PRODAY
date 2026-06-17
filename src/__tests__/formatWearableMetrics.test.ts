import {
  formatHeartRateValue,
  formatSleepValue,
  formatStepsValue,
  hasWearableData,
  wearableDataDisclaimer,
} from '../services/wearableHealth/formatWearableMetrics';

describe('formatWearableMetrics', () => {
  it('affiche honnêtement les valeurs manquantes', () => {
    expect(formatStepsValue(null)).toBe('Non dispo.');
    expect(formatSleepValue(undefined)).toBe('Non dispo.');
    expect(formatHeartRateValue(null)).toBe('Non dispo.');
    expect(formatStepsValue(8420)).toBe('8\u202f420');
  });

  it('détecte l’absence totale de données', () => {
    expect(
      hasWearableData({
        stepsToday: null,
        sleepHoursLastNight: null,
        restingHeartRate: null,
        syncedAt: '',
        source: 'apple_health',
      })
    ).toBe(false);
  });

  it('explique les données partielles manquantes', () => {
    const msg = wearableDataDisclaimer(
      {
        stepsToday: 1200,
        sleepHoursLastNight: null,
        restingHeartRate: null,
        syncedAt: '',
        source: 'google_health',
      },
      'Google Health'
    );
    expect(msg).toContain('sommeil');
    expect(msg).toContain('Google Health');
  });
});
