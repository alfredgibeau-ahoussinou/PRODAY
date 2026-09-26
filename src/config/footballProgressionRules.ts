import type {
  ProgressionRank,
  RankDefinition,
  ProgressionObjective,
  ObjectivePositionFamily,
} from '../models/FootballProgression';

export const PROGRESSION_RULES_VERSION = '2026.1';

/**
 * Paliers de niveaux prévisibles et équilibrés pour joueurs amateurs.
 * L'XP ne s'achète pas avec de l'argent et récompense uniquement des actions sportives et de réflexion.
 */
export const LEVEL_THRESHOLDS = [
  { level: 1, xp_required_total: 0, xp_for_this_level: 0, rank_cap: 'wood' as ProgressionRank },
  { level: 2, xp_required_total: 100, xp_for_this_level: 100, rank_cap: 'wood' as ProgressionRank },
  { level: 3, xp_required_total: 250, xp_for_this_level: 150, rank_cap: 'bronze' as ProgressionRank },
  { level: 4, xp_required_total: 450, xp_for_this_level: 200, rank_cap: 'bronze' as ProgressionRank },
  { level: 5, xp_required_total: 700, xp_for_this_level: 250, rank_cap: 'bronze' as ProgressionRank },
  { level: 6, xp_required_total: 1000, xp_for_this_level: 300, rank_cap: 'silver' as ProgressionRank },
  { level: 7, xp_required_total: 1350, xp_for_this_level: 350, rank_cap: 'silver' as ProgressionRank },
  { level: 8, xp_required_total: 1750, xp_for_this_level: 400, rank_cap: 'silver' as ProgressionRank },
  { level: 9, xp_required_total: 2200, xp_for_this_level: 450, rank_cap: 'silver' as ProgressionRank },
  { level: 10, xp_required_total: 2700, xp_for_this_level: 500, rank_cap: 'gold' as ProgressionRank },
  { level: 11, xp_required_total: 3250, xp_for_this_level: 550, rank_cap: 'gold' as ProgressionRank },
  { level: 12, xp_required_total: 3850, xp_for_this_level: 600, rank_cap: 'gold' as ProgressionRank },
  { level: 13, xp_required_total: 4500, xp_for_this_level: 650, rank_cap: 'gold' as ProgressionRank },
  { level: 14, xp_required_total: 5200, xp_for_this_level: 700, rank_cap: 'gold' as ProgressionRank },
  { level: 15, xp_required_total: 6000, xp_for_this_level: 800, rank_cap: 'platinum' as ProgressionRank },
  { level: 16, xp_required_total: 6900, xp_for_this_level: 900, rank_cap: 'platinum' as ProgressionRank },
  { level: 17, xp_required_total: 7900, xp_for_this_level: 1000, rank_cap: 'platinum' as ProgressionRank },
  { level: 18, xp_required_total: 9000, xp_for_this_level: 1100, rank_cap: 'platinum' as ProgressionRank },
  { level: 19, xp_required_total: 10200, xp_for_this_level: 1200, rank_cap: 'platinum' as ProgressionRank },
  { level: 20, xp_required_total: 11500, xp_for_this_level: 1300, rank_cap: 'diamond' as ProgressionRank },
];

/**
 * Calcul du niveau et des fractions d'XP à partir du cumul total.
 */
export function calculateLevelFromXp(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
} {
  const xp = Math.max(0, Math.floor(totalXp));
  let currentLevel = 1;
  let xpForNext = 100;
  let xpInto = xp;

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    const t = LEVEL_THRESHOLDS[i];
    if (xp >= t.xp_required_total) {
      currentLevel = t.level;
      const nextThreshold = LEVEL_THRESHOLDS[i + 1];
      if (nextThreshold) {
        xpForNext = nextThreshold.xp_required_total - t.xp_required_total;
        xpInto = xp - t.xp_required_total;
      } else {
        xpForNext = 1500;
        xpInto = xp - t.xp_required_total;
      }
    } else {
      break;
    }
  }

  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInto / xpForNext) * 100)));
  return {
    level: currentLevel,
    xpIntoLevel: xpInto,
    xpForNextLevel: xpForNext,
    progressPercent,
  };
}

/**
 * Définition complète des 6 Rangs (Bois -> Diamant).
 * Chaque rang associe un emblème, un matériau tactile, un titre valorisant et des jalons précis.
 */
export const RANK_DEFINITIONS: Record<ProgressionRank, RankDefinition> = {
  wood: {
    rank: 'wood',
    name_fr: 'Bois',
    name_en: 'Wood',
    order: 0,
    required_level: 1,
    min_total_xp: 0,
    emblem_symbol: 'shield-outline',
    material_description: 'Noyer poli & nervures naturelles chaleureuses',
    title_unlocked: 'Initié du Vestiaire',
    milestones: [
      {
        milestone_key: 'm_wood_profile',
        title: 'Profil & Fiche de poste',
        description: 'Compléter sa position préférentielle et son pied fort dans son profil.',
        target_count: 1,
        requires_coach_validation: false,
      },
      {
        milestone_key: 'm_wood_journal',
        title: 'Premier carnet de bord',
        description: 'Enregistrer une première note de réflexion après un match ou un entraînement.',
        target_count: 1,
        requires_coach_validation: false,
      },
      {
        milestone_key: 'm_wood_checklist',
        title: 'Préparation du sac',
        description: 'Cocher et vérifier ses protège-tibias et équipements sur un événement.',
        target_count: 1,
        requires_coach_validation: false,
      },
      {
        milestone_key: 'm_wood_tactics',
        title: 'Compréhension du rôle',
        description: 'Consulter sa carte de rôle tactique et ses consignes de placement.',
        target_count: 1,
        requires_coach_validation: false,
      },
    ],
  },
  bronze: {
    rank: 'bronze',
    name_fr: 'Bronze',
    name_en: 'Bronze',
    order: 1,
    required_level: 3,
    min_total_xp: 250,
    emblem_symbol: 'ribbon-outline',
    material_description: 'Bronze brossé avec patine d’effort martelé',
    title_unlocked: 'Artisan de l’Entraînement',
    milestones: [
      {
        milestone_key: 'm_bronze_routine',
        title: 'Routine d’exercices',
        description: 'Compléter 2 exercices ou ateliers individuels prescrits.',
        target_count: 2,
        requires_coach_validation: false,
        independent_alternative: '2 séances techniques autonomes déclarées',
      },
      {
        milestone_key: 'm_bronze_presence',
        title: 'Assiduité et communication',
        description: 'Répondre à sa convocation pour 3 événements consécutifs du calendrier.',
        target_count: 3,
        requires_coach_validation: false,
      },
      {
        milestone_key: 'm_bronze_video',
        title: 'Analyse d’action',
        description: 'Visionner une séquence vidéo et ajouter un commentaire d’observation.',
        target_count: 1,
        requires_coach_validation: false,
      },
      {
        milestone_key: 'm_bronze_feedback',
        title: 'Dialogue technique',
        description: 'Envoyer une demande ciblée de feedback ou question de progression au coach.',
        target_count: 1,
        requires_coach_validation: false,
        independent_alternative: 'Auto-évaluation sur un match amical ou séance',
      },
    ],
  },
  silver: {
    rank: 'silver',
    name_fr: 'Argent',
    name_en: 'Silver',
    order: 2,
    required_level: 6,
    min_total_xp: 1000,
    emblem_symbol: 'medal-outline',
    material_description: 'Argent satiné aérodynamique & reflets chromés nets',
    title_unlocked: 'Compétiteur Régulier',
    milestones: [
      {
        milestone_key: 'm_silver_cycle',
        title: 'Cycle de développement validé',
        description: 'Compléter un programme individuel supervisé par le staff.',
        target_count: 1,
        requires_coach_validation: true,
        independent_alternative: 'Programme personnel complet 4 semaines validé en auto-évaluation',
      },
      {
        milestone_key: 'm_silver_tactics',
        title: 'Intégration tactique',
        description: 'Valider ses consignes sur coups de pied arrêtés ou phase de transition.',
        target_count: 1,
        requires_coach_validation: true,
        independent_alternative: 'Analyse tactique consignée dans le journal',
      },
      {
        milestone_key: 'm_silver_review',
        title: 'Auto-évaluation de mi-saison',
        description: 'Soumettre son bilan de mi-saison avec identification de ses axes de travail.',
        target_count: 1,
        requires_coach_validation: false,
      },
      {
        milestone_key: 'm_silver_specific',
        title: 'Séance spécifique',
        description: 'Suivre une séance d’entraînement spécifique (pied faible, endurance, coup franc).',
        target_count: 1,
        requires_coach_validation: false,
      },
    ],
  },
  gold: {
    rank: 'gold',
    name_fr: 'Or',
    name_en: 'Gold',
    order: 3,
    required_level: 10,
    min_total_xp: 2700,
    emblem_symbol: 'trophy-outline',
    material_description: 'Or éclatant poli miroir avec liseré d’excellence',
    title_unlocked: 'Cadre Tactique',
    milestones: [
      {
        milestone_key: 'm_gold_drills',
        title: 'Maîtrise technique validée',
        description: '3 exercices spécifiques validés avec observation favorable du coach.',
        target_count: 3,
        requires_coach_validation: true,
        independent_alternative: '3 ateliers filmés et auto-analysés dans le journal',
      },
      {
        milestone_key: 'm_gold_review',
        title: 'Revue de mi-saison conclue',
        description: 'Revue de mi-saison finalisée avec objectifs convenus avec le coach.',
        target_count: 1,
        requires_coach_validation: true,
        independent_alternative: 'Feuille de route personnelle semestrielle fixée',
      },
      {
        milestone_key: 'm_gold_peer',
        title: 'Perfectionnement entre coéquipiers',
        description: 'Organiser ou rejoindre une séance extra entre coéquipiers.',
        target_count: 1,
        requires_coach_validation: false,
      },
      {
        milestone_key: 'm_gold_consistency',
        title: 'Régularité exemplaire',
        description: 'Maintenir 4 semaines consécutives de régularité aux entraînements.',
        target_count: 4,
        requires_coach_validation: false,
      },
    ],
  },
  platinum: {
    rank: 'platinum',
    name_fr: 'Platine',
    name_en: 'Platinum',
    order: 4,
    required_level: 15,
    min_total_xp: 6000,
    emblem_symbol: 'diamond-outline',
    material_description: 'Platine pur aux reflets bleutés cyan & biseauté chirurgical',
    title_unlocked: 'Meneur d’Excellence',
    milestones: [
      {
        milestone_key: 'm_plat_passport',
        title: 'Passeport sportif vérifié',
        description: 'Générer son profil sportif partageable avec historique et statistiques officielles.',
        target_count: 1,
        requires_coach_validation: false,
      },
      {
        milestone_key: 'm_plat_cycles',
        title: 'Cycles répétés avec le staff',
        description: '5 exercices ou programmes techniques validés par le coach dans la saison.',
        target_count: 5,
        requires_coach_validation: true,
        independent_alternative: '5 cycles d’auto-entraînement documentés',
      },
      {
        milestone_key: 'm_plat_interview',
        title: 'Entretien individuel avec le coach',
        description: 'Réaliser un rendez-vous d’orientation ou de débriefing individuel avec le staff.',
        target_count: 1,
        requires_coach_validation: true,
        independent_alternative: 'Entretien avec tuteur ou préparateur',
      },
    ],
  },
  diamond: {
    rank: 'diamond',
    name_fr: 'Diamant',
    name_en: 'Diamond',
    order: 5,
    required_level: 20,
    min_total_xp: 11500,
    emblem_symbol: 'sparkles-outline',
    material_description: 'Diamant cristallin facetté réfractant la lumière du stade',
    title_unlocked: 'Référence du Club',
    milestones: [
      {
        milestone_key: 'm_diamond_mastery',
        title: 'Parcours d’excellence accompli',
        description: 'Accomplir l’ensemble des cycles de développement avec validation officielle du club.',
        target_count: 1,
        requires_coach_validation: true,
        independent_alternative: 'Bilan de fin de saison exhaustif certifié',
      },
    ],
  },
};

/**
 * Plafonds de répétition pour éviter le farming abusif.
 */
export const XP_REPETITION_CAPS = {
  max_journal_entries_per_day: 1,
  xp_journal_entry: 25,
  max_clip_reviews_per_week: 3,
  xp_clip_review: 35,
  max_checklist_per_event: 1,
  xp_checklist: 20,
  xp_feedback_request: 30,
  xp_coach_validated_exercise: 75,
  xp_mid_season_review_submission: 100,
  xp_coach_validated_review: 150,
  xp_extra_session_joined: 40,
};

/**
 * Catalogue d'objectifs types adaptés aux 4 familles de postes et aux joueurs sans club.
 */
export const OBJECTIVE_TEMPLATES: Array<
  Omit<ProgressionObjective, 'id' | 'player_uid' | 'created_at' | 'updated_at'>
> = [
  // Gardiens (GK)
  {
    template_id: 'obj_gk_aerial',
    title: 'Prise de balle aérienne & communication',
    action_description: 'Effectuer 10 sorties aériennes avec annonce vocale claire (« J’AI »).',
    purpose: 'Sécuriser la surface de réparation sur les centres et rassurer la charnière centrale.',
    measurable_condition: '10 prises sécurisées au point le plus haut sans faute.',
    category: 'technical',
    target_position: 'goalkeeper',
    is_coach_assigned: false,
    requires_coach_validation: true,
    xp_reward: 60,
    status: 'available',
    progress_current: 0,
    progress_target: 10,
    progress_unit: 'prises',
    action_kind: 'open_individual_program',
    milestone_key: 'm_bronze_routine',
  },
  {
    template_id: 'obj_gk_distribution',
    title: 'Relance courte pied gauche & pied droit',
    action_description: 'Travailler la première relance au sol sous pression latérale.',
    purpose: 'Assurer une sortie de balle propre vers les latéraux sans dégagement à l’aveugle.',
    measurable_condition: '2 séries de 8 passes appuyées précises pied gauche et pied droit.',
    category: 'technical',
    target_position: 'goalkeeper',
    is_coach_assigned: false,
    requires_coach_validation: true,
    xp_reward: 55,
    status: 'available',
    progress_current: 0,
    progress_target: 2,
    progress_unit: 'séries',
    action_kind: 'open_individual_program',
  },

  // Défenseurs (DEF)
  {
    template_id: 'obj_def_jockey',
    title: 'Cadrage et freinage en un contre un',
    action_description: 'Travailler la position de trois-quarts et l’orientation vers la touche.',
    purpose: 'Empêcher l’ailier de repiquer dans l’axe sans se jeter.',
    measurable_condition: 'Réaliser l’exercice d’appuis courts et recul-frein 6 fois.',
    category: 'technical',
    target_position: 'defender',
    is_coach_assigned: false,
    requires_coach_validation: true,
    xp_reward: 50,
    status: 'available',
    progress_current: 0,
    progress_target: 6,
    progress_unit: 'répétitions',
    action_kind: 'open_individual_program',
    milestone_key: 'm_bronze_routine',
  },
  {
    template_id: 'obj_def_tactics',
    title: 'Consigne d’alignement du bloc défensif',
    action_description: 'Consulter et valider les consignes de repli sur transition offensive adverse.',
    purpose: 'Conserver la compacité entre la ligne de 4 et le milieu de terrain.',
    measurable_condition: 'Lecture complète et validation de la carte de rôle tactique.',
    category: 'tactical',
    target_position: 'defender',
    is_coach_assigned: false,
    requires_coach_validation: false,
    xp_reward: 40,
    status: 'available',
    progress_current: 0,
    progress_target: 1,
    progress_unit: 'consigne',
    action_kind: 'open_tactical_role',
    milestone_key: 'm_wood_tactics',
  },

  // Milieux (MID)
  {
    template_id: 'obj_mid_scan',
    title: 'Prise d’information (Scan 360°) avant contrôle',
    action_description: 'Tourner la tête au moins deux fois avant de recevoir la passe pour identifier les espaces.',
    purpose: 'Gagner une seconde d’avance sur le pressing adverse et orienter le jeu vers l’avant.',
    measurable_condition: 'Atelier de contrôles orientés avec 15 prises d’infos réussies.',
    category: 'technical',
    target_position: 'midfielder',
    is_coach_assigned: false,
    requires_coach_validation: true,
    xp_reward: 60,
    status: 'available',
    progress_current: 0,
    progress_target: 15,
    progress_unit: 'passes',
    action_kind: 'open_individual_program',
    milestone_key: 'm_bronze_routine',
  },
  {
    template_id: 'obj_mid_tempo',
    title: 'Changement de rythme et jeu en une touche',
    action_description: 'Alterner jeu court d’attente et passe cassant une ligne défensive.',
    purpose: 'Désarçonner le bloc médian adverse lors des phases de possession.',
    measurable_condition: 'Valider l’exercice de combinaison axiale avec le coach.',
    category: 'tactical',
    target_position: 'midfielder',
    is_coach_assigned: false,
    requires_coach_validation: true,
    xp_reward: 55,
    status: 'available',
    progress_current: 0,
    progress_target: 1,
    progress_unit: 'atelier',
    action_kind: 'open_individual_program',
  },

  // Attaquants (FWD)
  {
    template_id: 'obj_fwd_runs',
    title: 'Appel contre-appel dans le dos des défenseurs',
    action_description: 'Créer l’espace par un leurre au premier poteau avant de plonger au second.',
    purpose: 'Se libérer du marquage individuel serré sur les centres tendus.',
    measurable_condition: '8 répétitions de courses croisées synchronisées avec le centreur.',
    category: 'technical',
    target_position: 'forward',
    is_coach_assigned: false,
    requires_coach_validation: true,
    xp_reward: 60,
    status: 'available',
    progress_current: 0,
    progress_target: 8,
    progress_unit: 'courses',
    action_kind: 'open_individual_program',
    milestone_key: 'm_bronze_routine',
  },
  {
    template_id: 'obj_fwd_weak_foot',
    title: 'Finition rapide pied faible',
    action_description: 'Enchaîner contrôle orienté et frappe cadrée sans réajustement d’appui.',
    purpose: 'Être imprévisible et capable de finaliser dans les 16m des deux côtés.',
    measurable_condition: '10 frappes cadrées du pied faible à mi-distance.',
    category: 'technical',
    target_position: 'forward',
    is_coach_assigned: false,
    requires_coach_validation: true,
    xp_reward: 55,
    status: 'available',
    progress_current: 0,
    progress_target: 10,
    progress_unit: 'frappes',
    action_kind: 'open_individual_program',
  },

  // Universels & Préparation / Réflexion
  {
    template_id: 'obj_uni_checklist',
    title: 'Checklist matériel d’avant-match',
    action_description: 'Préparer et vérifier ses protège-tibias, chaussures et tenue officielle.',
    purpose: 'Arriver serein au vestiaire sans oubli préjudiciable pour la compétition.',
    measurable_condition: 'Tous les éléments obligatoires cochés dans la checklist d’événement.',
    category: 'match_preparation',
    target_position: 'universal',
    is_coach_assigned: false,
    requires_coach_validation: false,
    xp_reward: 25,
    status: 'available',
    progress_current: 0,
    progress_target: 1,
    progress_unit: 'sac vérifié',
    action_kind: 'open_checklist',
    milestone_key: 'm_wood_checklist',
  },
  {
    template_id: 'obj_uni_journal',
    title: 'Débriefing d’après-séance dans le carnet',
    action_description: 'Rédiger ses sensations, points forts et axes d’amélioration.',
    purpose: 'Développer sa lucidité sportive et ancrer les apprentissages de la séance.',
    measurable_condition: 'Une note consignée dans son journal personnel de football.',
    category: 'reflection',
    target_position: 'universal',
    is_coach_assigned: false,
    requires_coach_validation: false,
    xp_reward: 25,
    status: 'available',
    progress_current: 0,
    progress_target: 1,
    progress_unit: 'note',
    action_kind: 'open_journal',
    milestone_key: 'm_wood_journal',
  },
  {
    template_id: 'obj_uni_video_review',
    title: 'Visionnage et analyse d’une séquence vidéo',
    action_description: 'Visionner un clip de match et noter une observation tactique ou technique.',
    purpose: 'Développer son sens du placement par l’analyse vidéo objective.',
    measurable_condition: 'Un clip analysé avec commentaire horodaté validé.',
    category: 'tactical',
    target_position: 'universal',
    is_coach_assigned: false,
    requires_coach_validation: false,
    xp_reward: 35,
    status: 'available',
    progress_current: 0,
    progress_target: 1,
    progress_unit: 'clip',
    action_kind: 'open_video_clips',
    milestone_key: 'm_bronze_video',
  },
  {
    template_id: 'obj_uni_mid_season_review',
    title: 'Bilan de mi-saison et objectifs',
    action_description: 'Compléter son auto-évaluation semestrielle et définir 2 objectifs clés.',
    purpose: 'Mesurer sa trajectoire d’évolution et s’aligner avec le projet du club.',
    measurable_condition: 'Bilan de mi-saison soumis au coach.',
    category: 'reflection',
    target_position: 'universal',
    is_coach_assigned: false,
    requires_coach_validation: false,
    xp_reward: 100,
    status: 'available',
    progress_current: 0,
    progress_target: 1,
    progress_unit: 'bilan',
    action_kind: 'open_mid_season_review',
    milestone_key: 'm_silver_review',
  },
];

/**
 * Filtre les modèles d'objectifs pertinents selon le poste et le niveau.
 */
export function getRecommendedObjectivesForPlayer(
  position?: string,
  currentRank: ProgressionRank = 'wood',
): typeof OBJECTIVE_TEMPLATES {
  const normalizedPos = (position || '').toLowerCase();
  let family: ObjectivePositionFamily = 'universal';
  if (normalizedPos.includes('gardien') || normalizedPos.includes('goal') || normalizedPos === 'gk') {
    family = 'goalkeeper';
  } else if (
    normalizedPos.includes('défense') ||
    normalizedPos.includes('latéral') ||
    normalizedPos.includes('central') ||
    normalizedPos === 'def'
  ) {
    family = 'defender';
  } else if (
    normalizedPos.includes('milieu') ||
    normalizedPos.includes('relayeur') ||
    normalizedPos.includes('meneur') ||
    normalizedPos === 'mid'
  ) {
    family = 'midfielder';
  } else if (
    normalizedPos.includes('attaquant') ||
    normalizedPos.includes('ailier') ||
    normalizedPos.includes('buteur') ||
    normalizedPos.includes('avant') ||
    normalizedPos === 'fwd'
  ) {
    family = 'forward';
  }

  return OBJECTIVE_TEMPLATES.filter(
    (t) => t.target_position === 'universal' || t.target_position === family,
  );
}
