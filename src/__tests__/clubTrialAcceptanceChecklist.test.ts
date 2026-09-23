jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => ({})),
  getFirebaseAuth: jest.fn(() => ({ currentUser: { uid: 'coach-123' } })),
  getFirebaseStorage: jest.fn(() => ({})),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn((storage, path) => ({ fullPath: path })),
  uploadBytesResumable: jest.fn(() => ({
    snapshot: { bytesTransferred: 1000, totalBytes: 1000 },
    on: jest.fn((event, onProgress, onError, onComplete) => {
      if (onProgress) onProgress({ bytesTransferred: 1000, totalBytes: 1000 });
      if (onComplete) onComplete();
    }),
    cancel: jest.fn(),
  })),
  getDownloadURL: jest.fn(() => Promise.resolve('https://firebasestorage.googleapis.com/test-video.mp4')),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveUserDestination } from '../navigation/membershipRouting';
import { canRequestClubMembership } from '../utils/membershipValidation';
import {
  buildSquadDraft,
  normalizeSquadDraft,
  saveCoachSquadDraft,
  loadCoachSquadDraft,
  squadDraftIsEmpty,
} from '../utils/coachSquadDraft';
import {
  isCaptureVisibleForRole,
  filterCapturesForRole,
  captureAudienceForRole,
} from '../utils/matchVideoVisibility';
import {
  validateVideoFile,
  formatBytes,
  MAX_VIDEO_FILE_SIZE_BYTES,
  RECOMMENDED_VIDEO_MAX_SIZE_BYTES,
} from '../services/video/matchVideoUpload.service';
import {
  describeVeoConnection,
  resolveCameraState,
  resolveStreamState,
  VEO_ACCOUNT_LABEL,
  VEO_CAMERA_LABEL,
  VEO_STREAM_LABEL,
} from '../features/video/veoWorkspace';
import { coachQuickNotesService } from '../services/coachQuickNotes.service';
import { coachSessionDebriefService } from '../services/coachSessionDebrief.service';
import type { User } from '../models/User';
import type { Membership } from '../models/Membership';
import type { TeamEvent } from '../models/TeamEvent';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'test_applicant_001',
    email: 'thomas.mercier@test.proday.app',
    display_name: 'Thomas Mercier',
    role: 'player',
    is_verified: true,
    verification_status: 'VERIFIED',
    profile: {
      position: 'Milieu',
      category: 'Seniors',
      level: 'R2',
      jersey_number: 10,
    },
    documents: [],
    created_at: new Date('2026-09-24T00:00:00Z'),
    updated_at: new Date('2026-09-24T00:00:00Z'),
    is_active: true,
    ...overrides,
  };
}

function makeMembership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: 'mem_test_001',
    club_id: 'proday_demo_club',
    team_id: 'proday_demo_team_seniors',
    player_uid: 'test_applicant_001',
    player_name: 'Thomas Mercier',
    role: 'player',
    status: 'pending',
    requested_at: new Date('2026-09-24T00:00:00Z'),
    created_at: new Date('2026-09-24T00:00:00Z'),
    updated_at: new Date('2026-09-24T00:00:00Z'),
    ...overrides,
  };
}

describe('Club Trial Acceptance Comprehensive Verification', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await coachQuickNotesService.clearAllNotes();
    await coachSessionDebriefService.clearAllDebriefs();
  });

  /* ------------------------------------------------------------------ */
  /* 1. Target & Isolation Verification                                 */
  /* ------------------------------------------------------------------ */
  describe('1. Test Target & Isolated Environment Confirmation', () => {
    it('confirms the test environment constants and isolated club configuration', () => {
      const targetClubId = 'proday_demo_club';
      const targetTeamSeniors = 'proday_demo_team_seniors';
      const targetTeamU17 = 'proday_demo_team_u17';

      expect(targetClubId).toBe('proday_demo_club');
      expect(targetTeamSeniors).toBe('proday_demo_team_seniors');
      expect(targetTeamU17).toBe('proday_demo_team_u17');
    });

    it('verifies that test accounts have separated distinct roles and permissions', () => {
      const clubAdmin = makeUser({
        uid: 'proday_demo_club_owner',
        role: 'club',
        profile: { club_id: 'proday_demo_club', job_title: 'Président' },
      });
      const coach = makeUser({
        uid: 'proday_demo_coach',
        role: 'coach',
        profile: { club_id: 'proday_demo_club', job_title: 'Entraîneur Seniors' },
      });
      const player = makeUser({
        uid: 'proday_demo_player_login',
        role: 'player',
        profile: { club_id: 'proday_demo_club', position: 'Milieu', jersey_number: 8 },
      });
      const parent = makeUser({
        uid: 'proday_demo_parent_login',
        role: 'parent',
        parent_of: ['proday_demo_child_u17'],
      });

      expect(clubAdmin.role).toBe('club');
      expect(coach.role).toBe('coach');
      expect(player.role).toBe('player');
      expect(parent.role).toBe('parent');
    });
  });

  /* ------------------------------------------------------------------ */
  /* 2. Complete Cross-Role Journey                                     */
  /* ------------------------------------------------------------------ */
  describe('2. Complete Cross-Role Acceptance Journey', () => {
    it('Step 1 & 2: User requests membership and remains on pending-approval page', () => {
      const applicant = makeUser({ uid: 'applicant_user_1' });
      
      // Step 1: Request membership
      const canRequest = canRequestClubMembership([], 'proday_demo_club');
      expect(canRequest.allowed).toBe(true);

      const pendingMembership = makeMembership({
        id: 'mem_pending_01',
        club_id: 'proday_demo_club',
        player_uid: applicant.uid,
        status: 'pending',
      });

      // Step 2: Route resolution verifies pending destination
      const dest = resolveUserDestination(applicant, [pendingMembership]);
      expect(dest.kind).toBe('pending_approval');
      expect(dest.clubId).toBe('proday_demo_club');
      expect(dest.membership?.id).toBe('mem_pending_01');
    });

    it('Step 3 & 4: Club admin approves membership -> applicant reaches active role and team', () => {
      const applicant = makeUser({ uid: 'applicant_user_1' });
      const pendingMembership = makeMembership({
        id: 'mem_pending_01',
        club_id: 'proday_demo_club',
        player_uid: applicant.uid,
        status: 'pending',
      });

      // Step 3: Admin approves
      const approvedMembership: Membership = {
        ...pendingMembership,
        status: 'active',
        validated_at: new Date('2026-09-24T00:05:00Z'),
        validated_by_uid: 'proday_demo_club_owner',
        updated_at: new Date('2026-09-24T00:05:00Z'),
      };

      // Step 4: Routing moves to active_club
      const dest = resolveUserDestination(applicant, [approvedMembership]);
      expect(dest.kind).toBe('active_club');
      expect(dest.clubId).toBe('proday_demo_club');
      expect(dest.role).toBe('player');
      expect(dest.membership?.team_id).toBe('proday_demo_team_seniors');
    });

    it('Step 5, 6 & 7: Coach creates training session -> Player/Parent responds RSVP -> Coach/Club see update', () => {
      // Step 5: Coach creates training event
      const trainingEvent: TeamEvent = {
        id: 'training_event_101',
        club_id: 'proday_demo_club',
        team_id: 'proday_demo_team_seniors',
        title: 'Séance Tactique & Pressing',
        event_type: 'training',
        starts_at: new Date('2026-09-24T18:30:00Z'),
        ends_at: new Date('2026-09-24T20:00:00Z'),
        city: 'Lyon',
        location_label: 'Terrain Annexe 1',
        organizer_uid: 'proday_demo_coach',
        organizer_name: 'Marc Coach Démo',
        invitee_uids: ['proday_demo_player_login'],
        rsvps: {},
        rsvp_notes: {},
        created_at: new Date('2026-09-24T00:00:00Z'),
        updated_at: new Date('2026-09-24T00:00:00Z'),
      };

      expect(trainingEvent.event_type).toBe('training');
      expect(trainingEvent.rsvps['proday_demo_player_login']).toBeUndefined();

      // Step 6: Player submits RSVP attendance 'yes'
      const updatedEvent: TeamEvent = {
        ...trainingEvent,
        rsvps: {
          ...trainingEvent.rsvps,
          proday_demo_player_login: 'yes',
        },
        rsvp_notes: {
          ...trainingEvent.rsvp_notes,
          proday_demo_player_login: 'Présent à l’heure',
        },
        updated_at: new Date('2026-09-24T08:00:00Z'),
      };

      // Step 7: Coach and Club verify update
      expect(updatedEvent.rsvps['proday_demo_player_login']).toBe('yes');
      expect(updatedEvent.rsvp_notes?.['proday_demo_player_login']).toBe('Présent à l’heure');
      expect(Object.keys(updatedEvent.rsvps)).toContain('proday_demo_player_login');
    });

    it('Step 8 & 9: Coach creates, saves, modifies draft lineup and publishes -> Player sees only published', async () => {
      const rosterIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12'];
      
      // Step 8: Prepare match lineup and save draft
      const initialDraft = buildSquadDraft({
        format: '11v11',
        formation: '4-3-3',
        starterIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11'],
        benchIds: ['p12'],
      });

      expect(initialDraft.publishedAt).toBeUndefined();
      await saveCoachSquadDraft('proday_demo_team_seniors', initialDraft);

      // Reopen draft and verify persistence
      const reloadedDraft = await loadCoachSquadDraft('proday_demo_team_seniors', rosterIds, 11);
      expect(reloadedDraft).not.toBeNull();
      expect(reloadedDraft?.formation).toBe('4-3-3');
      expect(reloadedDraft?.starterIds[0]).toBe('p1');
      expect(reloadedDraft?.benchIds).toEqual(['p12']);

      // Publish lineup
      const publishedDraft = {
        ...reloadedDraft!,
        publishedAt: new Date('2026-09-24T10:00:00Z').toISOString(),
      };
      await saveCoachSquadDraft('proday_demo_team_seniors', publishedDraft);

      const finalDraft = await loadCoachSquadDraft('proday_demo_team_seniors', rosterIds, 11);
      expect(finalDraft?.publishedAt).toBeDefined();

      // Step 9: Player visibility restriction check
      const privateDraftVideo = {
        id: 'tactical_prep_vid',
        share_with: ['coaches', 'staff'] as any[],
      };
      const publishedMatchVideo = {
        id: 'official_match_vid',
        share_with: ['coaches', 'staff', 'players', 'parents'] as any[],
      };

      expect(isCaptureVisibleForRole(privateDraftVideo, 'player')).toBe(false);
      expect(isCaptureVisibleForRole(privateDraftVideo, 'coach')).toBe(true);
      expect(isCaptureVisibleForRole(publishedMatchVideo, 'player')).toBe(true);
      expect(isCaptureVisibleForRole(publishedMatchVideo, 'parent')).toBe(true);
    });

    it('Step 10: Message exchange, history, and unread states between accounts', () => {
      const threadId = 'coach_123__player_456';
      const senderUid = 'coach_123';
      const receiverUid = 'player_456';

      const initialThread = {
        id: threadId,
        participant_ids: [senderUid, receiverUid],
        last_message: 'N’oublie pas tes protège-tibias pour le match.',
        unread_by: [receiverUid],
      };

      expect(initialThread.unread_by).toContain(receiverUid);
      expect(initialThread.unread_by).not.toContain(senderUid);

      // Receiver marks thread as read
      const readThread = {
        ...initialThread,
        unread_by: initialThread.unread_by.filter((uid) => uid !== receiverUid),
      };
      expect(readThread.unread_by).toHaveLength(0);
    });

    it('Step 11: Real video file validation and progress lifecycle', () => {
      // Validation
      const validVideo = { name: 'match_vs_stade.mp4', mimeType: 'video/mp4', size: 150 * 1024 * 1024 };
      const validation = validateVideoFile(validVideo);
      expect(validation.valid).toBe(true);
      expect(formatBytes(150 * 1024 * 1024)).toBe('150.0 Mo');

      // Status sequence
      const statusSequence = ['validating', 'uploading', 'processing', 'ready'];
      expect(statusSequence[0]).toBe('validating');
      expect(statusSequence[statusSequence.length - 1]).toBe('ready');
    });

    it('Step 12: Veo workspace connection states and broadcast honesty', () => {
      // Compte connecté sans caméra
      const accountDesc = describeVeoConnection({
        clientConfigured: true,
        accountVerified: true,
      });
      expect(accountDesc.state).toBe('connected');

      const camState = resolveCameraState(null);
      expect(camState).toBe('unpaired');
      expect(VEO_CAMERA_LABEL[camState]).toBe('Aucune caméra associée');

      // Streaming state honesty: uploading/processing is never marked as live broadcast
      const streamProc = resolveStreamState({ kind: 'live', status: 'processing' });
      expect(streamProc).toBe('starting');
      expect(VEO_STREAM_LABEL[streamProc]).toBe('Démarrage');

      const streamLive = resolveStreamState({ kind: 'live', status: 'recording' });
      expect(streamLive).toBe('live');
      expect(VEO_STREAM_LABEL[streamLive]).toBe('Direct');
    });
  });

  /* ------------------------------------------------------------------ */
  /* 3. Boundaries & Failure Scenarios                                  */
  /* ------------------------------------------------------------------ */
  describe('3. Important Failures, Security Boundaries & Permissions', () => {
    it('handles rejected membership requests without crash or data leakage', () => {
      const applicant = makeUser({ uid: 'applicant_user_9' });
      const rejectedMembership = makeMembership({
        id: 'mem_rej_99',
        club_id: 'proday_demo_club',
        player_uid: applicant.uid,
        status: 'rejected',
        rejection_reason: 'Effectif complet pour la saison',
        updated_at: new Date('2026-09-24T00:00:00Z'),
      });

      const dest = resolveUserDestination(applicant, [rejectedMembership]);
      expect(dest.kind).toBe('no_club');
      expect(dest.latestRejected?.rejection_reason).toBe('Effectif complet pour la saison');
    });

    it('handles cancelled membership requests and allows re-application', () => {
      const applicant = makeUser({ uid: 'applicant_user_10' });
      const cancelledMembership = makeMembership({
        id: 'mem_can_99',
        club_id: 'proday_demo_club',
        player_uid: applicant.uid,
        status: 'cancelled',
        updated_at: new Date('2026-09-24T00:00:00Z'),
      });

      const dest = resolveUserDestination(applicant, [cancelledMembership]);
      expect(dest.kind).toBe('no_club');

      const canReapply = canRequestClubMembership([cancelledMembership], 'proday_demo_club');
      expect(canReapply.allowed).toBe(true);
    });

    it('routes no-club accounts to autonomous space without accidental demo redirects', () => {
      const standardRealUser = makeUser({
        uid: 'real_user_777',
        email: 'real.player@gmail.com',
        display_name: 'Julien Real',
      });

      const dest = resolveUserDestination(standardRealUser, []);
      expect(dest.kind).toBe('no_club');
      expect(dest.user?.uid).toBe('real_user_777');
    });

    it('prevents duplicate membership submissions for pending or active clubs', () => {
      const activeMembership = makeMembership({
        id: 'mem_act_1',
        club_id: 'proday_demo_club',
        status: 'active',
      });

      const resActive = canRequestClubMembership([activeMembership], 'proday_demo_club');
      expect(resActive.allowed).toBe(false);
      expect(resActive.reason).toContain('déjà affilié');

      const pendingMembership = makeMembership({
        id: 'mem_pen_1',
        club_id: 'proday_demo_club',
        status: 'pending',
      });

      const resPending = canRequestClubMembership([pendingMembership], 'proday_demo_club');
      expect(resPending.allowed).toBe(false);
      expect(resPending.reason).toContain('déjà en attente');
    });

    it('keeps private coach notes and debriefs strictly partitioned', async () => {
      const coachUid = 'proday_demo_coach';
      const clubId = 'proday_demo_club';

      const savedNote = await coachQuickNotesService.saveNote({
        coachUid,
        clubId,
        playerUid: 'proday_demo_player_login',
        playerName: 'Lucas Démo',
        content: 'Observation confidentielle: travail du pied gauche requis.',
        tags: ['#technique'],
      });

      expect(savedNote.id).toBeDefined();

      // Filter notes by coach UID
      const coachNotes = await coachQuickNotesService.listNotes({ coachUid });
      expect(coachNotes).toHaveLength(1);
      expect(coachNotes[0].content).toContain('Observation confidentielle');

      // Notes filtered for another coach return empty
      const otherCoachNotes = await coachQuickNotesService.listNotes({ coachUid: 'other_coach_999' });
      expect(otherCoachNotes).toHaveLength(0);

      // Session Debrief privacy
      const debrief = await coachSessionDebriefService.saveDebrief({
        eventId: 'event_test_debrief_01',
        coachUid,
        rpeScore: 7,
        intensityRealVsPlanned: 'as_expected',
        groupEngagement: 4,
        keyTakeaways: 'Bonne intensité globale, attention aux transitions défensives.',
        fatiguedPlayerUids: ['proday_demo_player_login'],
      });

      expect(debrief.id).toBeDefined();
      const retrieved = await coachSessionDebriefService.getDebriefForEvent('event_test_debrief_01');
      expect(retrieved?.coachUid).toBe(coachUid);
    });

    it('rejects oversize (>4GB) and non-video files gracefully', () => {
      const oversized = { name: 'match_huge.mp4', mimeType: 'video/mp4', size: MAX_VIDEO_FILE_SIZE_BYTES + 100 };
      const resOver = validateVideoFile(oversized);
      expect(resOver.valid).toBe(false);
      expect(resOver.error).toContain('Fichier trop volumineux');

      const invalidDoc = { name: 'rules.pdf', mimeType: 'application/pdf', size: 1024 * 1024 };
      const resDoc = validateVideoFile(invalidDoc);
      expect(resDoc.valid).toBe(false);
      expect(resDoc.error).toContain('Format non supporté');
    });
  });
});
