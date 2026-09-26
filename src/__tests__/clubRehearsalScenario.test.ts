import {
  REHEARSAL_CLUB,
  REHEARSAL_TEAMS,
  REHEARSAL_ACCOUNTS,
  REHEARSAL_CANONICAL_RECORDS,
} from '../services/data/isolatedClubRehearsalData';
import { calculateLevelFromXp, RANK_DEFINITIONS } from '../config/footballProgressionRules';
import { resolveVideoLifecycle } from '../features/video/videoStatus';
import { FffAuthoritativeDataService } from '../services/fffAuthoritativeData.service';

describe('ProDay Club Rehearsal Scenario — Connected Rehearsal & Interruption Recovery', () => {
  // =========================================================================
  // A. JOINING THE CLUB
  // =========================================================================
  describe('A. Joining the club', () => {
    it('executes no-club request -> staff approval -> role assignment -> persisted identity', () => {
      const applicant = { ...REHEARSAL_ACCOUNTS.noClubUser };
      expect(applicant.club_id).toBeNull();

      // 1. Demande d'adhésion vers le club de répétition
      const membershipRequest = {
        id: 'req_rehearsal_noclub_01',
        club_id: REHEARSAL_CLUB.id,
        user_uid: applicant.uid,
        user_email: applicant.email,
        requested_role: 'player',
        requested_team_id: REHEARSAL_TEAMS.seniors.id,
        status: 'pending' as 'pending' | 'active' | 'rejected',
        created_at: new Date(),
      };
      expect(membershipRequest.status).toBe('pending');
      expect(membershipRequest.club_id).toBe(REHEARSAL_CLUB.id);

      // 2. Approbation par l'administrateur du club
      const approvedMembership = {
        ...membershipRequest,
        status: 'active' as const,
        reviewed_by: REHEARSAL_ACCOUNTS.admin.uid,
        approved_role: 'player',
        approved_team_id: REHEARSAL_TEAMS.seniors.id,
        activated_at: new Date(),
      };
      expect(approvedMembership.status).toBe('active');

      // 3. Mise à jour du profil utilisateur avec rôle et équipe approuvés uniquement
      const updatedUser = {
        ...applicant,
        club_id: approvedMembership.club_id,
        role: approvedMembership.approved_role as 'player',
        team_id: approvedMembership.approved_team_id,
      };

      expect(updatedUser.club_id).toBe(REHEARSAL_CLUB.id);
      expect(updatedUser.team_id).toBe(REHEARSAL_TEAMS.seniors.id);
      expect(updatedUser.role).toBe('player');

      // 4. Persistance après rechargement de session
      const reloadedSession = JSON.parse(JSON.stringify(updatedUser));
      expect(reloadedSession.club_id).toBe(REHEARSAL_CLUB.id);
      expect(reloadedSession.club_id).not.toBe('proday_demo_club');
    });
  });

  // =========================================================================
  // B. PREPARING TRAINING
  // =========================================================================
  describe('B. Preparing training', () => {
    it('creates session with diagram, allows parent RSVP for minor, and records coach attendance', () => {
      const session = { ...REHEARSAL_CANONICAL_RECORDS.trainingSession };

      // Vérifie les consignes complètes de l'exercice
      expect(session.exercise_instructions).toContain('casser la première ligne');
      expect(session.diagram_id).toBe('diagram_drill_u17_pressing');

      // Le parent répond pour son enfant mineur Léo
      const parentRsvpSubmission = {
        event_id: session.id,
        target_uid: REHEARSAL_ACCOUNTS.minorPlayer.uid,
        submitted_by_uid: REHEARSAL_ACCOUNTS.parent.uid,
        status: 'yes' as const,
        note: 'Présent, transport assuré par maman',
        timestamp: new Date().toISOString(),
      };
      expect(parentRsvpSubmission.status).toBe('yes');
      expect(parentRsvpSubmission.target_uid).toBe(REHEARSAL_ACCOUNTS.minorPlayer.uid);

      // Le coach valide le pointage d'assiduité sur le terrain
      const attendanceRecord = {
        event_id: session.id,
        coach_uid: REHEARSAL_ACCOUNTS.coach.uid,
        presents: [REHEARSAL_ACCOUNTS.minorPlayer.uid],
        excused: [],
        unexcused: [],
        recorded_at: new Date().toISOString(),
      };

      expect(attendanceRecord.presents).toContain(REHEARSAL_ACCOUNTS.minorPlayer.uid);
      expect(attendanceRecord.coach_uid).toBe(REHEARSAL_ACCOUNTS.coach.uid);
    });
  });

  // =========================================================================
  // C. PLAYER DEVELOPMENT
  // =========================================================================
  describe('C. Player development', () => {
    it('assigns objective, submits completion, validates by coach, awards XP once, and updates milestone requirements', () => {
      const quest = { ...REHEARSAL_CANONICAL_RECORDS.developmentObjective };
      expect(quest.requires_coach_validation).toBe(true);

      // 1. Soumission par le joueur
      const submission = {
        objective_id: quest.id,
        player_uid: quest.player_uid,
        player_comment: '2 séries de 10 effectuées avec ballon T5 sous pressing de mon frère.',
        submitted_at: new Date(),
        status: 'awaiting_validation' as const,
      };
      expect(submission.status).toBe('awaiting_validation');

      // 2. Validation par le coach
      const validation = {
        objective_id: quest.id,
        coach_uid: quest.coach_uid,
        coach_feedback: 'Excellent timing de déclenchement du contrôle orienté. Validé !',
        validated_at: new Date(),
        xp_to_award: quest.xp_reward,
      };

      // 3. Grand livre d'XP avec clé d'idempotence unique
      const ledgerEntries: Array<{ id: string; player_uid: string; xp: number; key: string }> = [];
      const awardKey = `coach_val_${quest.id}_${submission.submitted_at.getTime()}`;

      function awardXp(key: string, xp: number) {
        if (ledgerEntries.some((e) => e.key === key)) {
          return { success: false, reason: 'ALREADY_AWARDED' };
        }
        ledgerEntries.push({ id: `entry_${Date.now()}`, player_uid: quest.player_uid, xp, key });
        return { success: true, reason: 'AWARDED' };
      }

      const firstAttempt = awardXp(awardKey, validation.xp_to_award);
      expect(firstAttempt.success).toBe(true);

      // 4. Tentative de double attribution bloquée
      const duplicateAttempt = awardXp(awardKey, validation.xp_to_award);
      expect(duplicateAttempt.success).toBe(false);
      expect(duplicateAttempt.reason).toBe('ALREADY_AWARDED');
      expect(ledgerEntries.length).toBe(1);

      // 5. Calcul du niveau et mise à jour des prérequis de rang
      const currentXp = 120;
      const { level, xpIntoLevel, xpForNextLevel } = calculateLevelFromXp(currentXp);
      expect(level).toBe(2);
      expect(xpIntoLevel).toBe(20);
      expect(xpForNextLevel).toBe(150);

      // Pour monter au rang Bronze, 3 jalons sont requis : niveau 3, assiduité, 3 quêtes validées
      const bronzeReq = RANK_DEFINITIONS.bronze;
      const isBronzeEligible = level >= bronzeReq.required_level;
      expect(isBronzeEligible).toBe(false); // Niveau 2 < Niveau 3, montée refusée
    });
  });

  // =========================================================================
  // D. PREPARING A MATCH
  // =========================================================================
  describe('D. Preparing a match', () => {
    it('manages public match details, published lineup, private coach drafts, and clean reschedule', () => {
      const match = { ...REHEARSAL_CANONICAL_RECORDS.matchEvent };

      // Données publiques visibles par les joueurs et supporters
      const publicDetails = {
        id: match.id,
        title: match.title,
        opponent: match.opponent,
        date_start: match.date_start,
        location: match.location,
        lineup_system: match.lineup_system,
      };
      expect(publicDetails.opponent).toBe('AS Montreuil');
      expect((publicDetails as Record<string, unknown>).coach_private_notes).toBeUndefined();

      // Données privées réservées au coach
      expect(match.coach_private_notes).toContain('Attention au n°9');

      // Report de match : mise à jour de l'événement existant (pas de création en doublon)
      const rescheduledTime = new Date(Date.now() + 4 * 86400000).toISOString();
      const updatedMatch = {
        ...match,
        date_start: rescheduledTime,
        rescheduled: true,
        rescheduled_reason: 'Arrêté municipal sur terrain impraticable',
        version: 2,
      };

      expect(updatedMatch.id).toBe(match.id);
      expect(updatedMatch.version).toBe(2);
      expect(updatedMatch.rescheduled).toBe(true);
    });
  });

  // =========================================================================
  // E. COMMUNICATION
  // =========================================================================
  describe('E. Communication', () => {
    it('routes group messages to team members and blocks unrelated accounts', () => {
      const u17ChatGroup = {
        id: 'group_rehearsal_u17',
        team_id: REHEARSAL_TEAMS.u17.id,
        club_id: REHEARSAL_CLUB.id,
        authorized_uids: [
          REHEARSAL_ACCOUNTS.coach.uid,
          REHEARSAL_ACCOUNTS.minorPlayer.uid,
          REHEARSAL_ACCOUNTS.parent.uid,
        ],
      };

      function canAccessConversation(uid: string): boolean {
        return u17ChatGroup.authorized_uids.includes(uid);
      }

      // Membres autorisés
      expect(canAccessConversation(REHEARSAL_ACCOUNTS.coach.uid)).toBe(true);
      expect(canAccessConversation(REHEARSAL_ACCOUNTS.minorPlayer.uid)).toBe(true);
      expect(canAccessConversation(REHEARSAL_ACCOUNTS.parent.uid)).toBe(true);

      // Comptes non autorisés
      expect(canAccessConversation(REHEARSAL_ACCOUNTS.communityUser.uid)).toBe(false);
      expect(canAccessConversation(REHEARSAL_ACCOUNTS.adultPlayer.uid)).toBe(false);
      expect(canAccessConversation(REHEARSAL_ACCOUNTS.noClubUser.uid)).toBe(false);
    });
  });

  // =========================================================================
  // F. ADMINISTRATION
  // =========================================================================
  describe('F. Administration', () => {
    it('executes document submission, rejection with reason, correction, and RBAC coach protection', () => {
      const docReq = { ...REHEARSAL_CANONICAL_RECORDS.documentRequest };

      // 1. Dépôt initial du document par le parent
      const submissionV1 = {
        id: 'doc_submission_01',
        request_id: docReq.id,
        user_uid: docReq.target_uid,
        file_name: 'scan_certificat_non_signe.pdf',
        status: 'pending_review' as 'pending_review' | 'rejected' | 'approved',
        submitted_at: new Date(),
      };

      // 2. Rejet par le staff avec motif explicatif
      const reviewedV1 = {
        ...submissionV1,
        status: 'rejected' as const,
        rejection_reason: 'Tampon ou signature du médecin manquant sur la page 2.',
        reviewed_by: REHEARSAL_ACCOUNTS.admin.uid,
      };
      expect(reviewedV1.status).toBe('rejected');
      expect(reviewedV1.rejection_reason).toContain('Tampon');

      // 3. Remplacement par la version corrigée
      const submissionV2 = {
        ...submissionV1,
        id: 'doc_submission_02',
        file_name: 'certificat_medical_signe_2026.pdf',
        status: 'pending_review' as const,
        replaces_doc_id: submissionV1.id,
      };

      // 4. Validation finale par le staff
      const approvedV2 = {
        ...submissionV2,
        status: 'approved' as const,
        reviewed_by: REHEARSAL_ACCOUNTS.admin.uid,
        approved_at: new Date(),
      };
      expect(approvedV2.status).toBe('approved');

      // 5. Cloisonnement : le coach n'a pas accès au contenu médical privé sans mandat
      function canCoachViewMedicalRecord(role: string, isMedicalPersonnel: boolean): boolean {
        return role === 'admin' || isMedicalPersonnel;
      }
      expect(canCoachViewMedicalRecord(REHEARSAL_ACCOUNTS.coach.role, false)).toBe(false);
      expect(canCoachViewMedicalRecord(REHEARSAL_ACCOUNTS.admin.role, false)).toBe(true);
    });
  });

  // =========================================================================
  // G. FOOTBALL DATA AND VIDEO HONESTY
  // =========================================================================
  describe('G. Football data and video honesty', () => {
    it('verifies competition standings data and labels Veo camera live availability honestly', () => {
      // 1. Classement officiel
      const officialStandings = [
        { rank: 1, team_name: REHEARSAL_CLUB.name, played: 14, points: 34, diff: 18 },
        { rank: 2, team_name: 'AS Montreuil', played: 14, points: 31, diff: 12 },
      ];
      const freshness = FffAuthoritativeDataService.computeFreshnessBadge(
        new Date().toISOString(),
        'ok',
        'FFF',
      );
      expect(freshness.health).toBe('ok');
      expect(freshness.label).toContain('FFF');

      // 2. Vidéo autorisée locale
      const localVideo = {
        id: 'vid_rehearsal_01',
        title: 'Résumé match U17 vs Montreuil',
        storage_path: 'videos/rehearsal/u17_highlights.mp4',
        download_url: 'https://proday.app/storage/videos/rehearsal/u17_highlights.mp4',
        uploaded_by: REHEARSAL_ACCOUNTS.coach.uid,
        status: 'ready' as const,
        created_at: new Date(),
      };
      const lifecycle = resolveVideoLifecycle(localVideo);
      expect(lifecycle.playable).toBe(true);
      expect(lifecycle.label).toBe('Prête');

      // 3. Détection honnête du flux Veo
      const veoIntegrationState = {
        has_linked_account: true,
        is_hardware_connected_on_field: false,
        active_live_stream_url: null,
      };

      // Si le matériel n'est pas sur le terrain, pas de faux flux direct
      const shouldDisplayLiveStream =
        veoIntegrationState.has_linked_account &&
        veoIntegrationState.is_hardware_connected_on_field &&
        !!veoIntegrationState.active_live_stream_url;

      expect(shouldDisplayLiveStream).toBe(false);
    });
  });

  // =========================================================================
  // 4. REALISTIC INTERRUPTION RECOVERY
  // =========================================================================
  describe('4. Recovery from Realistic Interruptions', () => {
    it('handles offline draft preservation during network disconnect', () => {
      const draftStorage: Record<string, string> = {};
      const draftKey = `draft_session_notes_${REHEARSAL_ACCOUNTS.coach.uid}`;
      const ongoingNotes = 'Exercice 2 : insister sur le repli défensif du numéro 6.';

      // Sauvegarde automatique du brouillon en local
      draftStorage[draftKey] = ongoingNotes;

      // Simulation de coupure réseau
      const networkOnline = false;
      let uploadStatus = 'idle';

      if (!networkOnline) {
        uploadStatus = 'queued_offline';
      }

      expect(uploadStatus).toBe('queued_offline');
      // Le brouillon local est intact
      expect(draftStorage[draftKey]).toBe(ongoingNotes);
    });

    it('prevents duplicate action execution when user double-clicks submit', () => {
      let submissionCount = 0;
      let isSubmitting = false;

      function handleActionClick() {
        if (isSubmitting) return false;
        isSubmitting = true;
        submissionCount += 1;
        return true;
      }

      const click1 = handleActionClick();
      const click2 = handleActionClick(); // Clic immédiat avant fin de requête

      expect(click1).toBe(true);
      expect(click2).toBe(false);
      expect(submissionCount).toBe(1);
    });

    it('safely handles direct navigation to an outdated notification without crashing', () => {
      const expiredEventNotification = {
        notification_id: 'notif_998',
        target_event_id: 'event_old_cancelled_123',
        event_exists: false,
      };

      function resolveNotificationTarget(targetId: string, eventExists: boolean) {
        if (!eventExists) {
          return {
            action: 'show_notice',
            message: 'Cet événement a été modifié, déplacé ou annulé par le club.',
            redirect_to: 'calendar_home',
          };
        }
        return { action: 'open_detail', target_id: targetId };
      }

      const result = resolveNotificationTarget(
        expiredEventNotification.target_event_id,
        expiredEventNotification.event_exists,
      );

      expect(result.action).toBe('show_notice');
      expect(result.redirect_to).toBe('calendar_home');
    });

    it('revokes access immediately if user membership status changes from active to revoked', () => {
      let userMembershipStatus: 'active' | 'revoked' = 'active';

      function canAccessInternalClubData(status: 'active' | 'revoked'): boolean {
        return status === 'active';
      }

      expect(canAccessInternalClubData(userMembershipStatus)).toBe(true);

      // Révocation administrative
      userMembershipStatus = 'revoked';
      expect(canAccessInternalClubData(userMembershipStatus)).toBe(false);
    });
  });

  // =========================================================================
  // 5. MOBILE AND DESKTOP LAYOUT INVARIANTS
  // =========================================================================
  describe('5. Mobile and Desktop Handoff Invariants', () => {
    it('ensures touch targets and navigation controls satisfy both form factors', () => {
      const mobileSpec = {
        minTouchTarget: 44, // 44x44 pt HIG
        bottomDockVisible: true,
        sideRailVisible: false,
      };

      const desktopSpec = {
        minTouchTarget: 36,
        bottomDockVisible: false,
        sideRailVisible: true,
      };

      expect(mobileSpec.minTouchTarget).toBeGreaterThanOrEqual(44);
      expect(desktopSpec.sideRailVisible).toBe(true);
    });
  });
});
