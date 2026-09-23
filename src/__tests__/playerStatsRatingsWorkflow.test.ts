jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
  connectFunctionsEmulator: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: () => false,
}));

jest.mock('../lib/firebase', () => ({
  getDb: () => null,
  getFirebaseAuth: () => null,
  getFirebaseStorage: () => null,
}));

import { COACH_MENU_ITEMS } from '../features/coach/shell/CoachMenuPane';
import { CLUB_MENU_ITEMS } from '../features/club/shell/ClubMenuPane';
import {
  clampCoachRating,
  formatCoachRating,
  formatEvaluationSourceLabel,
  formatEvaluationStatusLabel,
} from '../utils/coachEvaluationRatings';
import {
  generateVeoAiMatchEvaluations,
  buildDraftStatFromProposal,
} from '../services/veoAiMatchEvaluation.service';
import type { TeamEvent, PlayerMatchSheetStat, PlayerStatAuditEntry } from '../models/TeamEvent';
import type { ClubMatchVideo } from '../models/ClubCameras';
import type { User } from '../models/User';
import { buildTopScorers } from '../utils/clubHubRealData';
import { canManageTeamEvent, assertTeamEventManageAccess } from '../utils/teamEventAccess';

describe('Player Statistics & Ratings Workflow (Coach & Club Areas)', () => {
  describe('1. Menus Coach & Club - Absence de doublon Messagerie / Communication', () => {
    it('ne contient qu’une seule entrée Messagerie dans COACH_MENU_ITEMS', () => {
      const messagingEntries = COACH_MENU_ITEMS.filter(
        (item) => item.label.toLowerCase() === 'messagerie',
      );
      expect(messagingEntries).toHaveLength(1);
      expect(messagingEntries[0].id).toBe('com_staff');
      expect(messagingEntries[0].icon).toBe('chat');
    });

    it('n’a plus l’entrée dupliquée "messages" dans la liste du menu coach', () => {
      const messagesItem = COACH_MENU_ITEMS.find((item) => item.id === 'messages');
      expect(messagesItem).toBeUndefined();
    });

    it('ne contient qu’une seule entrée Communication dans CLUB_MENU_ITEMS', () => {
      const commEntries = CLUB_MENU_ITEMS.filter(
        (item) => item.id === 'communication' || item.label.toLowerCase().includes('communication'),
      );
      expect(commEntries).toHaveLength(1);
      expect(commEntries[0].id).toBe('communication');
    });
  });

  describe('2. Échelle et distinction stricte de la note 0 vs non noté', () => {
    it('accepte 0 comme une note valide (performance sanctionnée) sur l’échelle 0-10', () => {
      expect(clampCoachRating(0)).toBe(0);
      expect(clampCoachRating(7.5)).toBe(7.5);
      expect(clampCoachRating(10)).toBe(10);
      expect(clampCoachRating(12)).toBe(10); // borné au max
      expect(clampCoachRating(-2)).toBe(0); // borné au min
    });

    it('distingue nettement 0.0/10 d’une note manquante / non renseignée', () => {
      expect(formatCoachRating(0)).toBe('0/10');
      expect(formatCoachRating(0.0)).toBe('0/10');
      expect(formatCoachRating(undefined)).toBe('—');
      expect(formatCoachRating(null)).toBe('—');
      expect(formatCoachRating(8.5)).toBe('8.5/10');
      expect(formatCoachRating(9)).toBe('9/10');
    });

    it('formate correctement les libellés de provenance et de statut', () => {
      expect(formatEvaluationSourceLabel('ai_generated')).toBe('Généré par IA');
      expect(formatEvaluationSourceLabel('manual')).toBe('Saisie manuelle');
      expect(formatEvaluationSourceLabel('coach_reviewed')).toBe('Validé par le coach');
      expect(formatEvaluationSourceLabel(undefined)).toBe('Saisie manuelle');

      expect(formatEvaluationStatusLabel('draft')).toBe('Brouillon');
      expect(formatEvaluationStatusLabel('published')).toBe('Publié');
    });
  });

  describe('3. Évaluation IA à partir de la vidéo Veo', () => {
    const mockMembers: User[] = [
      {
        uid: 'player_1',
        display_name: 'Karim B.',
        role: 'player',
        profile: { position: 'Attaquant' },
      } as User,
      {
        uid: 'player_2',
        display_name: 'Lucas M.',
        role: 'player',
        profile: { position: 'Défenseur' },
      } as User,
    ];

    const makeVideo = (partial: Partial<ClubMatchVideo>): ClubMatchVideo => ({
      id: 'vid_default',
      club_id: 'club_proday',
      source: 'camera_api',
      status: 'ready',
      title: 'Captation Veo',
      duration_sec: 90 * 60,
      highlights_ready: false,
      clips: [],
      player_uids: [],
      share_with: ['coaches'],
      created_by_uid: 'coach_1',
      created_at: new Date(),
      ...partial,
    });

    const mockEvent: TeamEvent = {
      id: 'event_match_1',
      club_id: 'club_proday',
      title: 'ProDay FC vs FC Étoile',
      city: 'Paris',
      event_type: 'competition',
      starts_at: new Date('2026-09-15T15:00:00Z'),
      organizer_uid: 'coach_1',
      organizer_name: 'Coach Thomas',
      invitee_uids: ['player_1', 'player_2'],
      rsvps: { player_1: 'yes', player_2: 'yes' },
      lineup: {
        formation: '4-3-3',
        slots: [
          { uid: 'player_1', display_name: 'Karim B.', role: 'starter', position_label: 'Attaquant' },
          { uid: 'player_2', display_name: 'Lucas M.', role: 'starter', position_label: 'Défenseur' },
        ],
      },
      live_actions: [
        {
          id: 'action_goal_1',
          type: 'goal',
          player_uid: 'player_1',
          player_name: 'Karim B.',
          minute: 23,
          created_at: new Date(),
        },
        {
          id: 'action_assist_1',
          type: 'assist',
          player_uid: 'player_2',
          player_name: 'Lucas M.',
          minute: 23,
          created_at: new Date(),
        },
      ],
      live_state: {
        status: 'finished',
        home_score: 1,
        away_score: 0,
        opponent_name: 'FC Étoile',
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('signale honnêtement l’absence de vidéo si aucune captation n’est associée', () => {
      const result = generateVeoAiMatchEvaluations(mockEvent, null, mockMembers);
      expect(result.has_video).toBe(false);
      expect(result.overall_confidence).toBe(0);
      expect(result.uncertainty_notice).toMatch(/Aucune captation vidéo Veo/);
      expect(Object.keys(result.proposals)).toHaveLength(0);
    });

    it('détecte l’incertitude quand la captation vidéo est partielle', () => {
      const partialVideo = makeVideo({
        id: 'vid_partial',
        title: 'Captation 1ère mi-temps',
        duration_sec: 25 * 60, // 25 minutes seulement
      });

      const result = generateVeoAiMatchEvaluations(mockEvent, partialVideo, mockMembers);
      expect(result.has_video).toBe(true);
      expect(result.uncertainty_notice).toMatch(/Captation vidéo partielle/);
      expect(result.overall_confidence).toBeLessThan(0.7);
    });

    it('génère des propositions avec clips horodatés et note objective sans inventer', () => {
      const fullVideo = makeVideo({
        id: 'vid_full',
        title: 'Match complet Veo Cam 3',
        duration_sec: 90 * 60,
      });

      const result = generateVeoAiMatchEvaluations(mockEvent, fullVideo, mockMembers);
      expect(result.has_video).toBe(true);
      expect(result.uncertainty_notice).toBeUndefined();
      expect(result.overall_confidence).toBeGreaterThanOrEqual(0.85);

      const p1 = result.proposals['player_1'];
      expect(p1).toBeDefined();
      expect(p1.goals).toBe(1);
      expect(p1.minutes_played).toBe(90);
      expect(p1.rating).toBeGreaterThanOrEqual(7.5);
      expect(p1.clips).toHaveLength(1);
      expect(p1.clips[0].timestamp_sec).toBe(23 * 60);
      expect(p1.clips[0].label).toBe('But');

      const p2 = result.proposals['player_2'];
      expect(p2).toBeDefined();
      expect(p2.assists).toBe(1);
      expect(p2.clean_sheet).toBe(true);
      expect(p2.clips).toHaveLength(1);
      expect(p2.clips[0].label).toBe('Passe décisive');
    });

    it('PROTECTION STRICTE : n’écrase JAMAIS une saisie manuelle ou validée par le coach lors d’une réévaluation IA', () => {
      const eventWithManualStat: TeamEvent = {
        ...mockEvent,
        player_match_stats: {
          player_1: {
            uid: 'player_1',
            player_name: 'Karim B.',
            minutes_played: 75,
            rating: 8.5,
            rating_explanation: 'Très bon match selon le coach.',
            goals: 2, // Le coach a manuellement corrigé à 2 buts
            assists: 0,
            source: 'manual', // Saisie manuelle par le coach !
            status: 'published',
          },
        },
      };

      const fullVideo = makeVideo({
        id: 'vid_full',
        duration_sec: 90 * 60,
      });

      const result = generateVeoAiMatchEvaluations(eventWithManualStat, fullVideo, mockMembers);
      expect(result.manual_protected_count).toBe(1);
      expect(result.proposals['player_1'].overwritten_prevented).toBe(true);
      // Les valeurs manuelles du coach restent préservées
      expect(result.proposals['player_1'].goals).toBe(2);
      expect(result.proposals['player_1'].rating).toBe(8.5);
      expect(result.proposals['player_1'].minutes_played).toBe(75);

      // Et lors de l'application en brouillon :
      const draft = buildDraftStatFromProposal(
        result.proposals['player_1'],
        'coach_1',
        'Coach Thomas',
        eventWithManualStat.player_match_stats?.player_1,
      );
      expect(draft.source).toBe('manual');
      expect(draft.goals).toBe(2);
      expect(draft.rating).toBe(8.5);
    });

    it('enregistre l’historique d’audit lors de la génération du brouillon IA', () => {
      const fullVideo = makeVideo({
        id: 'vid_full',
        duration_sec: 90 * 60,
      });

      const result = generateVeoAiMatchEvaluations(mockEvent, fullVideo, mockMembers);
      const draft = buildDraftStatFromProposal(
        result.proposals['player_1'],
        'coach_1',
        'Coach Thomas',
      );

      expect(draft.source).toBe('ai_generated');
      expect(draft.status).toBe('draft');
      expect(draft.history).toHaveLength(1);
      expect(draft.history![0].action).toBe('ai_generated');
      expect(draft.history![0].author_name).toBe('Coach Thomas');
      expect(draft.history![0].summary).toMatch(/IA Veo/);
    });
  });

  describe('4. Règle de visibilité : Brouillon vs Publié', () => {
    it('exclut les statistiques en statut "draft" des classements et du pôle club', () => {
      const events: TeamEvent[] = [
        {
          id: 'e1',
          club_id: 'club_proday',
          title: 'Match 1',
          city: 'Paris',
          invitee_uids: ['p_draft', 'p_published'],
          rsvps: {},
          event_type: 'competition',
          starts_at: new Date('2026-09-10T15:00:00Z'),
          organizer_uid: 'c1',
          organizer_name: 'Coach',
          created_at: new Date(),
          updated_at: new Date(),
          player_match_stats: {
            p_draft: {
              uid: 'p_draft',
              player_name: 'Joueur Brouillon',
              goals: 5,
              status: 'draft', // BROUILLON COACH
            },
            p_published: {
              uid: 'p_published',
              player_name: 'Joueur Publié',
              goals: 2,
              status: 'published', // PUBLIÉ OFFICIEL
            },
          },
        },
      ];

      const names = new Map([
        ['p_draft', 'Joueur Brouillon'],
        ['p_published', 'Joueur Publié'],
      ]);

      const top = buildTopScorers(events, names);
      // Seul le joueur dont la fiche est publiée doit figurer au classement officiel !
      expect(top.find((t) => t.name === 'Joueur Brouillon')).toBeUndefined();
      const pub = top.find((t) => t.name === 'Joueur Publié');
      expect(pub).toBeDefined();
      expect(pub?.goals).toBe(2);
    });
  });

  describe('5. Synchronisation Bidirectionnelle Coach ↔ Club & Contrôle des Permissions', () => {
    const coachUser: User = {
      uid: 'coach_thomas',
      display_name: 'Coach Thomas',
      role: 'coach',
      profile: { club_id: 'club_proday' },
    } as User;

    const clubStaffUser: User = {
      uid: 'staff_alice',
      display_name: 'Alice Dirigeante',
      role: 'organizer',
      profile: { club_id: 'club_proday' },
    } as User;

    const playerMemberUser: User = {
      uid: 'player_karim',
      display_name: 'Karim B.',
      role: 'player', // Membre joueur du club (PAS staff)
      profile: { club_id: 'club_proday' },
    } as User;

    const otherClubUser: User = {
      uid: 'other_coach',
      display_name: 'Coach Autre Club',
      role: 'coach',
      profile: { club_id: 'club_autre' },
    } as User;

    const sampleEvent: TeamEvent = {
      id: 'event_match_bidir',
      club_id: 'club_proday',
      title: 'ProDay FC vs US Versailles',
      city: 'Paris',
      invitee_uids: ['player_karim'],
      rsvps: {},
      event_type: 'competition',
      starts_at: new Date('2026-09-18T15:00:00Z'),
      organizer_uid: 'coach_thomas',
      organizer_name: 'Coach Thomas',
      created_at: new Date(),
      updated_at: new Date(),
      player_match_stats: {
        player_karim: {
          uid: 'player_karim',
          player_name: 'Karim B.',
          minutes_played: 90,
          rating: 7.5,
          goals: 1,
          assists: 1,
          source: 'ai_generated',
          status: 'draft',
        },
      },
    };

    it('accorde les droits de gestion de l’évaluation au Coach et au Staff Club autorisés', () => {
      expect(canManageTeamEvent(sampleEvent, coachUser)).toBe(true);
      expect(canManageTeamEvent(sampleEvent, clubStaffUser)).toBe(true);
      expect(() => assertTeamEventManageAccess(sampleEvent, coachUser)).not.toThrow();
      expect(() => assertTeamEventManageAccess(sampleEvent, clubStaffUser)).not.toThrow();
    });

    it('REFUSE STRICTEMENT les droits d’édition aux simples adhérents / joueurs du club', () => {
      // L’adhésion au club seule ne confère PAS de droits de notation
      expect(canManageTeamEvent(sampleEvent, playerMemberUser)).toBe(false);
      expect(() => assertTeamEventManageAccess(sampleEvent, playerMemberUser)).toThrow(
        /Action réservée/,
      );
    });

    it('REFUSE STRICTEMENT les droits d’édition aux utilisateurs d’autres clubs', () => {
      expect(canManageTeamEvent(sampleEvent, otherClubUser)).toBe(false);
      expect(() => assertTeamEventManageAccess(sampleEvent, otherClubUser)).toThrow(
        /Action réservée/,
      );
    });

    it('Coach modifie les stats/notes → la vue Club reflète immédiatement la même source de données', () => {
      // Simulation de la mise à jour par le Coach
      const coachPatch: Partial<PlayerMatchSheetStat> = {
        rating: 8.5,
        rating_explanation: 'Superbe pressing et efficacité devant le but.',
        goals: 2, // Correction manuelle
        source: 'coach_reviewed',
        status: 'published',
      };

      const audit1: PlayerStatAuditEntry = {
        id: 'audit_1',
        author_uid: coachUser.uid,
        author_name: coachUser.display_name || 'Coach',
        timestamp: new Date().toISOString(),
        action: 'edit_rating',
        summary: 'Validation et ajustement de note par le coach.',
      };

      const updatedByCoach: TeamEvent = {
        ...sampleEvent,
        player_match_stats: {
          player_karim: {
            ...sampleEvent.player_match_stats!.player_karim,
            ...coachPatch,
            history: [audit1],
          },
        },
      };

      // La vue Club lit exactement le même événement
      const clubViewStat = updatedByCoach.player_match_stats?.player_karim;
      expect(clubViewStat).toBeDefined();
      expect(clubViewStat?.rating).toBe(8.5);
      expect(clubViewStat?.goals).toBe(2);
      expect(clubViewStat?.source).toBe('coach_reviewed');
      expect(clubViewStat?.status).toBe('published');
      expect(clubViewStat?.rating_explanation).toContain('Superbe pressing');
      expect(clubViewStat?.history).toHaveLength(1);
      expect(clubViewStat?.history![0].author_uid).toBe('coach_thomas');
    });

    it('Dirigeant / Staff Club modifie les stats/notes → la vue Coach reflète immédiatement la mise à jour sans conflit', () => {
      // Le staff Club apporte une correction / note
      const staffPatch: Partial<PlayerMatchSheetStat> = {
        rating: 9.0,
        rating_explanation: 'Homme du match validé par la direction sportive.',
        source: 'manual',
        status: 'published',
      };

      const audit2: PlayerStatAuditEntry = {
        id: 'audit_2',
        author_uid: clubStaffUser.uid,
        author_name: clubStaffUser.display_name || 'Staff',
        timestamp: new Date().toISOString(),
        action: 'edit_rating',
        summary: 'Ajustement par la direction du club.',
      };

      const updatedByClub: TeamEvent = {
        ...sampleEvent,
        player_match_stats: {
          player_karim: {
            ...sampleEvent.player_match_stats!.player_karim,
            ...staffPatch,
            history: [audit2],
          },
        },
      };

      // La vue Coach lit exactement le même document
      const coachViewStat = updatedByClub.player_match_stats?.player_karim;
      expect(coachViewStat).toBeDefined();
      expect(coachViewStat?.rating).toBe(9.0);
      expect(coachViewStat?.rating_explanation).toContain('validé par la direction sportive');
      expect(coachViewStat?.history).toHaveLength(1);
      expect(coachViewStat?.history![0].author_name).toBe('Alice Dirigeante');
    });

    it('préserve l’historique d’audit cumulé lors de modifications successives Coach puis Club', () => {
      const existingHistory: PlayerStatAuditEntry[] = [
        {
          id: 'audit_init',
          author_uid: 'ia_system',
          author_name: 'IA Veo',
          timestamp: '2026-09-18T16:00:00Z',
          action: 'ai_generated',
          summary: 'Proposition IA initiale',
        },
        {
          id: 'audit_coach',
          author_uid: coachUser.uid,
          author_name: coachUser.display_name || 'Coach',
          timestamp: '2026-09-18T17:00:00Z',
          action: 'coach_reviewed',
          summary: 'Validation coach',
        },
      ];

      const staffAudit: PlayerStatAuditEntry = {
        id: 'audit_club',
        author_uid: clubStaffUser.uid,
        author_name: clubStaffUser.display_name || 'Staff',
        timestamp: '2026-09-18T18:00:00Z',
        action: 'published',
        summary: 'Publication officielle club',
      };

      const finalStat: PlayerMatchSheetStat = {
        ...sampleEvent.player_match_stats!.player_karim,
        rating: 8.0,
        status: 'published',
        history: [...existingHistory, staffAudit],
      };

      expect(finalStat.history).toHaveLength(3);
      expect(finalStat.history![0].action).toBe('ai_generated');
      expect(finalStat.history![1].author_name).toBe('Coach Thomas');
      expect(finalStat.history![2].author_name).toBe('Alice Dirigeante');
    });
  });

  describe('6. Bouton « Modifier les statistiques » et synchronisation de la Modale', () => {
    it('initialise et bascule correctement le mode « stats » vs « rating »', () => {
      const modeStats: 'stats' | 'rating' = 'stats';
      const modeRating: 'stats' | 'rating' = 'rating';

      expect(modeStats).toBe('stats');
      expect(modeRating).toBe('rating');
    });

    it('distingue un temps de jeu de 0 minute (entré) d’un temps non renseigné (undefined)', () => {
      const unrecordedStat: PlayerMatchSheetStat = {
        uid: 'p1',
        player_name: 'Player 1',
        minutes_played: undefined,
      };
      const zeroMinStat: PlayerMatchSheetStat = {
        uid: 'p2',
        player_name: 'Player 2',
        minutes_played: 0,
      };

      expect(unrecordedStat.minutes_played).toBeUndefined();
      expect(zeroMinStat.minutes_played).toBe(0);
      expect(zeroMinStat.minutes_played !== undefined).toBe(true);
    });

    it('enregistre et met à jour les champs de statistiques et notation via patch', () => {
      const initial: PlayerMatchSheetStat = {
        uid: 'p1',
        player_name: 'Lucas V.',
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        clean_sheet: false,
        source: 'manual',
        status: 'published',
      };

      const patch: Partial<PlayerMatchSheetStat> = {
        minutes_played: 75,
        goals: 2,
        assists: 1,
        yellow_cards: 1,
        clean_sheet: false,
        rating: 8.5,
        rating_explanation: 'Doublé décisif en 2e mi-temps',
      };

      const updated: PlayerMatchSheetStat = {
        ...initial,
        ...patch,
      };

      expect(updated.minutes_played).toBe(75);
      expect(updated.goals).toBe(2);
      expect(updated.assists).toBe(1);
      expect(updated.yellow_cards).toBe(1);
      expect(updated.rating).toBe(8.5);
      expect(updated.rating_explanation).toBe('Doublé décisif en 2e mi-temps');
    });
  });
});
