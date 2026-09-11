import type { JoueurAgeGroup, JoueurGenderVisual } from '../../utils/joueurExperienceTheme';

/** Catalogues — défis / quêtes différenciés par âge (et genre pour Youth). */

export type JoueurChallengeDef = {
  id: string;
  title: string;
  body: string;
  xp: number;
};

export function getJoueurYouthChallenges(
  gender: JoueurGenderVisual,
): JoueurChallengeDef[] {
  const isF = gender === 'female';
  return [
    {
      id: 'pied-faible',
      title: isF ? 'Pied magique' : 'Pied faible',
      body: isF ? '10 touches douces' : '10 touches contrôlées',
      xp: 3,
    },
    {
      id: 'dribbles',
      title: isF ? 'Slalom fun' : 'Dribbles',
      body: isF ? 'Slalom léger à la maison' : 'Slalom maison ou jardin',
      xp: 2,
    },
    {
      id: 'passes',
      title: isF ? 'Passes amies' : 'Passes',
      body: isF ? 'Avec une amie ou un parent' : 'Avec un parent / frère / sœur',
      xp: 4,
    },
    {
      id: 'vitesse',
      title: isF ? 'Course lapin' : 'Vitesse',
      body: isF ? '5 petites courses' : '5 sprints courts',
      xp: 3,
    },
  ];
}

/** @deprecated Prefer getJoueurYouthChallenges(gender) */
export const JOUEUR_YOUTH_CHALLENGES = getJoueurYouthChallenges('neutral');

export function getJoueurYouthInfoBlocks(gender: JoueurGenderVisual) {
  const isF = gender === 'female';
  return [
    {
      id: 'home',
      title: isF ? 'Atelier maison' : 'Entraînement maison',
      body: isF
        ? 'Mini-défis clairs, fun, adaptés à ton âge — seule ou en famille.'
        : 'Exercices courts, clairs, adaptés à ton âge. Seul ou en famille.',
    },
    {
      id: 'pass',
      title: 'Coach IA',
      body: isF
        ? 'Pose tes questions foot — réponses simples pour progresser comme une joueuse.'
        : 'Pose tes questions foot — réponses simples pour progresser.',
    },
    {
      id: 'coach',
      title: 'Coach humain (~30 €/h)',
      body: 'Un vrai coach, payé à la séance. Tarif du coach, sans abo forcé.',
    },
    {
      id: 'parents',
      title: 'Parents',
      body: isF
        ? 'Ils voient seulement ce qui est autorisé — tu restes au centre du jeu.'
        : 'Ils voient seulement ce qui est autorisé — toi tu restes au centre.',
    },
  ] as const;
}

/** @deprecated Prefer getJoueurYouthInfoBlocks(gender) */
export const JOUEUR_YOUTH_INFO_BLOCKS = getJoueurYouthInfoBlocks('neutral');

export const JOUEUR_PASS_PRICE = '3,99 €';
export const JOUEUR_COACH_PRICE = '~30 €';

/** Quêtes quotidiennes — boucle gameplay cross-onglets. */
export type JoueurDailyQuestDef = {
  id: string;
  title: string;
  body: string;
  xp: number;
  stars: number;
  /** Onglet suggéré pour accomplir la quête. */
  tabHint?: 'home' | 'matchs' | 'feed' | 'recrutement' | 'profil' | 'covoiturage';
};

const QUESTS_YOUTH: JoueurDailyQuestDef[] = [
  {
    id: 'daily-login',
    title: 'Bonjour aventure',
    body: 'Ouvre ton monde du jour',
    xp: 15,
    stars: 1,
    tabHint: 'home',
  },
  {
    id: 'daily-train',
    title: 'Mini-défi',
    body: 'Fais un exercice étoile',
    xp: 35,
    stars: 2,
    tabHint: 'home',
  },
  {
    id: 'daily-match',
    title: 'Voir mes matchs',
    body: 'Regarde ton calendrier',
    xp: 20,
    stars: 1,
    tabHint: 'matchs',
  },
  {
    id: 'daily-card',
    title: 'Ma carte',
    body: 'Regarde ton profil joueur',
    xp: 15,
    stars: 1,
    tabHint: 'profil',
  },
];

const QUESTS_TEEN: JoueurDailyQuestDef[] = [
  {
    id: 'daily-login',
    title: 'Connexion classée',
    body: 'Ouvre ta base du jour',
    xp: 15,
    stars: 1,
    tabHint: 'home',
  },
  {
    id: 'daily-train',
    title: 'Session XP',
    body: 'Lance un entraînement',
    xp: 40,
    stars: 2,
    tabHint: 'home',
  },
  {
    id: 'daily-match',
    title: 'Voir matchs',
    body: 'Consulte tes matchs',
    xp: 25,
    stars: 1,
    tabHint: 'matchs',
  },
  {
    id: 'daily-squad',
    title: 'Voir groupe',
    body: 'Passe voir ton équipe',
    xp: 20,
    stars: 1,
    tabHint: 'recrutement',
  },
  {
    id: 'daily-coach',
    title: 'Coach IA',
    body: 'Une question tactique pour monter',
    xp: 30,
    stars: 1,
    tabHint: 'feed',
  },
];

const QUESTS_ADULT: JoueurDailyQuestDef[] = [
  {
    id: 'daily-login',
    title: 'Échauffement',
    body: 'Ouvre ta session Pro',
    xp: 15,
    stars: 1,
    tabHint: 'home',
  },
  {
    id: 'daily-train',
    title: 'Session terrain',
    body: 'Lance un entraînement terrain ou individuel',
    xp: 40,
    stars: 2,
    tabHint: 'home',
  },
  {
    id: 'daily-match',
    title: 'Centre Match',
    body: 'Consulte calendrier / live / ligue',
    xp: 25,
    stars: 1,
    tabHint: 'matchs',
  },
  {
    id: 'daily-card',
    title: 'Passeport carte',
    body: 'Vérifie ta carte & note',
    xp: 20,
    stars: 1,
    tabHint: 'profil',
  },
  {
    id: 'daily-squad',
    title: 'Groupe',
    body: 'Passe voir ton club / groupe',
    xp: 20,
    stars: 1,
    tabHint: 'recrutement',
  },
  {
    id: 'daily-coach',
    title: 'Conseil Coach',
    body: 'Question tactique / amélioration',
    xp: 30,
    stars: 1,
    tabHint: 'feed',
  },
];

/** Quêtes daily selon l’âge — boucles de jeu distinctes. */
export function getJoueurDailyQuests(ageGroup: JoueurAgeGroup): JoueurDailyQuestDef[] {
  if (ageGroup === 'youth') return QUESTS_YOUTH;
  if (ageGroup === 'teen') return QUESTS_TEEN;
  return QUESTS_ADULT;
}

/** @deprecated Prefer getJoueurDailyQuests(age) */
export const JOUEUR_DAILY_QUESTS = QUESTS_ADULT;

/** Objectifs saison Ultimate (adult) — claimables. */
export const JOUEUR_SEASON_OBJECTIVES = [
  { id: 'season-train-3', title: '3 sessions', body: 'Enchaîne 3 entraînements', xp: 80, stars: 3 },
  { id: 'season-streak-3', title: 'Série ×3', body: 'Joue 3 jours d’affilée', xp: 60, stars: 2 },
  { id: 'season-ovr-70', title: 'NOTE 70+', body: 'Monte ta note cosmétique', xp: 100, stars: 4 },
] as const;

/** Objectifs ranked teen. */
export const JOUEUR_RANKED_OBJECTIVES = [
  { id: 'ranked-mission-3', title: '3 missions', body: 'Valide 3 missions semaine', xp: 50, stars: 2 },
  { id: 'ranked-streak-2', title: 'Série ×2', body: 'Connecte-toi 2 jours de suite', xp: 40, stars: 2 },
] as const;
