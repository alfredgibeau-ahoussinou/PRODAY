import type { IconName } from '../components/ui/Icon';
import type { HealthPoleGroupId } from '../utils/healthPoleSpecialties';

export type HealthServiceCard = {
  id: string;
  title: string;
  body: string;
  icon: IconName;
};

export type HealthInjuryPath = {
  id: string;
  label: string;
  hint: string;
  focus: string;
};

export type HealthPoleContent = {
  id: HealthPoleGroupId;
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: IconName;
  whenToConsult: string[];
  services: HealthServiceCard[];
  injuryPaths?: HealthInjuryPath[];
  bookingHint: string;
};

export const HEALTH_POLE_CONTENT: Record<HealthPoleGroupId, HealthPoleContent> = {
  kine_osteo: {
    id: 'kine_osteo',
    eyebrow: 'Rééducation & mobilité',
    title: 'Kiné & ostéo',
    subtitle:
      'Blessures, douleurs articulaires et retour au terrain. Rééducation structurée et suivi de la mobilité.',
    icon: 'walk',
    whenToConsult: [
      'Douleur persistante après un match ou entraînement',
      'Entorse, claquage ou gêne au genou / cheville',
      'Raideur, blocage ou perte d’amplitude',
      'Reprise progressive après arrêt',
    ],
    services: [
      {
        id: 'reeduc',
        title: 'Rééducation',
        body: 'Protocole post-blessure, renforcement ciblé et reprise des appuis.',
        icon: 'heart',
      },
      {
        id: 'prevention',
        title: 'Prévention',
        body: 'Bilan de charge, mobilité et conseils avant la reprise intensive.',
        icon: 'shield',
      },
      {
        id: 'osteo',
        title: 'Ostéopathie sport',
        body: 'Posture, chaînes musculaires et récupération globale de l’athlète.',
        icon: 'person',
      },
      {
        id: 'retour',
        title: 'Retour au jeu',
        body: 'Feuille de route avec le staff pour valider la reprise.',
        icon: 'football',
      },
    ],
    injuryPaths: [
      { id: 'knee', label: 'Genou', hint: 'LCA, ménisque, tendinite', focus: 'Rééducation genou' },
      { id: 'ankle', label: 'Cheville', hint: 'Entorse, instabilité', focus: 'Cheville & appui' },
      { id: 'muscle', label: 'Musculaire', hint: 'Claquage, courbature', focus: 'Récupération musculaire' },
      { id: 'back', label: 'Dos / hanche', hint: 'Lombalgie, pubalgie', focus: 'Chaîne postérieure' },
    ],
    bookingHint: 'Réservez un créneau en ligne ou échangez par messagerie avec le praticien.',
  },
  medecin_prepa: {
    id: 'medecin_prepa',
    eyebrow: 'Médecine & performance',
    title: 'Médecin & prépa physique',
    subtitle:
      'Aptitude sportive, suivi médical, charge d’entraînement et préparation physique individualisée.',
    icon: 'shield',
    whenToConsult: [
      'Visite médicale ou certificat d’aptitude',
      'Reprise après blessure validée par le staff',
      'Plan de préparation physique (saison / pré-saison)',
      'Gestion de la charge et prévention des surcharges',
    ],
    services: [
      {
        id: 'aptitude',
        title: 'Aptitude & bilans',
        body: 'Visites sport, ECG, tests fonctionnels et feu vert médical.',
        icon: 'shield',
      },
      {
        id: 'charge',
        title: 'Charge & perf',
        body: 'Planification des cycles, tests physiques et suivi de la fatigue.',
        icon: 'football',
      },
      {
        id: 'reathle',
        title: 'Réathlétisation',
        body: 'Coordination médicale / prépa pour le retour à l’intensité match.',
        icon: 'walk',
      },
      {
        id: 'prevention',
        title: 'Prévention club',
        body: 'Accompagnement des effectifs, U17 à senior, sur la saison.',
        icon: 'people',
      },
    ],
    bookingHint: 'Les médecins et préparateurs peuvent proposer des créneaux ou un premier échange.',
  },
  mental: {
    id: 'mental',
    eyebrow: 'Préparation mentale',
    title: 'Coach mental',
    subtitle:
      'Confiance, gestion du stress et routines de match. Travailler la tête autant que le corps.',
    icon: 'shield',
    whenToConsult: [
      'Stress ou trac avant match ou compétition importante',
      'Baisse de confiance ou pression de résultat',
      'Difficulté à se concentrer ou à gérer les émotions en jeu',
      'Reprise après blessure : retrouver le plaisir et l’intensité',
    ],
    services: [
      {
        id: 'pressure',
        title: 'Gestion de la pression',
        body: 'Techniques de respiration, ancrage et routine pré-match.',
        icon: 'shield',
      },
      {
        id: 'confidence',
        title: 'Confiance & focus',
        body: 'Visualisation, objectifs de séance et dialogue intérieur positif.',
        icon: 'heart',
      },
      {
        id: 'team',
        title: 'Cohésion & leadership',
        body: 'Communication vestiaire, rôles dans le groupe et prise de décision.',
        icon: 'people',
      },
      {
        id: 'return',
        title: 'Retour au jeu',
        body: 'Accompagnement psychologique après blessure ou période difficile.',
        icon: 'walk',
      },
    ],
    bookingHint: 'Échangez avec un coach mental pour un premier bilan ou un suivi régulier.',
  },
  nutrition: {
    id: 'nutrition',
    eyebrow: 'Alimentation & récupération',
    title: 'Nutrition sportive',
    subtitle:
      'Plans alimentaires, hydratation et récupération. Fuel votre performance sur toute la saison.',
    icon: 'heart',
    whenToConsult: [
      'Plan nutrition avant match, tournoi ou double séance',
      'Reprise après blessure ou période de convalescence',
      'Prise ou perte de masse en pré-saison',
      'Fatigue récurrente, crampes ou récupération lente',
    ],
    services: [
      {
        id: 'matchday',
        title: 'Jour de match',
        body: 'Timing des repas, collation et hydratation avant / pendant / après.',
        icon: 'football',
      },
      {
        id: 'season',
        title: 'Plan saison',
        body: 'Menus hebdomadaires, charges d’entraînement et compléments ciblés.',
        icon: 'document',
      },
      {
        id: 'recovery',
        title: 'Récupération',
        body: 'Protéines, glucides, sommeil et hydratation entre les séances.',
        icon: 'time',
      },
      {
        id: 'hydration',
        title: 'Hydratation',
        body: 'Besoins selon la météo, l’intensité et la durée des efforts.',
        icon: 'heart',
      },
    ],
    bookingHint: 'Contactez un nutritionniste pour un plan alimentaire personnalisé.',
  },
  podologie: {
    id: 'podologie',
    eyebrow: 'Pied & appui',
    title: 'Podologie sportive',
    subtitle:
      'Semelles, chaussures et analyse de la foulée. Prévenir et traiter les douleurs du pied en sport.',
    icon: 'walk',
    whenToConsult: [
      'Douleur plantaire, métatarsalgie ou épine calcanéenne',
      'Ampoules récurrentes ou ongles noirs après match',
      'Instabilité de cheville liée à l’appui ou aux chaussures',
      'Bilan avant reprise ou changement de surface (synthétique / naturel)',
    ],
    services: [
      {
        id: 'bilan',
        title: 'Bilan de marche',
        body: 'Analyse statique et dynamique de la foulée sur terrain.',
        icon: 'walk',
      },
      {
        id: 'semelles',
        title: 'Semelles sur mesure',
        body: 'Orthèses adaptées à votre poste, surface et morphologie.',
        icon: 'person',
      },
      {
        id: 'chaussures',
        title: 'Chaussures sport',
        body: 'Conseils crampons, maintien et rotation selon la saison.',
        icon: 'football',
      },
      {
        id: 'prevention',
        title: 'Prévention',
        body: 'Soins des pieds, renforcement et gestion des charges d’appui.',
        icon: 'shield',
      },
    ],
    injuryPaths: [
      { id: 'plantar', label: 'Plantaire', hint: 'Fasciite, épine', focus: 'Appui & semelles' },
      { id: 'forefoot', label: 'Avant-pied', hint: 'Métatarsalgie', focus: 'Répartition des appuis' },
      { id: 'ankle', label: 'Cheville', hint: 'Instabilité, entorse', focus: 'Stabilisation & chaussure' },
      { id: 'nails', label: 'Ongles & peau', hint: 'Ampoules, bleus', focus: 'Soins & prévention' },
    ],
    bookingHint: 'Prenez rendez-vous avec un podologue du sport pour un bilan complet.',
  },
};

export const HEALTH_WELLBEING_TIPS = [
  {
    icon: 'heart' as const,
    title: 'Échauffement',
    body: '15 min avant l’effort : mobilité, activation musculaire et montée progressive en intensité.',
  },
  {
    icon: 'time' as const,
    title: 'Récupération',
    body: 'Sommeil, hydratation et étirements légers dans les 24 h après un match intense.',
  },
  {
    icon: 'shield' as const,
    title: 'Prévention',
    body: 'Signalez toute douleur persistante tôt. Mieux vaut consulter avant la blessure.',
  },
  {
    icon: 'walk' as const,
    title: 'Charge',
    body: 'Alternez intensité et récupération : votre corps progresse dans les phases de repos.',
  },
];

export type HealthFaqCategory =
  | 'entrainement'
  | 'recuperation'
  | 'blessures'
  | 'nutrition'
  | 'mental';

export type HealthFaqItem = {
  id: string;
  category: HealthFaqCategory;
  question: string;
  answer: string;
};

export const HEALTH_FAQ_CATEGORIES: { id: HealthFaqCategory; label: string }[] = [
  { id: 'entrainement', label: 'Entraînement & match' },
  { id: 'recuperation', label: 'Récupération' },
  { id: 'blessures', label: 'Blessures & prévention' },
  { id: 'nutrition', label: 'Nutrition & hydratation' },
  { id: 'mental', label: 'Mental' },
];

export const HEALTH_FAQ: HealthFaqItem[] = [
  {
    id: 'warmup',
    category: 'entrainement',
    question: 'Combien de temps faut-il s’échauffer avant un match ?',
    answer:
      'Comptez 15 à 20 minutes : mobilité articulaire, activation musculaire (fentes, montées de genoux), puis 2 à 3 accélérations progressives. L’objectif est d’arriver en sueur légère, sans fatigue.',
  },
  {
    id: 'cooldown',
    category: 'entrainement',
    question: 'Faut-il faire un retour au calme après l’effort ?',
    answer:
      'Oui, 10 minutes de footing léger et d’étirements dynamiques aident à réduire les courbatures. Évitez les étirements forcés sur une blessure fraîche.',
  },
  {
    id: 'sleep',
    category: 'recuperation',
    question: 'Combien de sommeil pour bien récupérer ?',
    answer:
      'Visez 8 à 9 h par nuit en période de compétition. Le sommeil est le principal levier de récupération musculaire et de concentration avant match.',
  },
  {
    id: 'rest-day',
    category: 'recuperation',
    question: 'Que faire les jours sans entraînement ?',
    answer:
      'Marche, vélo léger ou natation douce. Évitez le repos total prolongé : une activité légère accélère la récupération sans ajouter de fatigue.',
  },
  {
    id: 'pain-play',
    category: 'blessures',
    question: 'Puis-je jouer avec une douleur ?',
    answer:
      'Une gêne légère et stable peut parfois être gérée avec l’avis du staff. Une douleur qui augmente à l’effort, qui réveille la nuit ou qui limite l’amplitude : arrêtez et consultez.',
  },
  {
    id: 'when-physio',
    category: 'blessures',
    question: 'Quand consulter un kiné ou un ostéo ?',
    answer:
      'Dès qu’une douleur dure plus de 48 h, après une entorse, ou si vous sentez un blocage articulaire. Mieux vaut un bilan précoce qu’une blessure qui s’installe sur la saison.',
  },
  {
    id: 'stretch',
    category: 'blessures',
    question: 'Les étirements évitent-ils les blessures ?',
    answer:
      'La mobilité et l’échauffement complet sont plus efficaces que les longs étirements statiques avant match. Travaillez la souplesse en fin de séance, à froid.',
  },
  {
    id: 'match-meal',
    category: 'nutrition',
    question: 'Que manger avant un match ?',
    answer:
      'Repas riche en glucides complexes 3 h avant (pâtes, riz, pommes de terre), collation légère 1 h avant si besoin (banane, compote). Évitez les graisses et les fibres en excès.',
  },
  {
    id: 'hydration',
    category: 'nutrition',
    question: 'Comment bien s’hydrater ?',
    answer:
      'Buvez régulièrement dans la journée, pas seulement à la soif. En match : petites gorgées à chaque pause. Après l’effort : eau + source de glucides et protéines dans l’heure.',
  },
  {
    id: 'stress',
    category: 'mental',
    question: 'Comment gérer le stress avant un match important ?',
    answer:
      'Préparez une routine fixe (musique, visualisation, respiration 4-4-6). Concentrez-vous sur des objectifs de processus (« bien défendre », « premier toucher propre ») plutôt que le score.',
  },
  {
    id: 'confidence',
    category: 'mental',
    question: 'Comment retrouver la confiance après une mauvaise série ?',
    answer:
      'Revenez à des objectifs courts, notez 3 points positifs après chaque séance et parlez-en à votre coach ou à un préparateur mental. La confiance se reconstruit par petites victoires.',
  },
];
