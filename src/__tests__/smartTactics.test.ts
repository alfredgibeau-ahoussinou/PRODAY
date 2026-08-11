import {
  computeMatchReadiness,
  computeOverallPotential,
} from '../utils/matchReadiness';
import {
  buildAiMatchPreparation,
  generateCollectiveTraining,
  isValidFormation,
  previousResultsFromEvents,
  prepToTacticalPlan,
  selectStartingXiByPosition,
  orderUidsByFormationPositions,
  analyzeSquadForm,
} from '../utils/smartTacticsEngine';
import { resolveJoueurPositionGroup } from '../utils/joueurExperienceTheme';
import { wearableToWellnessSignals } from '../utils/wearableToWellness';
import {
  boardSlotsToEventLineup,
  eventLineupToBoardSlots,
  pickLineupTargetEvent,
} from '../utils/tacticalBoardSync';
import type { SmartPlayerCardData } from '../models/SmartTactics';
import type { TeamEvent } from '../models/TeamEvent';

function card(
  uid: string,
  position: string,
  readiness = 80,
  form = 70,
): SmartPlayerCardData {
  return {
    uid,
    display_name: uid,
    position,
    overall: 75,
    readiness_pct: readiness,
    form,
    availability: 'available',
    confidence: 70,
    progress: 40,
    badges: [],
    certifications: [],
  };
}

describe('matchReadiness', () => {
  it('computes potential in 40–99', () => {
    const p = computeOverallPotential({
      age: 22,
      years_experience: 5,
      season_matches: 18,
      season_goals: 6,
      season_assists: 4,
    });
    expect(p).toBeGreaterThanOrEqual(40);
    expect(p).toBeLessThanOrEqual(99);
  });

  it('returns potential + readiness with injured = out', () => {
    const r = computeMatchReadiness(87, { injured: true });
    expect(r.potential).toBe(87);
    expect(r.readiness_pct).toBe(0);
    expect(r.availability).toBe('out');
  });

  it('boosts readiness with good sleep and recovery', () => {
    const low = computeMatchReadiness(80, {
      sleep_hours: 5,
      fatigue: 8,
      recovery: 3,
      wellness_score: 4,
    });
    const high = computeMatchReadiness(80, {
      sleep_hours: 8,
      fatigue: 3,
      recovery: 9,
      wellness_score: 8,
      training_attendance_rate: 0.95,
      recovery_hours_since_last: 72,
    });
    expect(high.readiness_pct).toBeGreaterThan(low.readiness_pct);
  });
});

describe('smartTacticsEngine', () => {
  it('validates unlimited custom formations', () => {
    expect(isValidFormation('4-3-3')).toBe(true);
    expect(isValidFormation('3-1-4-2')).toBe(true);
    expect(isValidFormation('2-3-5')).toBe(true);
    expect(isValidFormation('11')).toBe(false);
    expect(isValidFormation('9-1')).toBe(false);
  });

  it('selects XI by player position for formation lines', () => {
    const cards = [
      card('gk1', 'Gardien', 90),
      card('gk2', 'Gardien', 70),
      card('d1', 'Défenseur', 88),
      card('d2', 'Défenseur', 85),
      card('d3', 'Défenseur', 82),
      card('d4', 'Défenseur', 80),
      card('d5', 'Défenseur', 60),
      card('m1', 'Milieu', 92),
      card('m2', 'Milieu', 84),
      card('m3', 'Milieu', 81),
      card('m4', 'Milieu', 55),
      card('a1', 'Attaquant', 91),
      card('a2', 'Attaquant', 86),
      card('a3', 'Attaquant', 83),
      card('a4', 'Attaquant', 50),
    ];
    const { uids } = selectStartingXiByPosition(cards, '4-3-3');
    expect(uids).toHaveLength(11);
    expect(uids[0]).toBe('gk1');
    expect(uids.slice(1, 5).every((id) => id.startsWith('d'))).toBe(true);
    expect(uids.slice(5, 8).every((id) => id.startsWith('m'))).toBe(true);
    expect(uids.slice(8, 11).every((id) => id.startsWith('a'))).toBe(true);
    expect(uids).not.toContain('gk2');
    expect(uids).not.toContain('d5');
  });

  it('prefers better readiness within the same position', () => {
    const cards = [
      card('gk1', 'Gardien', 60),
      card('gk2', 'Gardien', 95),
      ...Array.from({ length: 4 }, (_, i) => card(`d${i}`, 'Défenseur', 80)),
      ...Array.from({ length: 3 }, (_, i) => card(`m${i}`, 'Milieu', 80)),
      ...Array.from({ length: 3 }, (_, i) => card(`a${i}`, 'Attaquant', 80)),
    ];
    const { uids } = selectStartingXiByPosition(cards, '4-3-3');
    expect(uids[0]).toBe('gk2');
  });

  it('analyzes form of the whole squad by position', () => {
    const cards = [
      card('gk1', 'Gardien', 90, 88),
      card('d1', 'Défenseur', 70, 40),
      card('m1', 'Milieu', 80, 82),
      card('a1', 'Attaquant', 85, 90),
    ];
    const report = analyzeSquadForm(cards);
    expect(report.avg_form).toBeGreaterThan(0);
    expect(report.by_position.forward.count).toBe(1);
    expect(report.in_form.some((c) => c.uid === 'a1')).toBe(true);
    expect(report.at_risk.some((c) => c.uid === 'd1')).toBe(true);
    expect(report.summary_fr).toBeTruthy();
    expect(report.lines.length).toBeGreaterThan(0);
  });

  it('builds AI prep with form briefing', () => {
    const cards = [
      card('gk1', 'Gardien'),
      ...Array.from({ length: 4 }, (_, i) => card(`d${i}`, 'Défenseur')),
      ...Array.from({ length: 3 }, (_, i) => card(`m${i}`, 'Milieu')),
      ...Array.from({ length: 3 }, (_, i) => card(`a${i}`, 'Attaquant', 90, 90)),
    ];
    const prep = buildAiMatchPreparation({
      cards,
      preferred_formation: '4-3-3',
      previous_results: [{ goals_for: 2, goals_against: 1 }],
    });
    expect(prep.briefing_fr).toMatch(/forme/i);
    expect(prep.tactical_suggestions[0]).toMatch(/forme|Forme|effectif/i);
  });

  it('builds AI prep XI respecting positions', () => {
    const cards = [
      card('gk1', 'Gardien'),
      ...Array.from({ length: 4 }, (_, i) => card(`d${i}`, 'Défenseur')),
      ...Array.from({ length: 3 }, (_, i) => card(`m${i}`, 'Milieu')),
      ...Array.from({ length: 3 }, (_, i) => card(`a${i}`, 'Attaquant')),
      card('extra', 'Milieu', 99),
    ];
    const prep = buildAiMatchPreparation({
      cards,
      preferred_formation: '4-3-3',
      previous_results: [{ goals_for: 1, goals_against: 0 }],
    });
    expect(prep.starting_xi_uids).toHaveLength(11);
    expect(prep.starting_xi_uids[0]).toBe('gk1');
    expect(prep.tactical_suggestions.some((s) => /postes/i.test(s))).toBe(true);
  });

  it('orders board starters GK → DEF → MID → ATT', () => {
    const members = [
      { uid: 'a1', display_name: 'A1', profile: { position: 'Attaquant' } },
      { uid: 'gk1', display_name: 'GK', profile: { position: 'Gardien' } },
      { uid: 'm1', display_name: 'M1', profile: { position: 'Milieu' } },
      { uid: 'd1', display_name: 'D1', profile: { position: 'Défenseur' } },
      { uid: 'd2', display_name: 'D2', profile: { position: 'Défenseur' } },
      { uid: 'd3', display_name: 'D3', profile: { position: 'Défenseur' } },
      { uid: 'd4', display_name: 'D4', profile: { position: 'Défenseur' } },
      { uid: 'm2', display_name: 'M2', profile: { position: 'Milieu' } },
      { uid: 'm3', display_name: 'M3', profile: { position: 'Milieu' } },
      { uid: 'a2', display_name: 'A2', profile: { position: 'Attaquant' } },
      { uid: 'a3', display_name: 'A3', profile: { position: 'Attaquant' } },
    ] as unknown as import('../models/User').User[];
    const shuffled = [
      'a1', 'm2', 'd3', 'gk1', 'a2', 'd1', 'm1', 'd2', 'a3', 'd4', 'm3',
    ];
    const ordered = orderUidsByFormationPositions(
      shuffled,
      members.map((m) => card(m.uid, m.profile.position!)),
      '4-3-3',
    );
    expect(ordered[0]).toBe('gk1');
    expect(
      ordered.slice(1, 5).map((id) => resolveJoueurPositionGroup(
        members.find((m) => m.uid === id)?.profile.position,
      )),
    ).toEqual(['defender', 'defender', 'defender', 'defender']);
    const plan = prepToTacticalPlan({
      prep: {
        opponent: {
          strengths: [],
          weaknesses: [],
          key_players: [],
          risk_flags: [],
          suggested_approach: 'Test',
          data_confidence: 'medium',
        },
        formation_recommendation: '4-3-3',
        starting_xi_uids: shuffled,
        tactical_suggestions: [],
        physical_alerts: [],
        risk_analysis: [],
        fallback: false,
        source: 'local',
      },
      members,
      club_id: 'c1',
      created_by: 'coach',
    });
    const starters = plan.board.slots.filter((s) => s.role === 'starter');
    expect(starters[0].uid).toBe('gk1');
    expect(starters[0].position_label).toMatch(/Gardien/i);
  });

  it('builds AI prep with graceful fallback', () => {
    const cards: SmartPlayerCardData[] = Array.from({ length: 14 }, (_, i) => ({
      uid: `u${i}`,
      display_name: `Player ${i}`,
      overall: 70 + i,
      readiness_pct: 50 + i * 2,
      form: 60,
      availability: 'available',
      confidence: 70,
      progress: 40,
      badges: [],
      certifications: [],
    }));
    const prep = buildAiMatchPreparation({ cards });
    expect(prep.formation_recommendation).toBeTruthy();
    expect(prep.starting_xi_uids.length).toBeGreaterThan(0);
    expect(prep.fallback).toBe(true);
    expect(prep.source).toBe('local');
  });

  it('raises confidence when previous results exist', () => {
    const cards: SmartPlayerCardData[] = Array.from({ length: 12 }, (_, i) => ({
      uid: `u${i}`,
      display_name: `Player ${i}`,
      overall: 75,
      readiness_pct: 80,
      form: 70,
      availability: 'available',
      confidence: 70,
      progress: 40,
      badges: [],
      certifications: [],
    }));
    const prep = buildAiMatchPreparation({
      cards,
      previous_results: [
        { goals_for: 2, goals_against: 1 },
        { goals_for: 1, goals_against: 1 },
        { goals_for: 3, goals_against: 0 },
      ],
    });
    expect(prep.fallback).toBe(false);
    expect(prep.opponent.data_confidence).toBe('high');
  });

  it('maps previous results from past events', () => {
    const now = Date.now();
    const events = [
      {
        id: '1',
        title: 'vs Rival',
        event_type: 'friendly',
        starts_at: new Date(now - 86400000),
        live_state: { home_score: 2, away_score: 1, opponent_name: 'Rival', status: 'finished' },
      },
      {
        id: '2',
        title: 'Future',
        event_type: 'friendly',
        starts_at: new Date(now + 86400000),
        live_state: { home_score: 0, away_score: 0, opponent_name: 'X', status: 'scheduled' },
      },
    ] as unknown as TeamEvent[];
    const rows = previousResultsFromEvents(events, 'Rival');
    expect(rows).toEqual([{ goals_for: 2, goals_against: 1 }]);
  });

  it('hydrates a tactical plan from AI prep', () => {
    const members = Array.from({ length: 14 }, (_, i) => ({
      uid: `u${i}`,
      display_name: `P${i}`,
      profile: { position: 'MID' },
    })) as unknown as import('../models/User').User[];
    const prep = buildAiMatchPreparation({
      cards: members.map((m, i) => ({
        uid: m.uid,
        display_name: m.display_name,
        overall: 70,
        readiness_pct: 90 - i,
        form: 70,
        availability: 'available' as const,
        confidence: 70,
        progress: 40,
        badges: [],
        certifications: [],
      })),
      previous_results: [{ goals_for: 1, goals_against: 0 }],
    });
    const plan = prepToTacticalPlan({
      prep,
      members,
      club_id: 'c1',
      created_by: 'coach',
      opponent_name: 'Rival',
    });
    expect(plan.board.formation).toBe(prep.formation_recommendation);
    expect(plan.board.slots.filter((s) => s.role === 'starter').length).toBeGreaterThanOrEqual(8);
    expect(plan.opponent_analysis?.suggested_approach).toBeTruthy();
  });

  it('generates collective training with all block kinds', () => {
    const session = generateCollectiveTraining({
      team_weaknesses: ['Transitions'],
      season_objectives: ['Compacité'],
    });
    expect(session.blocks.length).toBeGreaterThanOrEqual(6);
    expect(session.blocks.some((b) => b.kind === 'warmup')).toBe(true);
    expect(session.blocks.some((b) => b.kind === 'tactical')).toBe(true);
    expect(session.total_duration_min).toBeGreaterThan(60);
  });
});

describe('wearableToWellness', () => {
  it('maps sleep and HRV into wellness signals', () => {
    const signals = wearableToWellnessSignals({
      stepsToday: 8000,
      sleepHoursLastNight: 8,
      restingHeartRate: 54,
      hrvMs: 65,
      syncedAt: new Date().toISOString(),
      source: 'apple_health',
    });
    expect(signals.sleep_hours).toBe(8);
    expect(signals.recovery).toBeGreaterThanOrEqual(6);
    expect(signals.wellness_score).toBeGreaterThanOrEqual(5);
  });
});

describe('tacticalBoardSync', () => {
  it('round-trips board slots ↔ EventLineup', () => {
    const lineup = boardSlotsToEventLineup(
      '4-3-3',
      [{ uid: 'a', display_name: 'A', role: 'starter', position_label: 'ST' }],
      [{ uid: 'b', display_name: 'B', role: 'sub' }],
    );
    expect(lineup.slots).toHaveLength(2);
    const back = eventLineupToBoardSlots(lineup);
    expect(back.formation).toBe('4-3-3');
    expect(back.starters[0].uid).toBe('a');
    expect(back.bench[0].uid).toBe('b');
  });

  it('picks upcoming match event for lineup sync', () => {
    const now = Date.now();
    const events = [
      {
        id: 'train',
        title: 'Training',
        event_type: 'training',
        starts_at: new Date(now + 86400000),
      },
      {
        id: 'match',
        title: 'Friendly',
        event_type: 'friendly',
        starts_at: new Date(now + 3600000),
      },
    ] as TeamEvent[];
    expect(pickLineupTargetEvent(events)?.id).toBe('match');
  });
});
