import {
  formatTrainingSessionTitle,
  formatEventScheduleLabel,
  formatEventScheduleDate,
  formatEventScheduleTime,
} from '../utils/teamEventFormatting';

describe('teamEventFormatting', () => {
  it('formate correctement une séance au format "Entraînement - Mercredi 16 Septembre à 19:00"', () => {
    const testDate = new Date(2026, 8, 16, 19, 0, 0); // Mercredi 16 Septembre 2026 19:00
    const result = formatTrainingSessionTitle({ starts_at: testDate });
    expect(result).toBe('Entraînement - Mercredi 16 Septembre à 19:00');
  });

  it('inclut le titre personnalisé si présent', () => {
    const testDate = new Date(2026, 8, 16, 19, 30, 0);
    const result = formatTrainingSessionTitle({
      starts_at: testDate,
      title: 'Tactique & Coups de Pied Arrêtés',
    });
    expect(result).toBe('Entraînement - Mercredi 16 Septembre à 19:30 · Tactique & Coups de Pied Arrêtés');
  });

  it('gère proprement l’absence de date ou une date invalide', () => {
    expect(formatTrainingSessionTitle(null)).toBe('Entraînement - Prochainement');
    expect(formatTrainingSessionTitle({ starts_at: 'invalid-date' })).toBe('Entraînement - Prochainement');
  });

  it('formate formatEventScheduleLabel pour un match', () => {
    const testDate = new Date(2026, 8, 19, 15, 0, 0); // Samedi 19 Septembre 2026 15:00
    const result = formatEventScheduleLabel({
      event_type: 'match',
      title: 'Match vs Chamois Niortais',
      starts_at: testDate,
    });
    expect(result).toBe('Match vs Chamois Niortais - Samedi 19 Septembre à 15:00');
  });

  it('formate les heures avec zéro initial (ex: 09:05)', () => {
    const testDate = new Date(2026, 8, 20, 9, 5, 0);
    expect(formatEventScheduleTime(testDate)).toBe('09:05');
  });
});
