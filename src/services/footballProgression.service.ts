import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  PlayerProgressionProfile,
  ProgressionObjective,
  ProgressionRank,
  XpLedgerEntry,
  ObjectiveStatus,
} from '../models/FootballProgression';
import {
  calculateLevelFromXp,
  RANK_DEFINITIONS,
  PROGRESSION_RULES_VERSION,
  OBJECTIVE_TEMPLATES,
  getRecommendedObjectivesForPlayer,
} from '../config/footballProgressionRules';

const COL_PROFILES = 'player_progression_profiles';
const COL_OBJECTIVES = 'player_progression_objectives';
const COL_LEDGER = 'player_xp_ledger';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

// Mémoire de secours pour environnement offline & tests unitaires
const inMemoryProfiles = new Map<string, PlayerProgressionProfile>();
const inMemoryObjectives = new Map<string, ProgressionObjective>();
const inMemoryLedger = new Map<string, XpLedgerEntry>();

export const footballProgressionService = {
  /**
   * Obtient ou initialise le profil de progression football d'un joueur.
   */
  async getOrCreateProgressionProfile(
    playerUid: string,
    initialClubId?: string,
  ): Promise<PlayerProgressionProfile> {
    const database = getDb();
    const now = new Date();

    if (database && isFirebaseConfigured() && playerUid) {
      try {
        const ref = doc(database, COL_PROFILES, playerUid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          return {
            player_uid: playerUid,
            rank: (d.rank as ProgressionRank) ?? 'wood',
            level: Number(d.level ?? 1),
            total_xp: Number(d.total_xp ?? 0),
            xp_into_level: Number(d.xp_into_level ?? 0),
            xp_for_next_level: Number(d.xp_for_next_level ?? 100),
            active_objective_ids: Array.isArray(d.active_objective_ids) ? d.active_objective_ids.map(String) : [],
            completed_objective_ids: Array.isArray(d.completed_objective_ids) ? d.completed_objective_ids.map(String) : [],
            completed_milestones: typeof d.completed_milestones === 'object' && d.completed_milestones ? d.completed_milestones : {},
            unlocked_titles: Array.isArray(d.unlocked_titles) ? d.unlocked_titles.map(String) : ['Initié du Vestiaire'],
            current_title: String(d.current_title ?? 'Initié du Vestiaire'),
            rule_version: String(d.rule_version ?? PROGRESSION_RULES_VERSION),
            updated_at: toDate(d.updated_at),
          };
        }
      } catch {
        // Fallback mémoire
      }
    }

    if (inMemoryProfiles.has(playerUid)) {
      return inMemoryProfiles.get(playerUid)!;
    }

    // Création initiale (Rang Bois, Niveau 1, 0 XP)
    const initialProfile: PlayerProgressionProfile = {
      player_uid: playerUid,
      rank: 'wood',
      level: 1,
      total_xp: 0,
      xp_into_level: 0,
      xp_for_next_level: 100,
      active_objective_ids: [],
      completed_objective_ids: [],
      completed_milestones: {},
      unlocked_titles: ['Initié du Vestiaire'],
      current_title: 'Initié du Vestiaire',
      rule_version: PROGRESSION_RULES_VERSION,
      updated_at: now,
    };

    // Création de 2 objectifs de découverte initiaux pour le rang Bois
    const defaultTemplates = OBJECTIVE_TEMPLATES.filter((t) =>
      ['obj_uni_checklist', 'obj_uni_journal'].includes(t.template_id),
    );

    for (const t of defaultTemplates) {
      const objId = `obj_${t.template_id}_${playerUid}_init`;
      const createdObj: ProgressionObjective = {
        ...t,
        id: objId,
        player_uid: playerUid,
        club_id: initialClubId,
        status: 'active',
        created_at: now,
        updated_at: now,
      };
      initialProfile.active_objective_ids.push(objId);
      inMemoryObjectives.set(objId, createdObj);
    }

    inMemoryProfiles.set(playerUid, initialProfile);

    if (database && isFirebaseConfigured()) {
      try {
        await setDoc(doc(database, COL_PROFILES, playerUid), {
          ...initialProfile,
          updated_at: serverTimestamp(),
        });
      } catch {
        // Enregistrement best-effort
      }
    }

    return initialProfile;
  },

  /**
   * Liste les objectifs actifs pour le joueur (sélection ciblée de 3 à 5 objectifs).
   */
  async listActiveObjectives(playerUid: string): Promise<ProgressionObjective[]> {
    const profile = await this.getOrCreateProgressionProfile(playerUid);
    const database = getDb();

    if (database && isFirebaseConfigured()) {
      try {
        const q = query(
          collection(database, COL_OBJECTIVES),
          where('player_uid', '==', playerUid),
          where('status', 'in', ['active', 'submitted', 'awaiting_validation', 'needs_revision']),
          firestoreLimit(10),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              template_id: String(data.template_id ?? ''),
              player_uid: String(data.player_uid ?? ''),
              club_id: data.club_id ? String(data.club_id) : undefined,
              team_id: data.team_id ? String(data.team_id) : undefined,
              title: String(data.title ?? ''),
              action_description: String(data.action_description ?? ''),
              purpose: String(data.purpose ?? ''),
              measurable_condition: String(data.measurable_condition ?? ''),
              category: data.category,
              target_position: data.target_position ?? 'universal',
              due_date: data.due_date ? toDate(data.due_date) : undefined,
              period_label: data.period_label ? String(data.period_label) : undefined,
              is_coach_assigned: Boolean(data.is_coach_assigned),
              coach_uid: data.coach_uid ? String(data.coach_uid) : undefined,
              coach_name: data.coach_name ? String(data.coach_name) : undefined,
              requires_coach_validation: Boolean(data.requires_coach_validation),
              xp_reward: Number(data.xp_reward ?? 30),
              milestone_key: data.milestone_key ? String(data.milestone_key) : undefined,
              status: data.status as ObjectiveStatus,
              progress_current: Number(data.progress_current ?? 0),
              progress_target: Number(data.progress_target ?? 1),
              progress_unit: String(data.progress_unit ?? 'unité'),
              player_notes: data.player_notes ? String(data.player_notes) : undefined,
              coach_feedback: data.coach_feedback ? String(data.coach_feedback) : undefined,
              action_kind: data.action_kind,
              action_target_id: data.action_target_id ? String(data.action_target_id) : undefined,
              created_at: toDate(data.created_at),
              updated_at: toDate(data.updated_at),
            };
          });
        }
      } catch {
        // Fallback mémoire
      }
    }

    const list: ProgressionObjective[] = [];
    for (const id of profile.active_objective_ids) {
      const obj = inMemoryObjectives.get(id);
      if (obj && ['active', 'submitted', 'awaiting_validation', 'needs_revision'].includes(obj.status)) {
        list.push(obj);
      }
    }
    return list;
  },

  /**
   * Propose des objectifs recommandés disponibles à activer selon le profil du joueur.
   */
  async listAvailableObjectives(
    playerUid: string,
    position?: string,
  ): Promise<Array<Omit<ProgressionObjective, 'id' | 'player_uid' | 'created_at' | 'updated_at'>>> {
    const profile = await this.getOrCreateProgressionProfile(playerUid);
    const active = await this.listActiveObjectives(playerUid);
    const activeTemplateIds = new Set(active.map((a) => a.template_id));
    const all = getRecommendedObjectivesForPlayer(position, profile.rank);

    return all.filter((tpl) => !activeTemplateIds.has(tpl.template_id));
  },

  /**
   * Le joueur accepte et active un objectif disponible (limite max de 5 quêtes simultanées).
   */
  async acceptObjective(
    playerUid: string,
    templateId: string,
    clubId?: string,
  ): Promise<ProgressionObjective> {
    const profile = await this.getOrCreateProgressionProfile(playerUid);
    const active = await this.listActiveObjectives(playerUid);

    if (active.length >= 5) {
      throw new Error('Tu as déjà 5 quêtes actives en cours. Termine-en une avant d’en activer une nouvelle.');
    }

    const template = OBJECTIVE_TEMPLATES.find((t) => t.template_id === templateId);
    if (!template) {
      throw new Error('Objectif introuvable dans le catalogue.');
    }

    const objId = `obj_${templateId}_${Date.now()}`;
    const now = new Date();
    const newObjective: ProgressionObjective = {
      ...template,
      id: objId,
      player_uid: playerUid,
      club_id: clubId,
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    inMemoryObjectives.set(objId, newObjective);
    profile.active_objective_ids.push(objId);
    inMemoryProfiles.set(playerUid, profile);

    const database = getDb();
    if (database && isFirebaseConfigured()) {
      try {
        await setDoc(doc(database, COL_OBJECTIVES, objId), {
          ...newObjective,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        await updateDoc(doc(database, COL_PROFILES, playerUid), {
          active_objective_ids: profile.active_objective_ids,
          updated_at: serverTimestamp(),
        });
      } catch {
        // Enregistrement best-effort
      }
    }

    return newObjective;
  },

  /**
   * Un coach assigne un objectif personnalisé à un joueur de son équipe.
   */
  async assignObjectiveByCoach(input: {
    coach_uid: string;
    coach_name: string;
    player_uid: string;
    club_id: string;
    team_id?: string;
    title: string;
    action_description: string;
    purpose: string;
    measurable_condition: string;
    category: ProgressionObjective['category'];
    target_position: ProgressionObjective['target_position'];
    due_date?: Date;
    period_label?: string;
    xp_reward: number;
    action_kind: ProgressionObjective['action_kind'];
    milestone_key?: string;
  }): Promise<ProgressionObjective> {
    const now = new Date();
    const objId = `obj_coach_${Date.now()}`;

    const newObjective: ProgressionObjective = {
      id: objId,
      template_id: 'coach_custom',
      player_uid: input.player_uid,
      club_id: input.club_id,
      team_id: input.team_id,
      title: input.title.trim(),
      action_description: input.action_description.trim(),
      purpose: input.purpose.trim(),
      measurable_condition: input.measurable_condition.trim(),
      category: input.category,
      target_position: input.target_position,
      due_date: input.due_date,
      period_label: input.period_label,
      is_coach_assigned: true,
      coach_uid: input.coach_uid,
      coach_name: input.coach_name,
      requires_coach_validation: true,
      xp_reward: input.xp_reward,
      milestone_key: input.milestone_key,
      status: 'active',
      progress_current: 0,
      progress_target: 1,
      progress_unit: 'validé',
      action_kind: input.action_kind,
      created_at: now,
      updated_at: now,
    };

    inMemoryObjectives.set(objId, newObjective);
    const profile = await this.getOrCreateProgressionProfile(input.player_uid, input.club_id);
    profile.active_objective_ids.push(objId);
    inMemoryProfiles.set(input.player_uid, profile);

    const database = getDb();
    if (database && isFirebaseConfigured()) {
      try {
        await setDoc(doc(database, COL_OBJECTIVES, objId), {
          ...newObjective,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        await updateDoc(doc(database, COL_PROFILES, input.player_uid), {
          active_objective_ids: profile.active_objective_ids,
          updated_at: serverTimestamp(),
        });
      } catch {
        // Enregistrement best-effort
      }
    }

    return newObjective;
  },

  /**
   * Le joueur soumet la réalisation de son objectif (avec notes optionnelles).
   * Si validation coach requise -> état 'awaiting_validation'.
   * Sinon -> état 'completed' et attribution immédiate des XP audités.
   */
  async submitObjectiveCompletion(
    objectiveId: string,
    playerUid: string,
    notes?: string,
  ): Promise<{
    objective: ProgressionObjective;
    completed: boolean;
    awaitingCoach: boolean;
    xpAwarded: number;
    leveledUp: boolean;
    rankPromoted: boolean;
  }> {
    let obj = inMemoryObjectives.get(objectiveId);
    const database = getDb();

    if (database && isFirebaseConfigured()) {
      try {
        const snap = await getDoc(doc(database, COL_OBJECTIVES, objectiveId));
        if (snap.exists()) {
          const d = snap.data();
          obj = {
            id: snap.id,
            template_id: String(d.template_id ?? ''),
            player_uid: String(d.player_uid ?? ''),
            club_id: d.club_id ? String(d.club_id) : undefined,
            team_id: d.team_id ? String(d.team_id) : undefined,
            title: String(d.title ?? ''),
            action_description: String(d.action_description ?? ''),
            purpose: String(d.purpose ?? ''),
            measurable_condition: String(d.measurable_condition ?? ''),
            category: d.category,
            target_position: d.target_position ?? 'universal',
            is_coach_assigned: Boolean(d.is_coach_assigned),
            coach_uid: d.coach_uid ? String(d.coach_uid) : undefined,
            coach_name: d.coach_name ? String(d.coach_name) : undefined,
            requires_coach_validation: Boolean(d.requires_coach_validation),
            xp_reward: Number(d.xp_reward ?? 30),
            milestone_key: d.milestone_key ? String(d.milestone_key) : undefined,
            status: d.status as ObjectiveStatus,
            progress_current: Number(d.progress_current ?? 0),
            progress_target: Number(d.progress_target ?? 1),
            progress_unit: String(d.progress_unit ?? 'unité'),
            player_notes: d.player_notes ? String(d.player_notes) : undefined,
            action_kind: d.action_kind,
            created_at: toDate(d.created_at),
            updated_at: toDate(d.updated_at),
          };
        }
      } catch {
        // Fallback
      }
    }

    if (!obj) {
      throw new Error('Objectif introuvable.');
    }
    if (obj.player_uid !== playerUid) {
      throw new Error('Accès non autorisé à cet objectif.');
    }

    const now = new Date();
    obj.player_notes = notes?.trim();
    obj.player_submitted_at = now;
    obj.progress_current = obj.progress_target;

    if (obj.requires_coach_validation) {
      obj.status = 'awaiting_validation';
      inMemoryObjectives.set(objectiveId, obj);

      if (database && isFirebaseConfigured()) {
        try {
          await updateDoc(doc(database, COL_OBJECTIVES, objectiveId), {
            status: 'awaiting_validation',
            player_notes: notes?.trim() ?? null,
            player_submitted_at: Timestamp.fromDate(now),
            updated_at: serverTimestamp(),
          });
        } catch {
          // Best-effort
        }
      }

      return {
        objective: obj,
        completed: false,
        awaitingCoach: true,
        xpAwarded: 0,
        leveledUp: false,
        rankPromoted: false,
      };
    }

    // Auto-validation (objectifs autonomes / personnels)
    obj.status = 'completed';
    inMemoryObjectives.set(objectiveId, obj);

    const idempotencyKey = `xp_${objectiveId}_${playerUid}_completion`;
    const awardResult = await this.awardXp(playerUid, obj.xp_reward, 'objective_completed', {
      objectiveId,
      idempotencyKey,
      completionStatus: 'self_reported',
      milestoneKey: obj.milestone_key,
    });

    if (database && isFirebaseConfigured()) {
      try {
        await updateDoc(doc(database, COL_OBJECTIVES, objectiveId), {
          status: 'completed',
          player_notes: notes?.trim() ?? null,
          player_submitted_at: Timestamp.fromDate(now),
          updated_at: serverTimestamp(),
        });
      } catch {
        // Best-effort
      }
    }

    return {
      objective: obj,
      completed: true,
      awaitingCoach: false,
      xpAwarded: obj.xp_reward,
      leveledUp: awardResult.leveledUp,
      rankPromoted: awardResult.rankPromoted,
    };
  },

  /**
   * Le coach examine la réalisation soumise par le joueur :
   * - 'approved' : valide l'objectif, débloque l'XP audité avec statut coach_validated et jalon.
   * - 'needs_revision' : demande au joueur d'ajuster son travail avec retour constructif.
   * - 'rejected' : annule l'objectif avec motif clair.
   */
  async reviewObjectiveByCoach(
    objectiveId: string,
    coachUid: string,
    decision: 'approved' | 'needs_revision' | 'rejected',
    feedback: string,
  ): Promise<{
    objective: ProgressionObjective;
    xpAwarded: number;
    leveledUp: boolean;
    rankPromoted: boolean;
  }> {
    const obj = inMemoryObjectives.get(objectiveId);
    if (!obj) throw new Error('Objectif introuvable.');

    const now = new Date();
    obj.coach_feedback = feedback.trim();
    obj.coach_validated_at = now;

    if (decision === 'approved') {
      obj.status = 'completed';
      const idempotencyKey = `xp_${objectiveId}_coach_approved`;
      const awardResult = await this.awardXp(obj.player_uid, obj.xp_reward, 'coach_validated_objective', {
        objectiveId,
        idempotencyKey,
        completionStatus: 'coach_validated',
        milestoneKey: obj.milestone_key,
      });

      inMemoryObjectives.set(objectiveId, obj);
      return {
        objective: obj,
        xpAwarded: obj.xp_reward,
        leveledUp: awardResult.leveledUp,
        rankPromoted: awardResult.rankPromoted,
      };
    } else if (decision === 'needs_revision') {
      obj.status = 'needs_revision';
      inMemoryObjectives.set(objectiveId, obj);
      return { objective: obj, xpAwarded: 0, leveledUp: false, rankPromoted: false };
    } else {
      obj.status = 'cancelled';
      inMemoryObjectives.set(objectiveId, obj);
      return { objective: obj, xpAwarded: 0, leveledUp: false, rankPromoted: false };
    }
  },

  /**
   * Attribution d'XP via le Grand Livre d'audit (XpLedger) avec contrôle d'idempotence.
   * Empêche formellement tout doublon (double-clic, rafraîchissement, appareils multiples).
   */
  async awardXp(
    playerUid: string,
    amount: number,
    sourceEvent: string,
    opts: {
      objectiveId?: string;
      idempotencyKey: string;
      completionStatus: XpLedgerEntry['completion_status'];
      milestoneKey?: string;
    },
  ): Promise<{
    alreadyAwarded: boolean;
    profile: PlayerProgressionProfile;
    leveledUp: boolean;
    rankPromoted: boolean;
    oldLevel: number;
    newLevel: number;
    oldRank: ProgressionRank;
    newRank: ProgressionRank;
  }> {
    const profile = await this.getOrCreateProgressionProfile(playerUid);
    const oldLevel = profile.level;
    const oldRank = profile.rank;

    // Contrôle d'idempotence en mémoire
    if (inMemoryLedger.has(opts.idempotencyKey)) {
      return {
        alreadyAwarded: true,
        profile,
        leveledUp: false,
        rankPromoted: false,
        oldLevel,
        newLevel: oldLevel,
        oldRank,
        newRank: oldRank,
      };
    }

    const database = getDb();
    if (database && isFirebaseConfigured()) {
      try {
        const collisionSnap = await getDocs(
          query(collection(database, COL_LEDGER), where('idempotency_key', '==', opts.idempotencyKey), firestoreLimit(1)),
        );
        if (!collisionSnap.empty) {
          return {
            alreadyAwarded: true,
            profile,
            leveledUp: false,
            rankPromoted: false,
            oldLevel,
            newLevel: oldLevel,
            oldRank,
            newRank: oldRank,
          };
        }
      } catch {
        // En cas d'erreur réseau, on se fie au contrôle mémoire
      }
    }

    const now = new Date();
    const ledgerEntry: XpLedgerEntry = {
      id: `ledg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      player_uid: playerUid,
      source_event: sourceEvent,
      objective_id: opts.objectiveId,
      amount,
      rule_version: PROGRESSION_RULES_VERSION,
      completion_status: opts.completionStatus,
      awarded_at: now,
      idempotency_key: opts.idempotencyKey,
    };
    inMemoryLedger.set(opts.idempotencyKey, ledgerEntry);

    // Mise à jour de l'XP et du niveau du profil
    profile.total_xp += amount;
    const levelCalc = calculateLevelFromXp(profile.total_xp);
    const leveledUp = levelCalc.level > oldLevel;
    profile.level = levelCalc.level;
    profile.xp_into_level = levelCalc.xpIntoLevel;
    profile.xp_for_next_level = levelCalc.xpForNextLevel;

    if (opts.objectiveId && !profile.completed_objective_ids.includes(opts.objectiveId)) {
      profile.completed_objective_ids.push(opts.objectiveId);
      profile.active_objective_ids = profile.active_objective_ids.filter((id) => id !== opts.objectiveId);
    }

    if (opts.milestoneKey) {
      profile.completed_milestones[opts.milestoneKey] =
        (profile.completed_milestones[opts.milestoneKey] || 0) + 1;
    }

    // Évaluation automatique d'une promotion de rang (Bois -> Diamant)
    const promotionResult = this.evaluateRankPromotion(profile);
    const rankPromoted = promotionResult.rankPromoted;

    inMemoryProfiles.set(playerUid, profile);

    if (database && isFirebaseConfigured()) {
      try {
        await addDoc(collection(database, COL_LEDGER), {
          ...ledgerEntry,
          awarded_at: serverTimestamp(),
        });
        await updateDoc(doc(database, COL_PROFILES, playerUid), {
          total_xp: profile.total_xp,
          level: profile.level,
          xp_into_level: profile.xp_into_level,
          xp_for_next_level: profile.xp_for_next_level,
          rank: profile.rank,
          current_title: profile.current_title,
          unlocked_titles: profile.unlocked_titles,
          completed_objective_ids: profile.completed_objective_ids,
          active_objective_ids: profile.active_objective_ids,
          completed_milestones: profile.completed_milestones,
          updated_at: serverTimestamp(),
        });
      } catch {
        // Best-effort
      }
    }

    return {
      alreadyAwarded: false,
      profile,
      leveledUp,
      rankPromoted,
      oldLevel,
      newLevel: profile.level,
      oldRank,
      newRank: profile.rank,
    };
  },

  /**
   * Évalue si le joueur remplit toutes les conditions (niveau requis ET tous les jalons obligatoires)
   * pour passer au rang supérieur. Empêche formellement de monter de rang uniquement via de l'XP farmée.
   */
  evaluateRankPromotion(profile: PlayerProgressionProfile): {
    rankPromoted: boolean;
    newRank: ProgressionRank;
  } {
    const ranksOrder: ProgressionRank[] = ['wood', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = ranksOrder.indexOf(profile.rank);

    if (currentIndex >= ranksOrder.length - 1) {
      return { rankPromoted: false, newRank: profile.rank };
    }

    const nextRankKey = ranksOrder[currentIndex + 1];
    const nextRankDef = RANK_DEFINITIONS[nextRankKey];

    // Condition 1 : Niveau requis atteint
    if (profile.level < nextRankDef.required_level) {
      return { rankPromoted: false, newRank: profile.rank };
    }

    // Condition 2 : Tous les jalons du rang actuel complétés
    const currentRankDef = RANK_DEFINITIONS[profile.rank];
    const allMilestonesSatisfied = currentRankDef.milestones.every((m) => {
      const currentCount = profile.completed_milestones[m.milestone_key] || 0;
      return currentCount >= m.target_count;
    });

    if (!allMilestonesSatisfied) {
      return { rankPromoted: false, newRank: profile.rank };
    }

    // Promotion validée !
    profile.rank = nextRankKey;
    if (!profile.unlocked_titles.includes(nextRankDef.title_unlocked)) {
      profile.unlocked_titles.push(nextRankDef.title_unlocked);
      profile.current_title = nextRankDef.title_unlocked;
    }

    return { rankPromoted: true, newRank: nextRankKey };
  },

  /**
   * Retourne l'état précis du parcours de rang : jalons validés vs manquants.
   */
  getRankRoadmap(profile: PlayerProgressionProfile): {
    currentRankDef: typeof RANK_DEFINITIONS[ProgressionRank];
    nextRankDef: typeof RANK_DEFINITIONS[ProgressionRank] | null;
    isMaxRank: boolean;
    levelSatisfied: boolean;
    milestoneProgress: Array<{
      key: string;
      title: string;
      description: string;
      current: number;
      target: number;
      satisfied: boolean;
      requiresCoach: boolean;
    }>;
  } {
    const ranksOrder: ProgressionRank[] = ['wood', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const curIdx = ranksOrder.indexOf(profile.rank);
    const currentRankDef = RANK_DEFINITIONS[profile.rank];
    const isMaxRank = curIdx >= ranksOrder.length - 1;
    const nextRankDef = isMaxRank ? null : RANK_DEFINITIONS[ranksOrder[curIdx + 1]];

    const levelSatisfied = nextRankDef ? profile.level >= nextRankDef.required_level : true;

    const milestoneProgress = currentRankDef.milestones.map((m) => {
      const current = profile.completed_milestones[m.milestone_key] || 0;
      return {
        key: m.milestone_key,
        title: m.title,
        description: m.description,
        current,
        target: m.target_count,
        satisfied: current >= m.target_count,
        requiresCoach: m.requires_coach_validation,
      };
    });

    return {
      currentRankDef,
      nextRankDef,
      isMaxRank,
      levelSatisfied,
      milestoneProgress,
    };
  },

  /**
   * Consultation du grand livre d'XP pour transparence et audit.
   */
  async listXpLedger(playerUid: string, limitCount = 30): Promise<XpLedgerEntry[]> {
    const list: XpLedgerEntry[] = [];
    for (const entry of inMemoryLedger.values()) {
      if (entry.player_uid === playerUid) {
        list.push(entry);
      }
    }
    return list.sort((a, b) => b.awarded_at.getTime() - a.awarded_at.getTime()).slice(0, limitCount);
  },
};
