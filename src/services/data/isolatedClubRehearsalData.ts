/**
 * Données canoniques pour la Répétition Générale d'Essai Club (Club Rehearsal)
 *
 * Environnement strictement isolé :
 * - Club fictif dédié : Étoile Sportive Rehearsal (id: club_rehearsal_etoile_77)
 * - Aucune dépendance sur le club démo 'SC ProDay Demo'
 * - Aucun compte réel ni mot de passe commis en clair
 * - 4 enregistrements canoniques réutilisés tout au long de la répétition
 */

export interface RehearsalAccount {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'coach' | 'player' | 'parent' | 'supporter' | 'user';
  club_id: string | null;
  team_id?: string | null;
  is_minor?: boolean;
  linked_child_uid?: string;
}

export const REHEARSAL_CLUB = {
  id: 'club_rehearsal_etoile_77',
  name: 'Étoile Sportive Rehearsal 77',
  short_name: 'ES Rehearsal',
  fff_affiliation_number: '582910',
  league: 'Ligue de Paris Île-de-France',
  district: 'District du Val-de-Marne',
  stadium: 'Stade Municipal de la Grâce, 94370 Sucy-en-Brie',
  logo_url: 'https://proday75.fr/assets/demo-club-crest.png',
} as const;

export const REHEARSAL_TEAMS = {
  u17: {
    id: 'team_rehearsal_u17',
    club_id: REHEARSAL_CLUB.id,
    name: 'U17 Départemental 1',
    category: 'U17',
    division: 'D1 Poule A',
  },
  seniors: {
    id: 'team_rehearsal_seniors',
    club_id: REHEARSAL_CLUB.id,
    name: 'Seniors Régional 3',
    category: 'Seniors',
    division: 'R3 Poule B',
  },
} as const;

export const REHEARSAL_ACCOUNTS: Record<string, RehearsalAccount> = {
  admin: {
    uid: 'uid_rehearsal_admin',
    email: 'admin.rehearsal@proday-trial.local',
    displayName: 'Marc V. (Président / Admin Club)',
    role: 'admin',
    club_id: REHEARSAL_CLUB.id,
  },
  coach: {
    uid: 'uid_rehearsal_coach',
    email: 'coach.rehearsal@proday-trial.local',
    displayName: 'Coach Karim (Éducateur U17)',
    role: 'coach',
    club_id: REHEARSAL_CLUB.id,
    team_id: REHEARSAL_TEAMS.u17.id,
  },
  adultPlayer: {
    uid: 'uid_rehearsal_player_adult',
    email: 'player.adult.rehearsal@proday-trial.local',
    displayName: 'Thomas L. (Attaquant Seniors)',
    role: 'player',
    club_id: REHEARSAL_CLUB.id,
    team_id: REHEARSAL_TEAMS.seniors.id,
    is_minor: false,
  },
  minorPlayer: {
    uid: 'uid_rehearsal_player_minor',
    email: 'player.minor.rehearsal@proday-trial.local',
    displayName: 'Léo M. (Milieu U17 - Mineur)',
    role: 'player',
    club_id: REHEARSAL_CLUB.id,
    team_id: REHEARSAL_TEAMS.u17.id,
    is_minor: true,
  },
  parent: {
    uid: 'uid_rehearsal_parent',
    email: 'parent.rehearsal@proday-trial.local',
    displayName: 'Claire M. (Parent vérifié de Léo)',
    role: 'parent',
    club_id: REHEARSAL_CLUB.id,
    linked_child_uid: 'uid_rehearsal_player_minor',
  },
  noClubUser: {
    uid: 'uid_rehearsal_noclub',
    email: 'noclub.rehearsal@proday-trial.local',
    displayName: 'Alex B. (Joueur libre / Sans club)',
    role: 'user',
    club_id: null,
  },
  communityUser: {
    uid: 'uid_rehearsal_community',
    email: 'community.rehearsal@proday-trial.local',
    displayName: 'Samir D. (Supporter / Communauté)',
    role: 'supporter',
    club_id: null,
  },
} as const;

/** 4 Enregistrements canoniques partagés */
export const REHEARSAL_CANONICAL_RECORDS = {
  /** 1. Séance d'entraînement avec exercice et schéma */
  trainingSession: {
    id: 'event_training_u17_pressing',
    club_id: REHEARSAL_CLUB.id,
    team_id: REHEARSAL_TEAMS.u17.id,
    title: 'Sortie de balle sous pressing haut & relance courte',
    event_type: 'training' as const,
    date_start: new Date(Date.now() + 86400000).toISOString(),
    location: 'Terrain Honneur synthétique, Stade de la Grâce',
    exercise_name: 'Drill 4v2 + appui-soutien en transition rapide',
    exercise_instructions:
      'Objectif : casser la première ligne adverse en 3 touches maximum. Maintenir la largeur et fixer le porteur.',
    diagram_id: 'diagram_drill_u17_pressing',
  },

  /** 2. Match officiel avec composition et consignes privées */
  matchEvent: {
    id: 'event_match_u17_vs_montreuil',
    club_id: REHEARSAL_CLUB.id,
    team_id: REHEARSAL_TEAMS.u17.id,
    title: 'U17 D1 : ES Rehearsal vs AS Montreuil',
    event_type: 'match' as const,
    opponent: 'AS Montreuil',
    date_start: new Date(Date.now() + 3 * 86400000).toISOString(),
    location: 'Stade Municipal de Montreuil, 93100 Montreuil',
    lineup_system: '4-3-3',
    lineup_published: true,
    coach_private_notes: 'Attention au n°9 adverse : joueur rapide sur les ballons en profondeur.',
  },

  /** 3. Objectif individuel de développement (Quête Football) */
  developmentObjective: {
    id: 'obj_u17_prise_de_balle_orientee',
    club_id: REHEARSAL_CLUB.id,
    team_id: REHEARSAL_TEAMS.u17.id,
    player_uid: REHEARSAL_ACCOUNTS.minorPlayer.uid,
    coach_uid: REHEARSAL_ACCOUNTS.coach.uid,
    title: 'Prise de balle orientée vers l’avant sous pression',
    category: 'technical' as const,
    action_description:
      'Travailler 20 enchaînements contrôle orienté pied intérieur + passe claquée en moins de 2 secondes.',
    measurable_condition: '2 séries de 10 répétitions consécutives réussies',
    xp_reward: 120,
    requires_coach_validation: true,
  },

  /** 4. Demande administrative de document */
  documentRequest: {
    id: 'doc_req_certificat_medical_u17',
    club_id: REHEARSAL_CLUB.id,
    target_uid: REHEARSAL_ACCOUNTS.minorPlayer.uid,
    parent_uid: REHEARSAL_ACCOUNTS.parent.uid,
    title: 'Certificat Médical & Questionnaire Santé FFF 2026-2027',
    document_type: 'medical_form' as const,
    required: true,
  },
} as const;
