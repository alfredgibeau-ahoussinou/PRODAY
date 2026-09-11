import {
  formatTrainingSessionTitle,
  formatEventScheduleLabel,
} from '../utils/teamEventFormatting';
import type { TeamEvent } from '../models/TeamEvent';

describe('convocationDesign', () => {
  it('formate correctement les titres de convocation d’entraînement', () => {
    const event: Partial<TeamEvent> = {
      title: 'Séance finition',
      event_type: 'training',
      starts_at: new Date(2026, 8, 8, 18, 30), // Mardi 8 Septembre 18:30
    };

    const formatted = formatTrainingSessionTitle(event as TeamEvent);
    expect(formatted).toBe('Entraînement - Mardi 8 Septembre à 18:30 · Séance finition');
  });

  it('formate le libellé d’horaire pour un match amical ou compétition', () => {
    const matchEvent: Partial<TeamEvent> = {
      title: 'Match Amical vs Chamois Niortais',
      event_type: 'friendly',
      starts_at: new Date(2026, 8, 12, 15, 0), // Samedi 12 Septembre 15:00
    };

    const label = formatEventScheduleLabel(matchEvent as TeamEvent);
    expect(label).toBe('Match Amical vs Chamois Niortais - Samedi 12 Septembre à 15:00');
  });
});
