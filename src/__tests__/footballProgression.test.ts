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
import {
  calculateLevelFromXp,
  RANK_DEFINITIONS,
  getRecommendedObjectivesForPlayer,
} from '../config/footballProgressionRules';
import type { PlayerProgressionProfile } from '../models/FootballProgression';

describe('Football Progression & Quest Journey System (Solo Leveling inspired)', () => {
  const dummyPlayerUid = 'player_lucas_prog_001';
  const dummyCoachUid = 'coach_thomas_001';

  describe('Scenario 1: New Player Initialization', () => {
    it('initializes a new player at Wood rank, Level 1, 0 XP with discovery quests', async () => {
      const profile = await footballProgressionService.getOrCreateProgressionProfile(
        dummyPlayerUid,
        'club_us_ormesson',
      );

      expect(profile.player_uid).toBe(dummyPlayerUid);
      expect(profile.rank).toBe('wood');
      expect(profile.level).toBe(1);
      expect(profile.total_xp).toBe(0);
      expect(profile.active_objective_ids.length).toBeGreaterThan(0);
      expect(profile.current_title).toBe('Initié du Vestiaire');
    });

    it('identifies independent path for players without a club', async () => {
      const independentUid = 'player_independent_999';
      const profile = await footballProgressionService.getOrCreateProgressionProfile(independentUid);

      expect(profile.rank).toBe('wood');
      const active = await footballProgressionService.listActiveObjectives(independentUid);
      expect(active.length).toBeGreaterThan(0);
      // Independent players can fulfill autonomous tasks (sac, carnet, auto-évaluation)
      expect(active.some((o) => !o.requires_coach_validation)).toBe(true);
    });
  });

  describe('Scenario 2: Coach Assignment & Multi-Step Quest Workflow', () => {
    it('allows a coach to assign an objective and player to submit completion', async () => {
      const assigned = await footballProgressionService.assignObjectiveByCoach({
        coach_uid: dummyCoachUid,
        coach_name: 'Coach Thomas',
        player_uid: dummyPlayerUid,
        club_id: 'club_us_ormesson',
        title: 'Cadrage défensif 1 contre 1',
        action_description: 'Freiner l’attaquant et orienter vers la ligne de touche.',
        purpose: 'Éviter les tirs axiaux en zone dangereuse.',
        measurable_condition: '6 répétitions réussies en séance.',
        category: 'tactical',
        target_position: 'defender',
        xp_reward: 50,
        action_kind: 'open_individual_program',
        milestone_key: 'm_bronze_routine',
      });

      expect(assigned.id).toBeDefined();
      expect(assigned.is_coach_assigned).toBe(true);
      expect(assigned.requires_coach_validation).toBe(true);
      expect(assigned.status).toBe('active');

      // Player submits completion with reflection notes
      const submission = await footballProgressionService.submitObjectiveCompletion(
        assigned.id,
        dummyPlayerUid,
        'Bonne séance, meilleur appui bas sur les départs rapides.',
      );

      expect(submission.completed).toBe(false);
      expect(submission.awaitingCoach).toBe(true);
      expect(submission.objective.status).toBe('awaiting_validation');
      expect(submission.objective.player_notes).toContain('Bonne séance');
    });

    it('allows coach to request revisions or validate completion', async () => {
      // Re-assign for revision test
      const assigned = await footballProgressionService.assignObjectiveByCoach({
        coach_uid: dummyCoachUid,
        coach_name: 'Coach Thomas',
        player_uid: dummyPlayerUid,
        club_id: 'club_us_ormesson',
        title: 'Passe appuyée pied gauche',
        action_description: '10 passes tendues sans rebond.',
        purpose: 'Accélérer la circulation de balle.',
        measurable_condition: '10 passes cadrées dans les coupelles.',
        category: 'technical',
        target_position: 'midfielder',
        xp_reward: 45,
        action_kind: 'open_individual_program',
      });

      await footballProgressionService.submitObjectiveCompletion(assigned.id, dummyPlayerUid);

      // Coach requests revision
      const revision = await footballProgressionService.reviewObjectiveByCoach(
        assigned.id,
        dummyCoachUid,
        'needs_revision',
        'Attention au dosage, 3 passes étaient trop molles. Refais une série.',
      );

      expect(revision.objective.status).toBe('needs_revision');
      expect(revision.objective.coach_feedback).toContain('trop molles');
      expect(revision.xpAwarded).toBe(0);

      // Coach approves
      const approved = await footballProgressionService.reviewObjectiveByCoach(
        assigned.id,
        dummyCoachUid,
        'approved',
        'Parfait ! Dosages impeccables cette fois.',
      );

      expect(approved.objective.status).toBe('completed');
      expect(approved.xpAwarded).toBe(45);
    });
  });

  describe('Scenario 3: Auditable XP Ledger & Duplicate Prevention', () => {
    it('awards XP through ledger and strictly prevents duplicates on repeated calls', async () => {
      const idempotencyKey = 'unique_event_match_clean_sheet_2026_01';

      // First award
      const firstCall = await footballProgressionService.awardXp(
        dummyPlayerUid,
        80,
        'match_performance',
        {
          idempotencyKey,
          completionStatus: 'coach_validated',
          milestoneKey: 'm_bronze_routine',
        },
      );

      expect(firstCall.alreadyAwarded).toBe(false);

      // Duplicate attempt with exact same idempotency key
      const duplicateCall = await footballProgressionService.awardXp(
        dummyPlayerUid,
        80,
        'match_performance',
        {
          idempotencyKey,
          completionStatus: 'coach_validated',
        },
      );

      expect(duplicateCall.alreadyAwarded).toBe(true);
      expect(duplicateCall.leveledUp).toBe(false);

      // Verify in audit ledger
      const ledger = await footballProgressionService.listXpLedger(dummyPlayerUid);
      const matches = ledger.filter((l) => l.idempotency_key === idempotencyKey);
      expect(matches).toHaveLength(1);
    });
  });

  describe('Scenario 4: Level Curve and Rank Promotion Protection', () => {
    it('calculates levels predictably according to the rules curve', () => {
      expect(calculateLevelFromXp(0).level).toBe(1);
      expect(calculateLevelFromXp(99).level).toBe(1);
      expect(calculateLevelFromXp(100).level).toBe(2);
      expect(calculateLevelFromXp(250).level).toBe(3);
      expect(calculateLevelFromXp(1000).level).toBe(6);
      expect(calculateLevelFromXp(2700).level).toBe(10);
    });

    it('strictly prevents rank promotion when required milestones are incomplete, even if level is high', () => {
      const highXpProfile: PlayerProgressionProfile = {
        player_uid: 'farm_player_01',
        rank: 'wood',
        level: 12, // Level is well above Bronze (requires level 3)
        total_xp: 3500,
        xp_into_level: 0,
        xp_for_next_level: 600,
        active_objective_ids: [],
        completed_objective_ids: [],
        completed_milestones: {
          m_wood_profile: 1,
          // Missing other mandatory Wood milestones: m_wood_journal, m_wood_checklist, m_wood_tactics
        },
        unlocked_titles: ['Initié du Vestiaire'],
        current_title: 'Initié du Vestiaire',
        rule_version: '2026.1',
        updated_at: new Date(),
      };

      const result = footballProgressionService.evaluateRankPromotion(highXpProfile);
      expect(result.rankPromoted).toBe(false);
      expect(result.newRank).toBe('wood');
    });

    it('promotes rank and unlocks title when both Level and all Milestones are satisfied', () => {
      const readyProfile: PlayerProgressionProfile = {
        player_uid: 'ready_player_01',
        rank: 'wood',
        level: 3,
        total_xp: 300,
        xp_into_level: 50,
        xp_for_next_level: 200,
        active_objective_ids: [],
        completed_objective_ids: [],
        completed_milestones: {
          m_wood_profile: 1,
          m_wood_journal: 1,
          m_wood_checklist: 1,
          m_wood_tactics: 1,
        },
        unlocked_titles: ['Initié du Vestiaire'],
        current_title: 'Initié du Vestiaire',
        rule_version: '2026.1',
        updated_at: new Date(),
      };

      const result = footballProgressionService.evaluateRankPromotion(readyProfile);
      expect(result.rankPromoted).toBe(true);
      expect(result.newRank).toBe('bronze');
      expect(readyProfile.current_title).toBe('Artisan de l’Entraînement');
      expect(readyProfile.unlocked_titles).toContain('Artisan de l’Entraînement');
    });
  });

  describe('Scenario 5: Position-Specific Objective Tailoring', () => {
    it('filters objectives adapted to Goalkeepers, Defenders, Midfielders and Forwards', () => {
      const gkObjectives = getRecommendedObjectivesForPlayer('Gardien de but');
      expect(gkObjectives.some((o) => o.target_position === 'goalkeeper')).toBe(true);
      expect(gkObjectives.some((o) => o.target_position === 'forward')).toBe(false);

      const fwdObjectives = getRecommendedObjectivesForPlayer('Avant-centre');
      expect(fwdObjectives.some((o) => o.target_position === 'forward')).toBe(true);
      expect(fwdObjectives.some((o) => o.target_position === 'goalkeeper')).toBe(false);

      const defObjectives = getRecommendedObjectivesForPlayer('Défenseur central');
      expect(defObjectives.some((o) => o.target_position === 'defender')).toBe(true);
    });
  });

  describe('Scenario 6: Rank Roadmap Transparency', () => {
    it('provides clear milestone roadmap and identifies exact incomplete criteria', () => {
      const sampleProfile: PlayerProgressionProfile = {
        player_uid: 'test_p',
        rank: 'wood',
        level: 2,
        total_xp: 150,
        xp_into_level: 50,
        xp_for_next_level: 150,
        active_objective_ids: [],
        completed_objective_ids: [],
        completed_milestones: {
          m_wood_profile: 1,
        },
        unlocked_titles: ['Initié du Vestiaire'],
        current_title: 'Initié du Vestiaire',
        rule_version: '2026.1',
        updated_at: new Date(),
      };

      const roadmap = footballProgressionService.getRankRoadmap(sampleProfile);
      expect(roadmap.currentRankDef.rank).toBe('wood');
      expect(roadmap.nextRankDef?.rank).toBe('bronze');
      expect(roadmap.levelSatisfied).toBe(false); // level 2 < 3

      const profileMilestone = roadmap.milestoneProgress.find((m) => m.key === 'm_wood_profile');
      expect(profileMilestone?.satisfied).toBe(true);

      const journalMilestone = roadmap.milestoneProgress.find((m) => m.key === 'm_wood_journal');
      expect(journalMilestone?.satisfied).toBe(false);
    });
  });
});
