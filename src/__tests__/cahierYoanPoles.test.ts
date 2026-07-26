import {
  canManageClubEntity,
  canPublishStages,
  isOrganizerCapable,
  poleExclusivityNote,
} from '../utils/roleCapabilities';
import {
  SEASON_PRIORITY_OPTIONS,
  seasonPriorityById,
} from '../content/seasonPriority';
import { checkFeatureAccess, emptyUsagePeriod } from '../utils/subscriptionLogic';

describe('cahier Yoan — Club / Staff', () => {
  it('réserve l’entité club et les stages aux dirigeants / orga', () => {
    expect(canManageClubEntity('club')).toBe(true);
    expect(canManageClubEntity('coach')).toBe(false);
    expect(canManageClubEntity('agent')).toBe(false);
    expect(canPublishStages('club')).toBe(true);
    expect(canPublishStages('organizer')).toBe(true);
    expect(canPublishStages('coach')).toBe(false);
  });

  it('laisse le coach gérer l’effectif (convocations)', () => {
    expect(isOrganizerCapable('coach')).toBe(true);
    expect(isOrganizerCapable('club')).toBe(false);
  });

  it('expose un message d’exclusivité Club ↔ Staff', () => {
    expect(poleExclusivityNote('pro_club')).toMatch(/Staff/i);
    expect(poleExclusivityNote('pro_staff')).toMatch(/Club/i);
  });
});

describe('cahier Yoan — onboarding priorité', () => {
  it('mappe chaque priorité vers un pôle / rôle', () => {
    expect(SEASON_PRIORITY_OPTIONS).toHaveLength(4);
    expect(seasonPriorityById('find_club')).toMatchObject({
      pole: 'pro_player',
      presetRole: 'player',
    });
    expect(seasonPriorityById('manage_team')).toMatchObject({
      pole: 'pro_staff',
      presetRole: 'coach',
    });
    expect(seasonPriorityById('manage_club')).toMatchObject({
      pole: 'pro_club',
      presetRole: 'club',
    });
    expect(seasonPriorityById('organize_tournament')).toMatchObject({
      pole: 'pro_staff',
      presetRole: 'organizer',
    });
  });
});

describe('cahier Yoan — santé 1 visio', () => {
  it('bloque la 2ᵉ visio gratuite pour un praticien free', () => {
    const first = checkFeatureAccess({
      role: 'physio',
      tier: 'free',
      feature: 'sante_visio',
      usage: emptyUsagePeriod(),
      freeVisioUsed: 0,
    });
    expect(first.allowed).toBe(true);

    const second = checkFeatureAccess({
      role: 'physio',
      tier: 'free',
      feature: 'sante_visio',
      usage: emptyUsagePeriod(),
      freeVisioUsed: 1,
    });
    expect(second.allowed).toBe(false);
    expect(second.message).toMatch(/abonnement|Pro/i);
  });

  it('autorise la visio illimitée en tier pro', () => {
    const result = checkFeatureAccess({
      role: 'physio',
      tier: 'pro',
      planId: 'physio_pro',
      feature: 'sante_visio',
      usage: emptyUsagePeriod(),
      freeVisioUsed: 99,
    });
    expect(result.allowed).toBe(true);
  });
});
