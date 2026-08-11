import type { HomeExercise } from '../models/HomeTraining';

/** Bibliothèque seed — exercices réalisables hors stade. */
export const HOME_EXERCISE_LIBRARY: HomeExercise[] = [
  {
    id: 'ball-mastery-solo',
    title: 'Conduite de balle dans un carré',
    summary: 'Garde le ballon collé au pied en zigzag sur 4 plots (ou 4 chaussures).',
    modes: ['solo'],
    age_min: 7,
    age_max: 18,
    positions: ['AT', 'MO', 'AD', 'AG', 'MC'],
    focus: ['technique', 'coordination'],
    difficulty: 'facile',
    duration_min: 12,
    reps_label: '4 × 90 s · 30 s de repos',
    equipment: ['1 ballon', '4 plots ou objets pour marquer un carré (~4 m)'],
    instructions: [
      'Trace un carré d’environ 4 m de côté.',
      'Conduis le ballon à l’intérieur sans sortir.',
      'Alternez pied droit / pied gauche toutes les 20 secondes.',
      'Garde la tête relevée autant que possible.',
    ],
    tips: ['Commence lentement, accélère quand le ballon est maîtrisé.'],
  },
  {
    id: 'passing-wall-family',
    title: 'Passes au mur avec un parent',
    summary: 'Contrôle + passe précise. Le parent ou un frère compte les passes réussies.',
    modes: ['family', 'partner'],
    age_min: 6,
    age_max: 14,
    positions: ['AT', 'MO', 'AD', 'AG', 'MC', 'DC', 'DG', 'DD'],
    focus: ['technique', 'finition'],
    difficulty: 'facile',
    duration_min: 15,
    reps_label: '3 × 40 passes · 1 min de repos',
    equipment: ['1 ballon', 'Un mur ou panneau solide', '1 partenaire'],
    instructions: [
      'Place-toi à 5–8 m du mur.',
      'Passe dans le mur, contrôle, repasse.',
      'Le partenaire compte les passes propres (premier contrôle réussi).',
      'Change de pied toutes les 10 passes.',
    ],
    tips: ['Le parent peut se placer en « mur vivant » si pas de mur disponible.'],
  },
  {
    id: 'agility-ladder-solo',
    title: 'Échelle d’agilité au jardin',
    summary: 'Frappes de pieds rapides dans une échelle (ou traits à la craie).',
    modes: ['solo'],
    age_min: 8,
    age_max: 17,
    positions: ['AT', 'MO', 'AD', 'AG', 'DC', 'DG', 'DD'],
    focus: ['vitesse', 'coordination', 'physique'],
    difficulty: 'moyen',
    duration_min: 10,
    reps_label: '6 allers · 45 s de récupération',
    equipment: ['Échelle d’agilité ou craie / scotch au sol', 'Chronomètre téléphone'],
    instructions: [
      'Un pied par case, rapide et léger.',
      'Reviens en trottinant.',
      '2e série : deux pieds par case.',
      '3e série : latéral.',
    ],
    tips: ['Surface plane, chaussures de sport. Évite le béton glissant.'],
  },
  {
    id: 'finishing-city',
    title: 'Finition city-stade',
    summary: 'Enchaînement contrôle + frappe sur but (ou cible) en city.',
    modes: ['solo', 'partner'],
    age_min: 10,
    age_max: 19,
    positions: ['AT', 'MO', 'AD', 'AG'],
    focus: ['finition', 'technique'],
    difficulty: 'moyen',
    duration_min: 20,
    reps_label: '5 × 8 frappes · 1 min entre séries',
    equipment: ['1 ballon', 'City-stade ou but miniature', 'Optionnel : 1 partenaire pour servir'],
    instructions: [
      'Place le ballon à 12–16 m.',
      'Contrôle orienté puis frappe cadrée.',
      'Alterne angle intérieur / extérieur du pied.',
      'Avec partenaire : passes en retrait puis frappe.',
    ],
    tips: ['Respecte les autres usagers du city. Hydrate-toi.'],
  },
  {
    id: 'keeper-reaction-family',
    title: 'Réflexes gardien avec un parent',
    summary: 'Le parent envoie des ballons (ou une balle tennis) à mi-hauteur.',
    modes: ['family', 'partner'],
    age_min: 8,
    age_max: 18,
    positions: ['GB'],
    focus: ['gardien', 'coordination'],
    difficulty: 'moyen',
    duration_min: 15,
    reps_label: '4 × 12 arrêts · 1 min de repos',
    equipment: ['1 ballon foot ou tennis', 'Gants (optionnel)', '1 partenaire'],
    instructions: [
      'Position de base : genoux fléchis, mains prêtes.',
      'Le partenaire lance 12 ballons à mi-hauteur.',
      'Attrape, replace, recommence.',
      'Varie gauche / droite.',
    ],
    tips: ['Commence doucement pour le parent et le joueur.'],
  },
  {
    id: 'core-strength-solo',
    title: 'Gainage foot à la maison',
    summary: 'Circuit gainage sans matériel lourd — préparation physique légère.',
    modes: ['solo'],
    age_min: 12,
    age_max: 40,
    positions: ['AT', 'MO', 'AD', 'AG', 'MC', 'DC', 'DG', 'DD', 'GB'],
    focus: ['physique', 'mental'],
    difficulty: 'facile',
    duration_min: 12,
    reps_label: '3 tours · 40 s effort / 20 s repos',
    equipment: ['Tapis ou serviette', 'Chronomètre'],
    instructions: [
      'Planche face au sol 40 s.',
      'Planche latérale droite 40 s.',
      'Planche latérale gauche 40 s.',
      'Repos 20 s entre chaque.',
    ],
    tips: ['Respiration régulière. Arrête si douleur au dos.'],
  },
  {
    id: '1v1-partner',
    title: 'Duel 1 contre 1 (petit espace)',
    summary: 'Dribble + protection du ballon sur 8×8 m avec un ami.',
    modes: ['partner'],
    age_min: 9,
    age_max: 18,
    positions: ['AT', 'MO', 'AD', 'AG', 'MC'],
    focus: ['technique', 'vitesse'],
    difficulty: 'difficile',
    duration_min: 18,
    reps_label: '8 duels de 45 s · 30 s de repos',
    equipment: ['1 ballon', '4 plots / objets', '1 partenaire'],
    instructions: [
      'Trace un carré ~8 m.',
      'Attaquant protège le ballon 45 s.',
      'Défenseur essaie de récupérer sans faute.',
      'Inversez les rôles.',
    ],
    tips: ['Fair-play. Pas de tacles glissés sur bitume.'],
  },
];

export function filterHomeExercises(opts: {
  age?: number;
  position?: string;
  mode?: HomeExercise['modes'][number];
  focus?: HomeExercise['focus'][number];
  query?: string;
}): HomeExercise[] {
  const q = opts.query?.trim().toLowerCase() ?? '';
  return HOME_EXERCISE_LIBRARY.filter((ex) => {
    if (opts.age != null && (opts.age < ex.age_min || opts.age > ex.age_max)) return false;
    if (opts.position && !ex.positions.includes(opts.position)) return false;
    if (opts.mode && !ex.modes.includes(opts.mode)) return false;
    if (opts.focus && !ex.focus.includes(opts.focus)) return false;
    if (!q) return true;
    const hay = [ex.title, ex.summary, ...ex.equipment, ...ex.focus].join(' ').toLowerCase();
    return hay.includes(q);
  });
}
