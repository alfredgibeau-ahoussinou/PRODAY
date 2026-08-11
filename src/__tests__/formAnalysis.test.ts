import {
  buildPlayerFormAnalysis,
  buildPreMatchFormInsights,
  playerFormFromHealthSnapshot,
  summarizeSquadForm,
} from '../utils/formAnalysis';
import type { HealthSnapshot } from '../core/types/health';

describe('formAnalysis — Analyse de forme', () => {
  it('classe optimal / watch / low sans jargon médical', () => {
    const optimal = buildPlayerFormAnalysis({
      uid: '1',
      displayName: 'Thomas',
      matchesLast7d: 1,
      minutesLast7d: 70,
      trainingsLast7d: 2,
      declaredFatigue: 2,
      daysSinceLastMatch: 4,
    }, { recovery: 8, wellness_score: 9 });
    expect(optimal.band).toBe('optimal');
    expect(optimal.formScore).toBeGreaterThanOrEqual(80);
    expect(optimal.availabilityLabel).toBe('Disponible');

    const watch = buildPlayerFormAnalysis({
      uid: '2',
      displayName: 'Lucas',
      matchesLast7d: 2,
      minutesLast7d: 140,
      trainingsLast7d: 1,
      declaredFatigue: 5,
      daysSinceLastMatch: 3,
    }, { recovery: 5 });
    expect(['watch', 'low']).toContain(watch.band);
    expect(watch.watchPoints.join(' ').length + watch.trainingHints.join(' ').length).toBeGreaterThan(0);

    const low = buildPlayerFormAnalysis({
      uid: '3',
      displayName: 'Enzo',
      matchesLast7d: 3,
      minutesLast7d: 240,
      trainingsLast7d: 3,
      declaredFatigue: 9,
      daysSinceLastMatch: 1,
    });
    expect(low.band).toBe('low');
    expect(low.chargeLabel).toMatch(/élevée/);
  });

  it('ne présente jamais un diagnostic médical', () => {
    const row = buildPlayerFormAnalysis({
      uid: '4',
      displayName: 'Alex',
      matchesLast7d: 3,
      minutesLast7d: 200,
      trainingsLast7d: 3,
      declaredFatigue: 8,
      daysSinceLastMatch: 1,
    });
    const blob = [...row.watchPoints, ...row.trainingHints].join(' ').toLowerCase();
    expect(blob).not.toMatch(/diagnostic|risque médical|blessure confirm/);
    expect(blob).toMatch(/charge|récupération|surveiller|séance/);
  });

  it('résume l’effectif et produit des insights avant match', () => {
    const rows = [
      buildPlayerFormAnalysis({
        uid: 'a',
        displayName: 'Thomas',
        matchesLast7d: 1,
        minutesLast7d: 60,
        trainingsLast7d: 1,
        declaredFatigue: 2,
        daysSinceLastMatch: 5,
      }, { wellness_score: 9, recovery: 8 }),
      buildPlayerFormAnalysis({
        uid: 'b',
        displayName: 'Lucas',
        matchesLast7d: 2,
        minutesLast7d: 180,
        trainingsLast7d: 2,
        declaredFatigue: 6,
        daysSinceLastMatch: 2,
      }),
    ];
    const summary = summarizeSquadForm(rows);
    expect(summary.total).toBe(2);
    const insights = buildPreMatchFormInsights(rows);
    expect(insights.some((i) => /bonne dynamique|baisse de forme|charge importante/.test(i.message))).toBe(
      true,
    );
  });

  it('dérive Ma forme depuis le snapshot santé joueur', () => {
    const health: HealthSnapshot = {
      state: 'ACTIVE',
      fatigueScore: 30,
      recoveryScore: 75,
      trainingLoad: 45,
      injuryRisk: 'low',
      loadCaution: 'low',
      allowIntenseMatch: true,
      dailyPlanHint: 'ok',
      coachMessage: 'ok',
    };
    const me = playerFormFromHealthSnapshot('u1', 'Joueur', health);
    expect(me.formScore).not.toBeNull();
    expect(me.band).not.toBe('unknown');
  });
});
