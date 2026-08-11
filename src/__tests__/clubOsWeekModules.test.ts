import {
  generateClubTournamentPlan,
  proposeTournamentReschedule,
} from '../utils/clubTournamentGenerator';
import { buildLoadAlerts } from '../utils/playerLoadAlerts';
import { recommendRosterNeeds } from '../utils/clubMercatoNeeds';
import { resolveMarketplaceContactPolicy } from '../models/ClubEquipmentListing';
import { canViewTrialSheet, type ClubTrialSheet } from '../models/ClubTrialSheet';

describe('clubTournamentGenerator', () => {
  it('génère poules et matchs sans inventer de scores', () => {
    const startsAt = new Date('2026-09-01T09:00:00');
    const endsAt = new Date('2026-09-01T18:00:00');
    const plan = generateClubTournamentPlan({
      name: 'Tournoi U13',
      category: 'U13',
      teamCount: 8,
      pitchCount: 2,
      matchDurationMin: 15,
      breakBetweenMin: 5,
      poolCount: 2,
      format: 'pools_then_knockout',
      startsAt,
      endsAt,
      teamNames: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    });
    expect(plan.pools).toHaveLength(2);
    expect(plan.teams).toHaveLength(8);
    expect(plan.fixtures.length).toBeGreaterThan(0);
    expect(plan.fixtures[0]).toMatchObject({
      homeName: expect.any(String),
      awayName: expect.any(String),
      pitchIndex: expect.any(Number),
    });
    expect('played' in plan.fixtures[0]).toBe(false);
  });

  it('exige confirmation pour un replan', () => {
    const plan = generateClubTournamentPlan({
      name: 'T',
      category: 'U11',
      teamCount: 4,
      pitchCount: 1,
      matchDurationMin: 10,
      breakBetweenMin: 5,
      poolCount: 1,
      format: 'pools_only',
      startsAt: new Date('2026-09-01T09:00:00'),
      endsAt: new Date('2026-09-01T20:00:00'),
      teamNames: ['A', 'B', 'C', 'D'],
    });
    const proposal = proposeTournamentReschedule(plan.fixtures, plan.fixtures[0].id, 15);
    expect(proposal.confirmationRequired).toBe(true);
    expect(proposal.summary).toMatch(/Confirmation/);
  });
});

describe('playerLoadAlerts — non diagnostic', () => {
  it('n’affiche jamais un pourcentage de risque de blessure', () => {
    const alerts = buildLoadAlerts([
      {
        uid: '1',
        displayName: 'Alex',
        matchesLast7d: 3,
        minutesLast7d: 200,
        trainingsLast7d: 3,
        declaredFatigue: 8,
        daysSinceLastMatch: 1,
      },
    ]);
    expect(alerts[0].level).toBe('high');
    expect(alerts[0].message).not.toMatch(/\d+\s*%/);
    expect(alerts[0].message.toLowerCase()).toMatch(/pas un diagnostic/);
    expect(alerts[0].message).toMatch(/Charge élevée/);
  });

  it('signale les données manquantes', () => {
    const alerts = buildLoadAlerts([
      {
        uid: '2',
        displayName: 'Sam',
        matchesLast7d: 0,
        minutesLast7d: 0,
        trainingsLast7d: 0,
        declaredFatigue: null,
        daysSinceLastMatch: null,
      },
    ]);
    expect(alerts.some((a) => a.missingData.length > 0)).toBe(true);
  });
});

describe('clubMercatoNeeds', () => {
  it('formule une recommandation prudente', () => {
    const rows = recommendRosterNeeds({
      teamId: 't1',
      teamLabel: 'U15 A',
      needs: [{ position: 'goalkeeper', count: 1 }],
      currentByPosition: { goalkeeper: 0 },
    });
    expect(rows[0].suggestion).toMatch(/semble nécessiter/);
    expect(rows[0].suggestion).toMatch(/pas une vérité absolue/);
  });
});

describe('marketplace + trial privacy', () => {
  it('bloque le contact adulte → mineur', () => {
    const policy = resolveMarketplaceContactPolicy({
      listingAuthorUid: 'kid',
      listingAuthorIsMinor: true,
      guardianUid: 'parent',
      viewerUid: 'adult',
      viewerIsMinor: false,
      viewerIsClubStaff: false,
    });
    expect(policy.allowDirectContact).toBe(false);
    expect(policy.contactProxyUid).toBe('parent');
  });

  it('restreint la fiche essai', () => {
    const sheet: ClubTrialSheet = {
      id: 's1',
      club_id: 'c1',
      first_name: 'Léa',
      last_name: 'D',
      birth_year: 2012,
      position: 'Milieu',
      trial_date: new Date(),
      coach_uid: 'coach1',
      coach_name: 'Coach',
      ratings: {},
      is_minor: true,
      authorized_uids: ['coach1'],
      created_at: new Date(),
      updated_at: new Date(),
    };
    expect(canViewTrialSheet(sheet, 'coach1')).toBe(true);
    expect(canViewTrialSheet(sheet, 'stranger')).toBe(false);
  });
});
