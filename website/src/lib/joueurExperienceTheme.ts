/**
 * Thème dynamique page Joueur — miroir de `src/utils/joueurExperienceTheme.ts`
 * (source de vérité mobile). Aligner freePass / copy avant toute invention marketing.
 */

export type JoueurAgeGroup = "youth" | "teen" | "adult";
export type JoueurGenderVisual = "male" | "female" | "neutral";
export type JoueurPositionGroup =
  | "goalkeeper"
  | "defender"
  | "midfielder"
  | "forward"
  | "unknown";

export type JoueurVisualStyle =
  | "warm_playful"
  | "dynamic_competitive"
  | "precise_performance";

export type JoueurSceneKind = "pitch_playful" | "pitch_dynamic" | "pitch_data";

export interface JoueurProfileHints {
  /** Âge en années si déjà calculé. */
  age?: number | null;
  /** Date de naissance — source prioritaire. */
  birthDate?: Date | string | null;
  gender?: string | null;
  position?: string | null;
}

export interface JoueurWeekBeat {
  id: string;
  day: string;
  chip: string;
  title: string;
  body: string;
}

export interface JoueurExperienceTheme {
  ageGroup: JoueurAgeGroup;
  gender: JoueurGenderVisual;
  position: JoueurPositionGroup;
  isMinor: boolean;
  visualStyle: JoueurVisualStyle;
  animationIntensity: "soft" | "medium" | "high";
  /** CSS variables merged into page accent (keep ProDay blue family). */
  ambiance: {
    glow: string;
    wash: string;
    sceneTint: string;
  };
  copy: {
    brand: string;
    heroHeadline: string;
    heroSupport: string;
    primaryCta: string;
    secondaryCta: string;
    sceneKicker: string;
    sceneTitle: string;
    sceneBody: string;
    trainingKicker: string;
    trainingTitle: string;
    trainingBody: string;
    weekKicker: string;
    weekTitle: string;
    weekSubtitle: string;
    stageKicker: string;
    stageTitle: string;
    freePassKicker: string;
    freePassTitle: string;
    freePassSubtitle: string;
    ctaKicker: string;
    ctaTitle: string;
    ctaBody: string;
    parentNote?: string;
    dashboardLabels: string[];
  };
  weekBeats: JoueurWeekBeat[];
  imagery: {
    hero: string;
    scene: string;
    training: string;
    accent: string;
  };
  scene: {
    kind: JoueurSceneKind;
    motifs: string[];
  };
  positionMotif: string;
}

function ageFromBirthDate(birth: Date | string): number | null {
  const d = birth instanceof Date ? birth : new Date(birth);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

export function resolvePlayerAgeYears(
  hints: JoueurProfileHints,
): number | null {
  if (hints.birthDate) {
    const fromBirth = ageFromBirthDate(hints.birthDate);
    if (fromBirth != null) return fromBirth;
  }
  if (hints.age != null && Number.isFinite(hints.age)) {
    return Number(hints.age);
  }
  return null;
}

export function resolveJoueurAgeGroup(
  hints: JoueurProfileHints,
): JoueurAgeGroup {
  const age = resolvePlayerAgeYears(hints);
  if (age == null) return "adult";
  if (age < 13) return "youth";
  if (age < 18) return "teen";
  return "adult";
}

export function resolveJoueurGenderVisual(
  gender?: string | null,
): JoueurGenderVisual {
  if (!gender) return "neutral";
  const g = gender.toLowerCase().trim();
  if (
    g === "women" ||
    g === "woman" ||
    g === "female" ||
    g === "f" ||
    g === "fille" ||
    g === "femme"
  ) {
    return "female";
  }
  if (
    g === "men" ||
    g === "man" ||
    g === "male" ||
    g === "m" ||
    g === "garçon" ||
    g === "garcon" ||
    g === "homme"
  ) {
    return "male";
  }
  return "neutral";
}

export function resolveJoueurPositionGroup(
  position?: string | null,
): JoueurPositionGroup {
  if (!position) return "unknown";
  const p = position
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/gardien|goal|gk|gb/.test(p)) return "goalkeeper";
  if (/defens|defence|back|lateral|arriere|cb|dc/.test(p)) return "defender";
  if (/milieu|mid|meneur|relayeur|mc|md|mg/.test(p)) return "midfielder";
  if (/attaqu|forward|ailier|buteur|striker|avant|wing/.test(p)) return "forward";
  return "unknown";
}

const POSITION_MOTIFS: Record<JoueurPositionGroup, string> = {
  goalkeeper: "Cage · réflexes · arrêts",
  defender: "Duels · interception · placement",
  midfielder: "Passes · vision · contrôle",
  forward: "Finition · vitesse · but",
  unknown: "Terrain · progression · match",
};

function pickImagery(
  ageGroup: JoueurAgeGroup,
  gender: JoueurGenderVisual,
  position: JoueurPositionGroup,
): JoueurExperienceTheme["imagery"] {
  const woman = gender === "female";
  const heroPool = woman
    ? [
        "/images/football-women-01.jpg",
        "/showcase/woman/woman-match.jpg",
        "/showcase/woman/woman-discover-hero.jpg",
        "/showcase/woman/woman-profile.jpg",
      ]
    : [
        "/images/football-amateur-01.jpg",
        "/images/football-action-01.jpg",
        "/images/football-pro-01.jpg",
        "/images/football-training-01.jpg",
      ];

  const sceneByAge =
    ageGroup === "youth"
      ? woman
        ? "/images/football-family-01.jpg"
        : "/images/football-pitch-01.jpg"
      : ageGroup === "teen"
        ? woman
          ? "/showcase/woman/woman-match.jpg"
          : "/images/football-match-01.jpg"
        : woman
          ? "/showcase/woman/woman-arena.jpg"
          : "/images/football-stadium-night-01.jpg";

  const trainingByPos =
    position === "goalkeeper"
      ? "/images/football-training-01.jpg"
      : position === "defender"
        ? "/images/football-team-01.jpg"
        : position === "forward"
          ? woman
            ? "/showcase/woman/woman-match.jpg"
            : "/images/football-action-01.jpg"
          : woman
            ? "/showcase/woman/woman-exp-team.jpg"
            : "/images/football-boots-01.jpg";

  const accent =
    ageGroup === "youth"
      ? "/images/football-trophy-01.jpg"
      : ageGroup === "teen"
        ? "/images/football-tactics-01.jpg"
        : woman
          ? "/showcase/woman/woman-mercato.jpg"
          : "/images/football-pro-01.jpg";

  const heroIndex =
    ageGroup === "youth" ? 0 : ageGroup === "teen" ? 1 : 2;

  return {
    hero: heroPool[heroIndex] ?? heroPool[0]!,
    scene: sceneByAge,
    training: trainingByPos,
    accent,
  };
}

const WEEK_YOUTH: JoueurWeekBeat[] = [
  {
    id: "lun",
    day: "Lun",
    chip: "Défi",
    title: "Ton prochain défi",
    body: "Un petit exercice pied faible. Amuse-toi et progresse.",
  },
  {
    id: "mar",
    day: "Mar",
    chip: "Séance",
    title: "Prêt pour ton prochain entraînement ?",
    body: "Avec ton équipe ou à la maison. Tu confirmes en un tap.",
  },
  {
    id: "mer",
    day: "Mer",
    chip: "Covoit",
    title: "Qui te dépose ?",
    body: "Places restantes, message au conducteur. Simple pour toi et tes parents.",
  },
  {
    id: "jeu",
    day: "Jeu",
    chip: "Étoiles",
    title: "Continue comme ça !",
    body: "Tu vois ta progression : défis validés, présence, petits objectifs.",
  },
  {
    id: "ven",
    day: "Ven",
    chip: "Prépa",
    title: "Avant le week-end",
    body: "Léger échauffement, chaussures prêtes, et go.",
  },
  {
    id: "sam",
    day: "Sam",
    chip: "Match",
    title: "Ton prochain match",
    body: "Le score, tes potes, le terrain. Tu joues, ProDay suit.",
  },
  {
    id: "dim",
    day: "Dim",
    chip: "Bravo",
    title: "Bien joué cette semaine",
    body: "Message d’équipe, photos, et demain on recommence.",
  },
];

const WEEK_TEEN: JoueurWeekBeat[] = [
  {
    id: "lun",
    day: "Lun",
    chip: "Objectif",
    title: "Ton prochain objectif",
    body: "Travaille tes points faibles. Passe au niveau supérieur.",
  },
  {
    id: "mar",
    day: "Mar",
    chip: "Séance",
    title: "Entraînement ciblé",
    body: "Présence, exercices, consignes coach. Construis ta progression.",
  },
  {
    id: "mer",
    day: "Mer",
    chip: "Covoit",
    title: "Trajet + équipe",
    body: "Places, chat conducteur, et tu restes focus sur le match.",
  },
  {
    id: "jeu",
    day: "Jeu",
    chip: "Stats",
    title: "Ton niveau cette semaine",
    body: "Minutes, buts, passes. Défie-toi sur un indicateur clair.",
  },
  {
    id: "ven",
    day: "Ven",
    chip: "Prépa",
    title: "Améliore ta finition",
    body: "Dernière séance légère, consignes, check matériel.",
  },
  {
    id: "sam",
    day: "Sam",
    chip: "Match",
    title: "Analyse ta performance",
    body: "Le match, le fil, tes stats. Tu construis ton parcours.",
  },
  {
    id: "dim",
    day: "Dim",
    chip: "Bilan",
    title: "Ta progression",
    body: "Retour coach, highlights, et objectifs pour la semaine suivante.",
  },
];

const WEEK_ADULT: JoueurWeekBeat[] = [
  {
    id: "lun",
    day: "Lun",
    chip: "Objectif",
    title: "Objectifs de la semaine",
    body: "Développe ton potentiel avec des cibles mesurables.",
  },
  {
    id: "mar",
    day: "Mar",
    chip: "Séance",
    title: "Préparation",
    body: "Charge, consignes, présence. Optimise ta performance.",
  },
  {
    id: "mer",
    day: "Mer",
    chip: "Logistique",
    title: "Covoiturage & planning",
    body: "Trajets liés aux séances. Moins de friction, plus de focus.",
  },
  {
    id: "jeu",
    day: "Jeu",
    chip: "Data",
    title: "Statistiques",
    body: "Minutes, heatmaps, tendances. Analyse tes données.",
  },
  {
    id: "ven",
    day: "Ven",
    chip: "Prépa",
    title: "Préparation match",
    body: "Activation, matériel, briefing. Environnement de performance.",
  },
  {
    id: "sam",
    day: "Sam",
    chip: "Match",
    title: "Performance du dernier match",
    body: "Score, actions clés, historique. Les données suivent le terrain.",
  },
  {
    id: "dim",
    day: "Dim",
    chip: "Revue",
    title: "Analyse & progression",
    body: "Bilan, objectifs, et préparation du cycle suivant.",
  },
];

function copyFor(
  ageGroup: JoueurAgeGroup,
  gender: JoueurGenderVisual,
  isMinor: boolean,
): JoueurExperienceTheme["copy"] {
  const isF = gender === "female";
  const playerWord = isF ? "joueuse" : gender === "male" ? "joueur" : "joueur";
  const roleLabel = isF ? "Joueuse" : "Joueur";
  const examples = isF
    ? "des joueuses qui progressent chaque semaine"
    : "des joueurs qui construisent leur parcours";

  if (ageGroup === "youth") {
    return {
      brand: `Pro Day ${roleLabel}`,
      heroHeadline: isF ? "Prête à progresser ?" : "Prêt à progresser ?",
      heroSupport: isF
        ? "Ton prochain défi, ton prochain match, ton pied faible — ProDay t’accompagne comme une vraie footballeuse en devenir."
        : "Ton prochain défi, ton prochain match, ton pied faible — ProDay t’accompagne comme un vrai footballeur en devenir.",
      primaryCta: "Créer mon compte",
      secondaryCta: "Voir l’entraînement",
      sceneKicker: "Ton terrain",
      sceneTitle: isF ? "Ton mini-stade de joueuse" : "Ton mini-stade de joueur",
      sceneBody:
        "Ballon, terrain, défis et petites victoires. Ludique, jamais bébé — tu es déjà sur le terrain.",
      trainingKicker: "Je veux m’entraîner",
      trainingTitle: "Amuse-toi et progresse",
      trainingBody: isF
        ? "Chez toi, avec ta famille, ou avec une coach. Des exercices clairs, adaptés à ton âge."
        : "Chez toi, avec ta famille, ou avec un coach. Des exercices clairs, adaptés à ton âge.",
      weekKicker: "Une semaine type",
      weekTitle: "Juste ton foot.",
      weekSubtitle: `Défis, matchs, covoit — simple et positif pour une ${playerWord}.`,
      stageKicker: "Sur le terrain",
      stageTitle: "Ton match commence ici.",
      freePassKicker: "Clair et net",
      freePassTitle: "Gratuit pour jouer.",
      freePassSubtitle:
        "Pass 3,99 €/mois = assistant IA. Coach humain ≈ 30 €/h à la séance.",
      ctaKicker: "On y va",
      ctaTitle: "Crée ton compte.\nRejoins ton équipe.",
      ctaBody: "Gratuit pour démarrer. Tu es au centre — avec tes parents si besoin.",
      parentNote: isMinor
        ? "Espace parent : informations autorisées, sans exposer de données sensibles."
        : undefined,
      dashboardLabels: [
        "Prochain entraînement",
        "Prochain match",
        "Défis",
        "Objectifs simples",
        "Progression",
        isF ? "Équipe filles" : "Équipe",
      ],
    };
  }

  if (ageGroup === "teen") {
    return {
      brand: `Pro Day ${roleLabel}`,
      heroHeadline: "Passe au niveau supérieur.",
      heroSupport: isF
        ? `Construis ton parcours de joueuse : objectifs, stats, séances et matchs. Immersif, compétitif, 100 % foot.`
        : `Construis ton parcours de joueur : objectifs, stats, séances et matchs. Immersif, compétitif, 100 % foot.`,
      primaryCta: "Créer mon compte",
      secondaryCta: "Voir l’entraînement",
      sceneKicker: "Ta scène",
      sceneTitle: "Terrain + stats + vitesse",
      sceneBody: `Comme ${examples} — moderne, dynamique, jamais enfantin.`,
      trainingKicker: "Je veux m’entraîner",
      trainingTitle: "Travaille tes points faibles",
      trainingBody:
        "À la maison, en famille ou avec un coach à l’heure. Des séances qui nourrissent ton parcours.",
      weekKicker: "Une semaine type",
      weekTitle: "Je construis mon parcours.",
      weekSubtitle: "Stats, objectifs, performances — motivant et social.",
      stageKicker: "Sur le terrain",
      stageTitle: "Défie-toi.",
      freePassKicker: "Clair et net",
      freePassTitle: "Gratuit pour jouer.",
      freePassSubtitle: "Pass 3,99 € optionnel : heatmaps, vidéo, objectifs avancés.",
      ctaKicker: "On y va",
      ctaTitle: "Crée ton compte.\nConstruis ta progression.",
      ctaBody: `Espace ${playerWord} ProDay — cool, sportif, immersif.`,
      parentNote: isMinor
        ? "Les parents accèdent aux infos autorisées depuis leur espace dédié."
        : undefined,
      dashboardLabels: [
        "Statistiques",
        "Progression",
        "Objectifs",
        "Performances",
        "Entraînements",
        "Temps de jeu",
        isF ? "Comparaisons joueuses" : "Comparaisons joueurs",
      ],
    };
  }

  return {
    brand: `Pro Day ${roleLabel}`,
    heroHeadline: "Optimise ta performance.",
    heroSupport: isF
      ? "Analyse, objectifs, statistiques et préparation — un environnement de performance moderne pour joueuses, élégant et immersif."
      : "Analyse, objectifs, statistiques et préparation — un environnement de performance football moderne, élégant et immersif.",
    primaryCta: "Créer mon compte",
    secondaryCta: "Voir l’entraînement",
    sceneKicker: "Performance",
    sceneTitle: "Terrain, data, analyse",
    sceneBody:
      "Visualisations, historique et progression. Sérieux sans être froid — toujours ProDay.",
    trainingKicker: "Entraînement",
    trainingTitle: "Développe ton potentiel",
    trainingBody:
      "Programmes à domicile, séances famille, coaching humain à l’heure. Data-driven, jamais gadget.",
    weekKicker: "Cycle type",
    weekTitle: "Performance & préparation.",
    weekSubtitle: "Stats avancées, analyse, historique — précis et sportif.",
    stageKicker: "Sur le terrain",
    stageTitle: "Analyse ta performance.",
    freePassKicker: "Offre",
    freePassTitle: "Gratuit pour jouer.",
    freePassSubtitle: "Pass optionnel 3,99 € : heatmaps, analyse vidéo, passeport recruteur.",
    ctaKicker: "Démarrer",
    ctaTitle: "Crée ton compte.\nRejoins ton équipe.",
    ctaBody: `Environnement de performance pour ${playerWord}. Identité ProDay inchangée.`,
    dashboardLabels: [
      "Statistiques avancées",
      "Analyse de performance",
      "Historique",
      "Objectifs",
      "Entraînement",
      "Données de performance",
      isF ? "Benchmarks féminins" : "Benchmarks",
    ],
  };
}

/** Résout le thème complet à partir du profil (ou fallback sûr). */
export function resolveJoueurExperienceTheme(
  hints: JoueurProfileHints = {},
): JoueurExperienceTheme {
  const ageGroup = resolveJoueurAgeGroup(hints);
  const gender = resolveJoueurGenderVisual(hints.gender);
  const position = resolveJoueurPositionGroup(hints.position);
  const age = resolvePlayerAgeYears(hints);
  const isMinor = age != null ? age < 18 : ageGroup !== "adult";

  const visualStyle: JoueurVisualStyle =
    ageGroup === "youth"
      ? "warm_playful"
      : ageGroup === "teen"
        ? "dynamic_competitive"
        : "precise_performance";

  const sceneKind: JoueurSceneKind =
    ageGroup === "youth"
      ? "pitch_playful"
      : ageGroup === "teen"
        ? "pitch_dynamic"
        : "pitch_data";

  const ambiance =
    ageGroup === "youth"
      ? {
          glow: "rgba(0, 140, 255, 0.38)",
          wash: "rgba(34, 197, 94, 0.12)",
          sceneTint: "rgba(250, 204, 21, 0.08)",
        }
      : ageGroup === "teen"
        ? {
            glow: "rgba(0, 108, 252, 0.45)",
            wash: "rgba(76, 139, 255, 0.16)",
            sceneTint: "rgba(14, 165, 233, 0.1)",
          }
        : {
            glow: "rgba(0, 84, 240, 0.32)",
            wash: "rgba(15, 23, 42, 0.35)",
            sceneTint: "rgba(148, 163, 184, 0.06)",
          };

  return {
    ageGroup,
    gender,
    position,
    isMinor,
    visualStyle,
    animationIntensity:
      ageGroup === "youth" ? "soft" : ageGroup === "teen" ? "high" : "medium",
    ambiance,
    copy: copyFor(ageGroup, gender, isMinor),
    weekBeats:
      ageGroup === "youth"
        ? WEEK_YOUTH
        : ageGroup === "teen"
          ? WEEK_TEEN
          : WEEK_ADULT,
    imagery: pickImagery(ageGroup, gender, position),
    scene: {
      kind: sceneKind,
      motifs:
        ageGroup === "youth"
          ? ["ballon", "mini-terrain", "progression", "défis"]
          : ageGroup === "teen"
            ? ["terrain", "stats", "vitesse", "objectifs"]
            : ["heatmap", "données", "graphiques", "analyse"],
    },
    positionMotif: POSITION_MOTIFS[position],
  };
}

/** Parse query string pour tests QA (jamais un sélecteur de style utilisateur). */
export function joueurHintsFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): JoueurProfileHints {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const ageRaw = get("age");
  const age = ageRaw != null && ageRaw !== "" ? Number(ageRaw) : null;
  return {
    age: age != null && Number.isFinite(age) ? age : null,
    birthDate: get("birth") ?? get("birthDate") ?? null,
    gender: get("gender") ?? get("g") ?? null,
    position: get("position") ?? get("pos") ?? null,
  };
}

/** Profils de smoke-test couvrant tous les cas demandés. */
export const JOUEUR_THEME_SMOKE_PROFILES: {
  id: string;
  hints: JoueurProfileHints;
}[] = [
  { id: "boy-u13", hints: { age: 11, gender: "men", position: "attaquant" } },
  { id: "girl-u13", hints: { age: 10, gender: "women", position: "milieu" } },
  { id: "boy-teen", hints: { age: 15, gender: "men", position: "défenseur" } },
  { id: "girl-teen", hints: { age: 16, gender: "women", position: "gardien" } },
  { id: "man-adult", hints: { age: 24, gender: "men", position: "milieu" } },
  { id: "woman-adult", hints: { age: 22, gender: "women", position: "attaquant" } },
  { id: "unknown-age", hints: { gender: "men", position: "défenseur" } },
  { id: "unknown-gender", hints: { age: 14, position: "ailier" } },
  { id: "unknown-position", hints: { age: 19, gender: "women" } },
  { id: "empty", hints: {} },
];
