import {
  averageAttributeRating,
  buildScoutReportDraft,
  isScoutReportComplete,
} from '../core/recruitment/scoutReport.engine';
import { scoutReportFromFirestore } from '../lib/firestoreMappers';

describe('scoutReportFromFirestore', () => {
  it('maps firestore payload to ScoutReport', () => {
    const report = scoutReportFromFirestore('r1', {
      player_uid: 'p1',
      author_uid: 's1',
      club_id: 'c1',
      title: 'Essai amical',
      observed_at: { toDate: () => new Date('2026-08-01') },
      created_at: { toDate: () => new Date('2026-08-01') },
      updated_at: { toDate: () => new Date('2026-08-02') },
      attributes: [
        { id: 'technique', rating: 4 },
        { id: 'tactique', rating: 3 },
        { id: 'physique', rating: 4 },
        { id: 'mental', rating: 5 },
      ],
      overall_rating: 4,
      recommendation: 'trial',
      summary: 'Bon pressing et vitesse sur le côté droit du terrain.',
      strengths: ['vitesse'],
      weaknesses: [],
      visibility: 'club',
      opportunity_score_snapshot: 78,
    });

    expect(report.id).toBe('r1');
    expect(report.player_uid).toBe('p1');
    expect(report.recommendation).toBe('trial');
    expect(report.attributes).toHaveLength(4);
    expect(report.opportunity_score_snapshot).toBe(78);
    expect(isScoutReportComplete(report)).toBe(true);
  });
});

describe('buildScoutReportDraft recommendation override', () => {
  it('honors explicit recommendation', () => {
    const draft = buildScoutReportDraft({
      playerUid: 'p1',
      authorUid: 's1',
      title: 'Test',
      summary: 'Synthèse suffisamment longue pour valider le rapport.',
      recommendation: 'monitor',
      opportunityBand: 'excellent',
      attributes: [
        { id: 'technique', rating: 5 },
        { id: 'tactique', rating: 5 },
        { id: 'physique', rating: 5 },
        { id: 'mental', rating: 5 },
      ],
    });
    expect(draft.recommendation).toBe('monitor');
    expect(averageAttributeRating(draft.attributes)).toBe(5);
  });
});
