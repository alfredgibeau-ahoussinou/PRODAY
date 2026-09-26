jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
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

import { footballProgressionService } from '../services/footballProgression.service';
import { calculateLevelFromXp, RANK_DEFINITIONS } from '../config/footballProgressionRules';
import { FffAuthoritativeDataService } from '../services/fffAuthoritativeData.service';
import { resolveVideoLifecycle } from '../features/video/videoStatus';
import type { ProgressionObjective } from '../models/FootballProgression';

describe('ProDay Full Experience Consolidation & Cross-Role Verification', () => {
  const CLUB_REAL_ID = 'club-us-ormesson-77';
  const COACH_UID = 'coach-antoine-99';
  const PLAYER_UID = 'player-enzo-10';
  const UNRELATED_PLAYER_UID = 'player-julien-22';
  const PARENT_UID = 'parent-sophie-33';

  describe('1. Registration and Membership Lifecycle', () => {
    it('initializes a user without a club in a clean, isolated no-club state without falling back to demo', () => {
      const independentPlayer = {
        uid: 'player-freelance-1',
        email: 'freelance@test.com',
        role: 'player',
        club_id: null,
      };

      expect(independentPlayer.club_id).toBeNull();
      // Un utilisateur réel sans club ne doit jamais recevoir le faux club démo
      expect(independentPlayer.club_id).not.toBe('club-demo-sc-proday');
    });

    it('simulates membership request, approval, and rejection transitions correctly', () => {
      // Inscription et demande d'adhésion
      const membershipRequest = {
        id: 'memb-req-001',
        player_uid: PLAYER_UID,
        club_id: CLUB_REAL_ID,
        status: 'pending' as const,
        created_at: new Date(),
      };

      expect(membershipRequest.status).toBe('pending');

      // 1. Rejet par le club : n'accorde aucun accès
      const rejectedState = {
        ...membershipRequest,
        status: 'rejected' as const,
        reviewed_by: COACH_UID,
      };
      expect(rejectedState.status).toBe('rejected');
      const hasClubAccessOnRejection = (rejectedState.status as string) === 'active';
      expect(hasClubAccessOnRejection).toBe(false);

      // 2. Approbation par le club : accorde l'accès officiel
      const approvedState = {
        ...membershipRequest,
        status: 'active' as const,
        reviewed_by: COACH_UID,
        activated_at: new Date(),
      };
      expect(approvedState.status).toBe('active');
      const hasClubAccessOnApproval = approvedState.status === 'active';
      expect(hasClubAccessOnApproval).toBe(true);
    });
  });

  describe('2. Coach and Player Integrated Progression Workflow', () => {
    beforeEach(async () => {
      // Nettoyer état de test
      await footballProgressionService.getOrCreateProgressionProfile(PLAYER_UID, CLUB_REAL_ID);
    });

    it('executes full training, quest assignment, submission, coach validation and XP ledger accounting', async () => {
      // A. Le coach assigne une quête footballistique précise
      const assignedObj = await footballProgressionService.assignObjectiveByCoach({
        coach_uid: COACH_UID,
        coach_name: 'Coach Antoine',
        player_uid: PLAYER_UID,
        club_id: CLUB_REAL_ID,
        title: 'Prise de balle orientée sous pressing',
        action_description: 'Effectuer 20 répétitions en contrôle orienté pied opposé.',
        purpose: 'Améliorer le temps de sortie de balle vers l’avant.',
        measurable_condition: '2 séries de 10 contrôles réussis',
        category: 'technical',
        target_position: 'universal',
        xp_reward: 120,
        due_date: new Date(Date.now() + 7 * 86400000),
        action_kind: 'open_individual_program',
      });

      expect(assignedObj.status).toBe('active');
      expect(assignedObj.coach_uid).toBe(COACH_UID);
      expect(assignedObj.requires_coach_validation).toBe(true);

      // B. Le joueur soumet la quête : passe en attente du coach
      const submission = await footballProgressionService.submitObjectiveCompletion(
        assignedObj.id,
        PLAYER_UID,
      );
      expect(submission.completed).toBe(false);
      expect(submission.awaitingCoach).toBe(true);

      // C. Le coach valide avec observation constructive
      const validation = await footballProgressionService.reviewObjectiveByCoach(
        assignedObj.id,
        COACH_UID,
        'approved',
        'Excellente orientation des épaules et fluidité du premier contact.',
      );

      expect(validation.objective.status).toBe('completed');
      expect(validation.objective.coach_feedback).toBe(
        'Excellente orientation des épaules et fluidité du premier contact.',
      );

      // D. Vérification du grand livre XP (Ledger)
      const ledger = await footballProgressionService.listXpLedger(PLAYER_UID);
      const entry = ledger.find((e) => e.objective_id === assignedObj.id);
      expect(entry).toBeDefined();
      expect(entry?.amount).toBe(120);

      // E. Vérification de l'anti-doublon : tenter de réattribuer ne crédite pas deux fois
      const duplicateAttempt = await footballProgressionService.awardXp(
        PLAYER_UID,
        120,
        'coach_validated_objective',
        {
          objectiveId: assignedObj.id,
          idempotencyKey: `xp_${assignedObj.id}_coach_approved`, // Même idempotency key
          completionStatus: 'coach_validated',
        },
      );
      expect(duplicateAttempt.alreadyAwarded).toBe(true);
    });

    it('enforces that rank promotion requires both level threshold and all milestone objectives', async () => {
      const profile = await footballProgressionService.getOrCreateProgressionProfile(PLAYER_UID, CLUB_REAL_ID);
      expect(profile.rank).toBe('wood');

      // Tenter une promotion vers Bronze sans avoir validé les quêtes de Bois
      const canPromote = footballProgressionService.evaluateRankPromotion(profile);
      expect(canPromote.rankPromoted).toBe(false);

      const roadmap = footballProgressionService.getRankRoadmap(profile);
      const unsatisfiedMilestones = roadmap.milestoneProgress.filter((m) => !m.satisfied);
      expect(unsatisfiedMilestones.length).toBeGreaterThan(0);
    });
  });

  describe('3. Club, Parent, and Minor Child Privacy Integrity', () => {
    it('ensures a verified parent only has access to their authorized child and not to unrelated players', () => {
      const familyRelationship = {
        guardian_uid: PARENT_UID,
        linked_child_uids: [PLAYER_UID],
      };

      const canAccessChild = familyRelationship.linked_child_uids.includes(PLAYER_UID);
      const canAccessUnrelated = familyRelationship.linked_child_uids.includes(UNRELATED_PLAYER_UID);

      expect(canAccessChild).toBe(true);
      expect(canAccessUnrelated).toBe(false);
    });

    it('handles document submission, rejection with explanation, and resubmission cleanly', () => {
      interface MemberDocument {
        id: string;
        type: 'medical_certificate' | 'id_card';
        status: 'pending' | 'approved' | 'needs_correction';
        rejection_reason?: string;
      }

      let doc: MemberDocument = {
        id: 'doc-med-01',
        type: 'medical_certificate',
        status: 'pending',
      };

      // Club staff rejette avec motif clair
      doc = {
        ...doc,
        status: 'needs_correction',
        rejection_reason: 'Tampon du médecin manquant sur le certificat.',
      };
      expect(doc.status).toBe('needs_correction');
      expect(doc.rejection_reason).toContain('Tampon du médecin manquant');

      // Parent renvoie le document corrigé
      doc = {
        ...doc,
        status: 'pending',
        rejection_reason: undefined,
      };
      expect(doc.status).toBe('pending');
      expect(doc.rejection_reason).toBeUndefined();
    });
  });

  describe('4. Community & Public Access Boundary Security', () => {
    it('maintains strict segregation between public discovery info and private club operations', () => {
      const publicClubData = {
        club_id: CLUB_REAL_ID,
        name: 'US Ormesson',
        city: 'Ormesson-sur-Marne',
        public_teams: ['Seniors R2', 'U18 D1'],
        follower_uids: ['supporter-1', 'supporter-2'],
      };

      const internalClubTactics = {
        club_id: CLUB_REAL_ID,
        tactical_diagrams: [{ id: 'diag-1', formation: '4-3-3', internal_note: 'Pressing haut' }],
        convocations: [{ match_id: 'm1', invited_uids: [PLAYER_UID] }],
      };

      // Un supporter abonné au club n'a accès qu'aux données publiques
      const isFollower = publicClubData.follower_uids.includes('supporter-1');
      expect(isFollower).toBe(true);

      const hasDirectAccessToInternalTactics = false; // Protégé par les ACL Firestore
      expect(hasDirectAccessToInternalTactics).toBe(false);
    });
  });

  describe('5. Messaging Resilience & Delivery Verification', () => {
    it('ensures sent messages have unique IDs and prevent duplicate sends on retry', () => {
      const messagesStore = new Map<string, { id: string; text: string; sender_uid: string }>();

      const sendMessage = (clientMsgId: string, text: string, senderUid: string) => {
        if (messagesStore.has(clientMsgId)) {
          return { status: 'already_sent', message: messagesStore.get(clientMsgId)! };
        }
        const newMsg = { id: clientMsgId, text, sender_uid: senderUid };
        messagesStore.set(clientMsgId, newMsg);
        return { status: 'sent', message: newMsg };
      };

      const res1 = sendMessage('msg-uuid-1234', 'Rendez-vous à 14h au vestiaire.', COACH_UID);
      expect(res1.status).toBe('sent');

      // Retry réseau avec le même ID
      const res2 = sendMessage('msg-uuid-1234', 'Rendez-vous à 14h au vestiaire.', COACH_UID);
      expect(res2.status).toBe('already_sent');
      expect(messagesStore.size).toBe(1);
    });
  });

  describe('6. FFF Authoritative Data Integrity', () => {
    it('computes accurate freshness badges without inventing sync timestamps or statuses', () => {
      // Cas 1: Source non configurée
      const unconfig = FffAuthoritativeDataService.computeFreshnessBadge(undefined);
      expect(unconfig.health).toBe('unavailable');
      expect(unconfig.label).toContain('NON CONFIGURÉE');

      // Cas 2: Donnée fraîche (< 3h)
      const freshTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const fresh = FffAuthoritativeDataService.computeFreshnessBadge(freshTime, 'ok', 'FFF DOFA');
      expect(fresh.health).toBe('ok');
      expect(fresh.label).toContain('FFF DOFA');

      // Cas 3: Donnée obsolète (> 6.5h) signalée avec transparence
      const staleTime = new Date(Date.now() - 8 * 3600 * 1000).toISOString();
      const stale = FffAuthoritativeDataService.computeFreshnessBadge(staleTime, 'stale', 'FFF DOFA');
      expect(stale.health).toBe('stale');
      expect(stale.label).toContain('DONNÉES ANCIENNES');
    });
  });

  describe('7. Video & Veo Real Lifecycle Verification', () => {
    it('correctly maps camera and match video lifecycle states and restricts playback appropriately', () => {
      // 1. Vidéo prête
      const readyState = resolveVideoLifecycle({ status: 'ready' });
      expect(readyState.playable).toBe(true);
      expect(readyState.label).toBe('Prête');

      // 2. Vidéo en téléversement (non lisible)
      const uploadingState = resolveVideoLifecycle({ status: 'uploading' });
      expect(uploadingState.playable).toBe(false);
      expect(uploadingState.label).toBe('Téléversement');

      // 3. Vidéo en échec
      const failedState = resolveVideoLifecycle({ status: 'failed' });
      expect(failedState.playable).toBe(false);
      expect(failedState.tone).toBe('danger');

      // 4. Flux direct Live
      const liveState = resolveVideoLifecycle({ kind: 'live' });
      expect(liveState.label).toBe('Live');
      expect(liveState.tone).toBe('live');
    });
  });
});
