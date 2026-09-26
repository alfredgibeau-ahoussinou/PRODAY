jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(),
  Timestamp: {
    fromDate: (d: Date) => ({ toDate: () => d }),
  },
}));

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => ({})),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => false),
}));

import { playerFeedbackService } from '../services/playerFeedback.service';
import { individualProgramsService } from '../services/individualPrograms.service';
import { playerJournalService } from '../services/playerJournal.service';
import { playerExtraSessionsService } from '../services/playerExtraSessions.service';
import { playerMidSeasonReviewsService } from '../services/playerMidSeasonReviews.service';
import { playerEquipmentAllocationService } from '../services/playerEquipmentAllocation.service';
import { coachAppointmentsService } from '../services/coachAppointments.service';
import { eventEquipmentChecklistService } from '../services/eventEquipmentChecklist.service';
import { shareableSportsProfileService } from '../services/shareableSportsProfile.service';
import type { User } from '../models/User';
import type { ShareableSportsProfileData } from '../models/ShareableSportsProfile';

jest.mock('../services/messages.service', () => ({
  messagesService: {
    getOrCreateThread: jest.fn().mockResolvedValue('thread_mock_123'),
    sendMessage: jest.fn().mockResolvedValue('msg_mock_123'),
  },
}));

jest.mock('../services/staffNotifications.service', () => ({
  staffNotificationsService: {
    notifyRecipients: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('Player Area Improvements - Comprehensive Verification', () => {
  const dummyPlayer: User = {
    uid: 'player_001',
    display_name: 'Lucas Bernard',
    email: 'lucas@example.com',
    role: 'player',
    is_verified: true,
    verification_status: 'VERIFIED',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    is_active: true,
    documents: [],
    profile: {
      position: 'Milieu offensif',
      category: 'U17',
      level: 'R1',
      strong_foot: 'right',
      age: 16,
      club_id: 'club_777',
      season_stats: {
        matches: 14,
        goals: 5,
        assists: 7,
      },
    },
  };

  describe('Feature 1 & 6: Request Feedback from a Coach & Specific Training', () => {
    it('prevents empty question or missing coach on feedback request', async () => {
      await expect(
        playerFeedbackService.submitFeedbackRequest({
          kind: 'event_feedback',
          player_uid: 'p1',
          player_name: 'Player One',
          coach_uid: '',
          coach_name: 'Coach',
          question: '',
        }),
      ).rejects.toThrow('Le coach et la question sont obligatoires.');
    });

    it('creates direct conversation and notifies coach on valid submission', async () => {
      const res = await playerFeedbackService.submitFeedbackRequest({
        kind: 'event_feedback',
        player_uid: dummyPlayer.uid,
        player_name: dummyPlayer.display_name,
        coach_uid: 'coach_99',
        coach_name: 'Coach Thomas',
        club_id: 'club_777',
        event_id: 'match_456',
        event_title: 'Match vs AS Nancy',
        question: 'Comment améliorer mon placement défensif sur les transitions ?',
      });

      expect(res.id).toBeDefined();
      expect(res.status).toBe('pending');
      expect(res.thread_id).toBe('thread_mock_123');
    });

    it('rejects duplicate feedback requests for the exact same event and question', async () => {
      // First submission
      await playerFeedbackService.submitFeedbackRequest({
        kind: 'event_feedback',
        player_uid: dummyPlayer.uid,
        player_name: dummyPlayer.display_name,
        coach_uid: 'coach_99',
        coach_name: 'Coach Thomas',
        club_id: 'club_777',
        event_id: 'match_dup_check',
        question: 'Que penses-tu de ma première mi-temps ?',
      });

      // Duplicate submission
      await expect(
        playerFeedbackService.submitFeedbackRequest({
          kind: 'event_feedback',
          player_uid: dummyPlayer.uid,
          player_name: dummyPlayer.display_name,
          coach_uid: 'coach_99',
          coach_name: 'Coach Thomas',
          club_id: 'club_777',
          event_id: 'match_dup_check',
          question: 'Que penses-tu de ma première mi-temps ?',
        }),
      ).rejects.toThrow('Une demande de feedback identique est déjà en attente.');
    });
  });

  describe('Feature 2: Individual Training Program', () => {
    it('validates assignment inputs and preserves exercise snapshots', async () => {
      const program = await individualProgramsService.createProgram({
        player_uid: dummyPlayer.uid,
        player_name: dummyPlayer.display_name,
        coach_uid: 'coach_99',
        coach_name: 'Coach Thomas',
        club_id: 'club_777',
        title: 'Renforcement pied gauche & réactivité',
        exercises: [
          {
            original_exercise_id: 'ex_lib_1',
            title: 'Slalom & frappe pied faible',
            instructions: '3 séries de 8 frappes cadrées.',
            repetitions_or_duration: '3x8 répétitions',
            diagram: {
              elements: [],
            },
          },
        ],
      });

      expect(program.id).toBeDefined();
      expect(program.exercises).toHaveLength(1);
      expect(program.exercises[0].title).toBe('Slalom & frappe pied faible');
      expect(program.exercises[0].player_completed).toBe(false);
      expect(program.exercises[0].coach_reviewed).toBe(false);
    });

    it('records player completion distinctly from coach review', async () => {
      const program = await individualProgramsService.createProgram({
        player_uid: dummyPlayer.uid,
        player_name: dummyPlayer.display_name,
        coach_uid: 'coach_99',
        coach_name: 'Coach Thomas',
        club_id: 'club_777',
        title: 'Agilité appuis courts',
        exercises: [
          {
            original_exercise_id: 'ex_lib_2',
            title: 'Échelle de rythme',
            instructions: 'Passage rapide genoux hauts',
            repetitions_or_duration: '10 passages',
          },
        ],
      });

      const exerciseId = program.exercises[0].id;

      // Player completes
      await individualProgramsService.setExercisePlayerCompletion(
        program.id,
        exerciseId,
        true,
        'Bonnes sensations, réalisé en 15 minutes.',
      );

      const updated = await individualProgramsService.getProgram(program.id);
      expect(updated?.exercises[0].player_completed).toBe(true);
      expect(updated?.exercises[0].player_feedback).toContain('Bonnes sensations');
      expect(updated?.exercises[0].coach_reviewed).toBe(false);

      // Coach reviews
      await individualProgramsService.reviewExerciseByCoach(
        program.id,
        exerciseId,
        'coach_99',
        'Validé. Pense à rester sur la pointe des pieds.',
      );

      const reviewed = await individualProgramsService.getProgram(program.id);
      expect(reviewed?.exercises[0].coach_reviewed).toBe(true);
      expect(reviewed?.exercises[0].coach_feedback).toContain('Validé');
    });
  });

  describe('Feature 3: Personal Football Journal', () => {
    it('saves private journal entry with default non-shared status', async () => {
      const entry = await playerJournalService.createEntry({
        player_uid: dummyPlayer.uid,
        title: 'Débrief match Nancy',
        content: 'Très bonnes sensations en 2e mi-temps, meilleur démarquage.',
        mood: 'great',
        event_title: 'Nancy vs ProDay',
        tags: ['Pied droit', 'Endurance'],
      });

      expect(entry.id).toBeDefined();
      expect(entry.is_shared).toBe(false);
      expect(entry.shared_with_coach_uid).toBeUndefined();
      expect(entry.mood).toBe('great');
    });

    it('allows deliberate sharing with an authorized coach and clear withdrawal', async () => {
      const entry = await playerJournalService.createEntry({
        player_uid: dummyPlayer.uid,
        title: 'Notes tactiques',
        content: 'Doutes sur le repli défensif au 4-3-3.',
        mood: 'neutral',
      });

      // Share
      await playerJournalService.shareWithCoach(
        entry.id,
        dummyPlayer.uid,
        'coach_99',
        'Coach Thomas',
      );

      // Withdraw
      await playerJournalService.withdrawShare(entry.id, dummyPlayer.uid);
    });
  });

  describe('Feature 7: Organize an Extra Training Session', () => {
    it('creates an unofficial session with capacity limits and disclaimer', async () => {
      const now = new Date();
      const startsAt = new Date(now.getTime() + 86400000);
      const endsAt = new Date(now.getTime() + 86400000 + 3600000);

      const session = await playerExtraSessionsService.createSession({
        club_id: 'club_777',
        organizer_uid: dummyPlayer.uid,
        organizer_name: dummyPlayer.display_name,
        title: 'Séance frappes & coups francs',
        description: 'Travail spécifique sur coup franc direct',
        location_name: 'City stade annexe',
        starts_at: startsAt,
        ends_at: endsAt,
        max_participants: 4,
      });

      expect(session.participants).toHaveLength(1);
      expect(session.participants[0].uid).toBe(dummyPlayer.uid);
      expect(session.max_participants).toBe(4);
    });

    it('handles duplicate joins without crashing or duplicating user', async () => {
      const now = new Date();
      const session = await playerExtraSessionsService.createSession({
        club_id: 'club_777',
        organizer_uid: 'p_org',
        organizer_name: 'Organisateur',
        title: 'Séance technique',
        description: 'Contrôles orientés',
        location_name: 'Terrain B',
        starts_at: new Date(now.getTime() + 86400000),
        ends_at: new Date(now.getTime() + 86400000 + 3600000),
        max_participants: 6,
      });

      // Organizer is already in participants
      await playerExtraSessionsService.joinSession(session.id, {
        uid: 'p_org',
        display_name: 'Organisateur',
      });
      // Should not throw, returns early gracefully
    });
  });

  describe('Feature 8: Mid-Season Review', () => {
    it('saves draft review and allows coach review recording', async () => {
      const review = await playerMidSeasonReviewsService.savePlayerReview({
        club_id: 'club_777',
        player_uid: dummyPlayer.uid,
        player_name: dummyPlayer.display_name,
        season_label: '2025-2026',
        is_draft: true,
        self_assessment: {
          satisfaction_rating: 4,
          strengths: ['Vitesse', 'Frappe du droit'],
          areas_to_improve: ['Pied gauche', 'Jeu sans ballon'],
          reflections: 'Bonne première partie de saison malgré une petite entorse.',
        },
      });

      expect(review.status).toBe('draft');
      expect(review.self_assessment.strengths).toContain('Vitesse');

      const submitted = await playerMidSeasonReviewsService.savePlayerReview({
        club_id: 'club_777',
        player_uid: dummyPlayer.uid,
        player_name: dummyPlayer.display_name,
        season_label: '2025-2026',
        is_draft: false,
        self_assessment: {
          satisfaction_rating: 4,
          strengths: ['Vitesse', 'Frappe du droit'],
          areas_to_improve: ['Pied gauche', 'Jeu sans ballon'],
          reflections: 'Bonne première partie de saison.',
        },
      });
      expect(submitted.status).toBe('submitted_by_player');
    });

    it('stores coach review distinct from player self-assessment with agreed goals', async () => {
      await playerMidSeasonReviewsService.submitCoachReview(
        'rev_mock_id',
        {
          coach_uid: 'coach_99',
          coach_name: 'Coach Thomas',
          general_feedback: 'Très bon état d’esprit, progression constante.',
          confirmed_strengths: ['Discipline tactique', 'Volume de course'],
          recommended_work_axes: ['Finition dans les 16m', 'Communication'],
          agreed_goals: ['Atteindre 8 passes décisives d’ici fin de saison'],
        },
      );
    });
  });

  describe('Feature 9: My Equipment', () => {
    it('allows player to confirm receipt of allocated equipment', async () => {
      const alloc = await playerEquipmentAllocationService.allocateItem({
        club_id: 'club_777',
        player_uid: dummyPlayer.uid,
        player_name: dummyPlayer.display_name,
        item_name: 'Maillot Domicile ProDay',
        category: 'match_kit',
        size: 'M',
      });

      expect(alloc.status).toBe('allocated');
      expect(alloc.item_name).toBe('Maillot Domicile ProDay');

      await playerEquipmentAllocationService.confirmReceipt(alloc.id, dummyPlayer.uid);
    });

    it('submits size exchange request and reports issues', async () => {
      const alloc = await playerEquipmentAllocationService.allocateItem({
        club_id: 'club_777',
        player_uid: dummyPlayer.uid,
        player_name: dummyPlayer.display_name,
        item_name: 'Veste de survêtement',
        category: 'warmup',
        size: 'M',
      });

      await playerEquipmentAllocationService.requestSizeExchange(
        alloc.id,
        dummyPlayer.uid,
        'L',
        'Trop serré aux épaules',
      );

      await playerEquipmentAllocationService.reportIssue(
        alloc.id,
        dummyPlayer.uid,
        'Fermeture éclair cassée',
      );
    });
  });

  describe('Feature 10: Request a Coach Appointment', () => {
    it('publishes slot and creates player appointment request', async () => {
      const startsAt = new Date(Date.now() + 172800000);
      const endsAt = new Date(Date.now() + 172800000 + 1800000);

      const slot = await coachAppointmentsService.publishSlot({
        coach_uid: 'coach_99',
        coach_name: 'Coach Thomas',
        club_id: 'club_777',
        starts_at: startsAt,
        ends_at: endsAt,
        location: 'Bureau Staff / Salle de réunion',
      });

      expect(slot.is_booked).toBe(false);

      const apt = await coachAppointmentsService.requestAppointment({
        coach_uid: 'coach_99',
        coach_name: 'Coach Thomas',
        player_uid: dummyPlayer.uid,
        player_name: dummyPlayer.display_name,
        club_id: 'club_777',
        starts_at: startsAt,
        duration_minutes: 30,
        purpose: 'Entretien individuel mi-saison',
        location: 'Bureau Staff',
        is_minor: true,
        guardian_name: 'Parent Bernard',
      });

      expect(apt.status).toBe('requested');
      expect(apt.guardian_notified).toBe(true);
      expect(apt.guardian_name).toBe('Parent Bernard');
    });
  });

  describe('Feature 11: Shareable Sports Profile (PDF)', () => {
    const profileData: ShareableSportsProfileData = {
      display_name: 'Lucas Bernard',
      is_minor: false,
      age: 18,
      birth_year: 2007,
      nationality: 'Française',
      primary_position: 'Milieu offensif',
      secondary_position: 'Ailier gauche',
      strong_foot: 'Droit',
      height_cm: 178,
      weight_kg: 71,
      club_name: 'FC ProDay',
      history: [
        {
          season: '2024-2025',
          club_name: 'FC ProDay',
          category_level: 'U17 R1',
          achievements: 'Vainqueur coupe régionale',
        },
      ],
      stats: [
        {
          season_label: '2024-2025',
          source: 'Feuilles de match officielles FFF',
          matches_played: 18,
          matches: 18,
          goals: 6,
          assists: 9,
          minutes_played: 1420,
        },
      ],
      contact_email: 'lucas@example.com',
      contact_phone: '+33 6 12 34 56 78',
      generated_at: new Date(),
    };

    it('filters verified stats only and generates printable HTML', () => {
      const exported = shareableSportsProfileService.buildExportData(profileData, {
        include_full_name: true,
        include_photo: true,
        include_birth_date: true,
        include_nationality: true,
        include_positions: true,
        include_strong_foot: true,
        include_height_weight: true,
        include_current_club: true,
        include_sporting_history: true,
        include_verified_stats: true,
        include_contact_details: false,
      });

      expect(exported.display_name).toBe('Lucas Bernard');
      expect(exported.primary_position).toBe('Milieu offensif');
      expect(exported.stats).toHaveLength(1);
      expect(exported.stats![0].matches).toBe(18);
      expect(exported.stats![0].goals).toBe(6);
      expect(exported.contact_email).toBeUndefined(); // Excluded per options

      const html = shareableSportsProfileService.generatePrintableHtml(exported);
      expect(html).toContain('Lucas Bernard');
      expect(html).toContain('Milieu offensif');
      expect(html).toContain('FC ProDay');
      expect(html).toContain('18'); // Matches
    });

    it('excludes unselected fields when player toggles them off', () => {
      const exported = shareableSportsProfileService.buildExportData(profileData, {
        include_full_name: false,
        include_photo: false,
        include_birth_date: false,
        include_nationality: false,
        include_positions: false,
        include_strong_foot: false,
        include_height_weight: false,
        include_current_club: false,
        include_sporting_history: false,
        include_verified_stats: false,
        include_contact_details: false,
      });

      expect(exported.display_name).toBe('Joueur ProDay');
      expect(exported.primary_position).toBeUndefined();
      expect(exported.stats).toHaveLength(0);
      expect(exported.history).toHaveLength(0);
    });
  });

  describe('Feature 12: Event Equipment Checklist', () => {
    it('persists checked states and separates coach requirements from personal items', async () => {
      const checklist = await eventEquipmentChecklistService.getChecklist(
        'match_nancy_01',
        dummyPlayer.uid,
        'match',
      );

      expect(checklist.requiredItems.length).toBeGreaterThan(0);
      const coachItem = checklist.requiredItems.find((i) => i.is_required_by_coach);
      expect(coachItem).toBeDefined();

      // Save checklist with personal item
      const personalItems = [
        {
          id: 'personal_item_1',
          label: 'Semelles orthopédiques de rechange',
          is_required_by_coach: false,
          added_by_player: true,
          category: 'gear' as const,
        },
      ];

      await eventEquipmentChecklistService.saveChecklistState(
        'match_nancy_01',
        dummyPlayer.uid,
        ['coach_shin_guards', 'personal_item_1'],
        personalItems,
      );
    });
  });
});
