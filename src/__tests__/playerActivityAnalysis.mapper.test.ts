import { playerActivityFromFirestore } from '../lib/firestoreMappers';

describe('playerActivityFromFirestore — champs analyse IA', () => {
  it('mappe summary, forces, axes et statut analyzed', () => {
    const analyzedAt = '2026-06-20T12:00:00.000Z';
    const activity = playerActivityFromFirestore('act-1', {
      player_uid: 'uid1',
      type: 'match',
      date: new Date('2026-06-19'),
      duration_min: 90,
      source: 'manual',
      created_at: new Date(),
      analysis_status: 'analyzed',
      analysis_summary_fr: 'Bonne lecture du jeu en transition.',
      analysis_strengths: ['Placement', 'Vitesse de passe'],
      analysis_improvements: ['Jeu de tête défensif'],
      analysis_tactical_notes: ['Défend haut sur le côté droit'],
      analysis_confidence: 0.72,
      analyzed_at: analyzedAt,
    });

    expect(activity.analysis_status).toBe('analyzed');
    expect(activity.analysis_summary_fr).toBe('Bonne lecture du jeu en transition.');
    expect(activity.analysis_strengths).toEqual(['Placement', 'Vitesse de passe']);
    expect(activity.analysis_improvements).toEqual(['Jeu de tête défensif']);
    expect(activity.analysis_tactical_notes).toEqual(['Défend haut sur le côté droit']);
    expect(activity.analysis_confidence).toBe(0.72);
    expect(activity.analyzed_at?.toISOString()).toBe(analyzedAt);
  });

  it('mappe le statut failed', () => {
    const activity = playerActivityFromFirestore('act-2', {
      player_uid: 'uid1',
      type: 'training',
      date: new Date(),
      duration_min: 60,
      source: 'manual',
      created_at: new Date(),
      analysis_status: 'failed',
      analysis_summary_fr: 'Analyse IA indisponible',
    });

    expect(activity.analysis_status).toBe('failed');
    expect(activity.analysis_summary_fr).toBe('Analyse IA indisponible');
    expect(activity.analysis_strengths).toBeUndefined();
  });
});
