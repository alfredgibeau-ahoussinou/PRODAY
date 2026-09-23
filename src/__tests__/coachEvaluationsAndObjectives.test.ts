import {
  clampCoachRating,
  formatCoachRating,
  formatCoachRatingsSummary,
  hasAnyCoachRating,
  normalizeCoachRatings,
  averageCoachRatings,
} from '../utils/coachEvaluationRatings';
import {
  coachEvaluationsService,
  isEvaluationVisibleToUser,
  filterEvaluationsForViewer,
} from '../services/coachEvaluations.service';
import {
  coachObjectivesService,
  isObjectiveVisibleToUser,
  filterObjectivesForViewer,
} from '../services/coachObjectives.service';
import type { CoachPlayerEvaluation } from '../models/CoachEvaluation';
import type { CoachSeasonObjective } from '../models/CoachSeasonObjective';
import { isFirebaseConfigured } from '../config/firebase';
import { getDb } from '../lib/firebase';
import {
  addDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(),
}));

const mockIsFirebaseConfigured = isFirebaseConfigured as jest.MockedFunction<
  typeof isFirebaseConfigured
>;
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;

describe('Coach Evaluations & Objectives - Ratings & Normalization', () => {
  it('borne et arrondit les notes /10 via clampCoachRating', () => {
    expect(clampCoachRating(-2)).toBe(0);
    expect(clampCoachRating(15)).toBe(10);
    expect(clampCoachRating(7.44)).toBe(7.4);
    expect(clampCoachRating(7.46)).toBe(7.5);
  });

  it('normalise les anciennes notes sur 5 sans dimensions vers /10', () => {
    const legacy = normalizeCoachRatings({ overall: 3.5 });
    expect(legacy.overall).toBe(7);
  });

  it('préserve les notes sur 10 lorsqu’il y a des dimensions', () => {
    const multiDim = normalizeCoachRatings({
      overall: 4.5,
      technical: 8,
      tactical: 7,
      physical: 9,
      mental: 6.5,
    });
    expect(multiDim.overall).toBe(4.5);
    expect(multiDim.technical).toBe(8);
    expect(multiDim.tactical).toBe(7);
    expect(multiDim.physical).toBe(9);
    expect(multiDim.mental).toBe(6.5);
  });

  it('formate correctement les notes à l’affichage', () => {
    expect(formatCoachRating(null)).toBe('—');
    expect(formatCoachRating(undefined)).toBe('—');
    expect(formatCoachRating(8)).toBe('8/10');
    expect(formatCoachRating(7.5)).toBe('7.5/10');
  });

  it('vérifie la présence de notes et formate le résumé textuel', () => {
    expect(hasAnyCoachRating({})).toBe(false);
    expect(hasAnyCoachRating({ technical: 7 })).toBe(true);
    const summary = formatCoachRatingsSummary({ overall: 8, tactical: 7.5 });
    expect(summary).toContain('note générale 8/10');
    expect(summary).toContain('tactique 7.5/10');
  });

  it('calcule la moyenne d’une dimension sur un ensemble d’évaluations', () => {
    const evals: CoachPlayerEvaluation[] = [
      {
        id: 'e1',
        club_id: 'c1',
        player_uid: 'p1',
        player_name: 'Lucas',
        coach_uid: 'c1',
        coach_name: 'Coach',
        context: 'season',
        ratings: { overall: 8, technical: 6 },
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'e2',
        club_id: 'c1',
        player_uid: 'p1',
        player_name: 'Lucas',
        coach_uid: 'c1',
        coach_name: 'Coach',
        context: 'season',
        ratings: { overall: 6, technical: 8 },
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    expect(averageCoachRatings(evals, 'overall')).toBe(7);
    expect(averageCoachRatings(evals, 'technical')).toBe(7);
    expect(averageCoachRatings(evals, 'mental')).toBeNull();
  });
});

describe('Coach Evaluations - Droits de Visibilité (Joueur, Parent, Staff)', () => {
  const mockEvaluation: CoachPlayerEvaluation = {
    id: 'eval-101',
    club_id: 'club-alpha',
    player_uid: 'player-1',
    player_name: 'Yanis',
    coach_uid: 'coach-1',
    coach_name: 'M. Le Coach',
    context: 'season',
    ratings: { overall: 8, technical: 8, tactical: 7, physical: 8, mental: 9 },
    notes: 'Très bonne progression',
    rating_explanation: 'Améliorer le repli défensif',
    visible_to_player: true,
    visible_to_parent: false,
    created_at: new Date('2026-09-01'),
    updated_at: new Date('2026-09-01'),
  };

  it('autorise toujours le coach, le club et l’administrateur', () => {
    expect(isEvaluationVisibleToUser(mockEvaluation, { role: 'coach', uid: 'coach-1' })).toBe(true);
    expect(isEvaluationVisibleToUser(mockEvaluation, { role: 'coach', uid: 'coach-2' })).toBe(true);
    expect(isEvaluationVisibleToUser(mockEvaluation, { role: 'club', uid: 'club-admin' })).toBe(true);
    expect(isEvaluationVisibleToUser(mockEvaluation, { role: 'admin', uid: 'superadmin' })).toBe(true);
  });

  it('autorise le joueur concerné si visible_to_player est true', () => {
    expect(isEvaluationVisibleToUser(mockEvaluation, { role: 'player', uid: 'player-1' })).toBe(true);
  });

  it('refuse le joueur si visible_to_player est false', () => {
    const hiddenEval = { ...mockEvaluation, visible_to_player: false };
    expect(isEvaluationVisibleToUser(hiddenEval, { role: 'player', uid: 'player-1' })).toBe(false);
  });

  it('refuse un autre joueur même si visible_to_player est true', () => {
    expect(isEvaluationVisibleToUser(mockEvaluation, { role: 'player', uid: 'player-OTHER' })).toBe(false);
  });

  it('gère la visibilité parent selon visible_to_parent', () => {
    expect(isEvaluationVisibleToUser(mockEvaluation, { role: 'parent', uid: 'parent-1' })).toBe(false);
    const parentEval = { ...mockEvaluation, visible_to_parent: true };
    expect(isEvaluationVisibleToUser(parentEval, { role: 'parent', uid: 'parent-1' })).toBe(true);
  });

  it('refuse si le rôle est absent ou non reconnu', () => {
    expect(isEvaluationVisibleToUser(mockEvaluation, {})).toBe(false);
    expect(isEvaluationVisibleToUser(mockEvaluation, { role: 'supporter', uid: 'sup-1' })).toBe(false);
  });

  it('filtre correctement une liste d’évaluations pour chaque audience via filterEvaluationsForViewer', () => {
    const list: CoachPlayerEvaluation[] = [
      { ...mockEvaluation, id: 'e1', player_uid: 'p1', visible_to_player: true, visible_to_parent: false },
      { ...mockEvaluation, id: 'e2', player_uid: 'p1', visible_to_player: false, visible_to_parent: true },
      { ...mockEvaluation, id: 'e3', player_uid: 'p2', visible_to_player: true, visible_to_parent: true },
    ];

    // Staff : voit les 3
    expect(filterEvaluationsForViewer(list, { role: 'coach' })).toHaveLength(3);

    // Joueur p1 : ne voit que e1
    const player1Views = filterEvaluationsForViewer(list, { role: 'player', uid: 'p1' });
    expect(player1Views.map((e) => e.id)).toEqual(['e1']);

    // Parent : voit e2 et e3
    const parentViews = filterEvaluationsForViewer(list, { role: 'parent', uid: 'par-1' });
    expect(parentViews.map((e) => e.id)).toEqual(['e2', 'e3']);
  });
});

describe('Coach Objectives - Droits de Visibilité', () => {
  const teamObj: CoachSeasonObjective = {
    id: 'obj-team',
    club_id: 'c1',
    scope: 'team',
    title: 'Finir dans le top 3',
    progress: 60,
    created_by: 'coach-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const playerObj: CoachSeasonObjective = {
    id: 'obj-p1',
    club_id: 'c1',
    scope: 'player',
    player_uid: 'p1',
    player_name: 'Lucas',
    title: '15 buts en championnat',
    progress: 40,
    created_by: 'coach-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('rend les objectifs collectifs visibles par tous les acteurs autorisés', () => {
    expect(isObjectiveVisibleToUser(teamObj, { role: 'coach' })).toBe(true);
    expect(isObjectiveVisibleToUser(teamObj, { role: 'player', uid: 'p1' })).toBe(true);
    expect(isObjectiveVisibleToUser(teamObj, { role: 'player', uid: 'p2' })).toBe(true);
    expect(isObjectiveVisibleToUser(teamObj, { role: 'parent' })).toBe(true);
  });

  it('limite les objectifs individuels au joueur assigné ou au staff', () => {
    expect(isObjectiveVisibleToUser(playerObj, { role: 'coach' })).toBe(true);
    expect(isObjectiveVisibleToUser(playerObj, { role: 'player', uid: 'p1' })).toBe(true);
    expect(isObjectiveVisibleToUser(playerObj, { role: 'player', uid: 'p2' })).toBe(false);
  });

  it('filtre une collection d’objectifs selon le profil du viewer', () => {
    const mixed: CoachSeasonObjective[] = [teamObj, playerObj];
    expect(filterObjectivesForViewer(mixed, { role: 'player', uid: 'p1' })).toHaveLength(2);
    expect(filterObjectivesForViewer(mixed, { role: 'player', uid: 'p2' })).toHaveLength(1);
    expect(filterObjectivesForViewer(mixed, { role: 'player', uid: 'p2' })[0].id).toBe('obj-team');
  });
});

describe('coachEvaluationsService - Création et Chargement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFirebaseConfigured.mockReturnValue(false);
    mockGetDb.mockReturnValue(null);
  });

  it('retourne des listes vides et null sans Firebase configuré', async () => {
    await expect(coachEvaluationsService.listForClub('c1')).resolves.toEqual([]);
    await expect(coachEvaluationsService.listForPlayer('p1')).resolves.toEqual([]);
    await expect(coachEvaluationsService.getLatestForPlayer('p1')).resolves.toBeNull();
  });

  it('rejette create et updateProgressNotes sans Firebase configuré', async () => {
    await expect(
      coachEvaluationsService.create('coach1', 'Coach', {
        club_id: 'c1',
        player_uid: 'p1',
        player_name: 'Joueur',
        context: 'season',
        ratings: { overall: 8 },
      }),
    ).rejects.toThrow('Firebase non configuré');

    await expect(
      coachEvaluationsService.updateProgressNotes('e1', 'Note test'),
    ).rejects.toThrow('Firebase non configuré');
  });

  it('crée une évaluation avec notes normalisées et drapeaux de visibilité quand Firebase est actif', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDb.mockReturnValue({} as never);
    mockAddDoc.mockResolvedValueOnce({ id: 'eval-created-456' } as never);

    const id = await coachEvaluationsService.create('coach-uid-1', 'Coach Thomas', {
      club_id: 'club-123',
      team_id: 'team-seniors',
      player_uid: 'player-789',
      player_name: 'Yanis B.',
      context: 'season',
      ratings: {
        overall: 8.5,
        technical: 9,
        tactical: 8,
        physical: 7.5,
        mental: 8,
      },
      notes: 'Excellent travail aux entraînements.',
      rating_explanation: 'Maintenir l’intensité en fin de match.',
      visible_to_player: true,
      visible_to_parent: true,
    });

    expect(id).toBe('eval-created-456');
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const addedPayload = mockAddDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(addedPayload.club_id).toBe('club-123');
    expect(addedPayload.player_uid).toBe('player-789');
    expect(addedPayload.coach_uid).toBe('coach-uid-1');
    expect(addedPayload.visible_to_player).toBe(true);
    expect(addedPayload.visible_to_parent).toBe(true);
    expect((addedPayload.ratings as Record<string, number>).overall).toBe(8.5);
    expect((addedPayload.ratings as Record<string, number>).technical).toBe(9);
  });

  it('charge et mappe les évaluations d’un joueur via listForPlayer et getLatestForPlayer', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDb.mockReturnValue({} as never);

    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'eval-doc-1',
          data: () => ({
            club_id: 'c1',
            player_uid: 'p1',
            player_name: 'Lucas',
            coach_uid: 'coach-1',
            coach_name: 'Coach',
            context: 'season',
            ratings: { overall: 7.5, technical: 8 },
            notes: 'Bonne régularité',
            visible_to_player: true,
            visible_to_parent: false,
            created_at: { toDate: () => new Date('2026-09-10') },
            updated_at: { toDate: () => new Date('2026-09-10') },
          }),
        },
      ],
    } as never);

    const list = await coachEvaluationsService.listForPlayer('p1');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('eval-doc-1');
    expect(list[0].ratings.overall).toBe(7.5);
    expect(list[0].ratings.technical).toBe(8);
    expect(list[0].visible_to_player).toBe(true);
    expect(list[0].visible_to_parent).toBe(false);
  });
});

describe('coachObjectivesService - Création, Chargement et Progression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFirebaseConfigured.mockReturnValue(false);
    mockGetDb.mockReturnValue(null);
  });

  it('rejette la création si le titre est vide', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDb.mockReturnValue({} as never);

    await expect(
      coachObjectivesService.create('coach-1', {
        club_id: 'c1',
        scope: 'player',
        title: '   ',
      }),
    ).rejects.toThrow('Indiquez un titre d’objectif.');
  });

  it('crée un objectif individuel avec progression bornée', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDb.mockReturnValue({} as never);
    mockAddDoc.mockResolvedValueOnce({ id: 'obj-new-123' } as never);

    const id = await coachObjectivesService.create('coach-1', {
      club_id: 'c1',
      team_id: 't1',
      scope: 'player',
      player_uid: 'p1',
      player_name: 'Thomas',
      title: 'Passes clés par match',
      description: 'Minimum 3 passes clés par rencontre',
      progress: 150, // Doit être plafonné à 100
    });

    expect(id).toBe('obj-new-123');
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const payload = mockAddDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.title).toBe('Passes clés par match');
    expect(payload.progress).toBe(100);
    expect(payload.player_uid).toBe('p1');
    expect(payload.scope).toBe('player');
  });

  it('met à jour la progression d’un objectif via setProgress avec bornage', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDb.mockReturnValue({} as never);
    mockUpdateDoc.mockResolvedValueOnce(undefined);

    await coachObjectivesService.setProgress('obj-1', 75);
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const updatePayload = mockUpdateDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
    expect(updatePayload.progress).toBe(75);
  });

  it('charge la liste des objectifs d’un joueur via listForPlayer', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDb.mockReturnValue({} as never);

    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'obj-doc-1',
          data: () => ({
            club_id: 'c1',
            scope: 'player',
            player_uid: 'p1',
            player_name: 'Lucas',
            title: 'Objectif Vitesse',
            progress: 50,
            created_by: 'coach-1',
            created_at: { toDate: () => new Date('2026-08-01') },
            updated_at: { toDate: () => new Date('2026-08-15') },
          }),
        },
      ],
    } as never);

    const list = await coachObjectivesService.listForPlayer('p1');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('obj-doc-1');
    expect(list[0].title).toBe('Objectif Vitesse');
    expect(list[0].progress).toBe(50);
  });

  it('charge les objectifs collectifs d’équipe via listTeamObjectives', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDb.mockReturnValue({} as never);

    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'team-obj-1',
          data: () => ({
            club_id: 'c1',
            team_id: 't1',
            scope: 'team',
            title: 'Moins de 20 buts concédés',
            progress: 80,
            created_by: 'coach-1',
            created_at: { toDate: () => new Date('2026-08-01') },
            updated_at: { toDate: () => new Date('2026-08-15') },
          }),
        },
      ],
    } as never);

    const teamList = await coachObjectivesService.listTeamObjectives('c1', 't1');
    expect(teamList).toHaveLength(1);
    expect(teamList[0].id).toBe('team-obj-1');
    expect(teamList[0].scope).toBe('team');
    expect(teamList[0].progress).toBe(80);
  });
});
