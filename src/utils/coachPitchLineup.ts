import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isCoachPitchFormation,
  pitchSlotCount,
  type CoachPitchFormation,
} from './formationPitch';
import type { TacticalAnimationDirective } from './coachTacticalDirectives';

const STORAGE_PREFIX = 'proday.coach.sporteasy.lineup.v1:';
const PRESETS_STORAGE_PREFIX = 'proday.coach.sporteasy.presets.v1:';

export type CoachPitchLineup = {
  formation: CoachPitchFormation;
  starterUids: (string | null)[];
};

export type CoachTacticalPreset = {
  id: string;
  name: string;
  badge?: string;
  formation: CoachPitchFormation;
  starterUids: (string | null)[];
  directive: TacticalAnimationDirective;
  description?: string;
  aiRationale?: string;
  keyInstructions?: string[];
};

export function emptyCoachPitchLineup(
  formation: CoachPitchFormation = '4-3-3',
): CoachPitchLineup {
  return {
    formation,
    starterUids: Array.from({ length: pitchSlotCount(formation) }, () => null),
  };
}

export function normalizeCoachPitchLineup(
  raw: Partial<CoachPitchLineup> | null | undefined,
  rosterUids: string[],
): CoachPitchLineup {
  const formation = isCoachPitchFormation(raw?.formation ?? '')
    ? raw!.formation!
    : '4-3-3';
  const n = pitchSlotCount(formation);
  const roster = new Set(rosterUids);
  const seen = new Set<string>();
  const starterUids = Array.from({ length: n }, (_, i) => {
    const uid = raw?.starterUids?.[i];
    if (!uid || !roster.has(uid) || seen.has(uid)) return null;
    seen.add(uid);
    return uid;
  });
  return { formation, starterUids };
}

export function benchUidsForLineup(
  lineup: CoachPitchLineup,
  rosterUids: string[],
): string[] {
  const onPitch = new Set(lineup.starterUids.filter((uid): uid is string => Boolean(uid)));
  return rosterUids.filter((uid) => !onPitch.has(uid));
}

export function startersPlacedCount(lineup: CoachPitchLineup): number {
  return lineup.starterUids.filter(Boolean).length;
}

/** Premier chargement : remplit le XI depuis l’effectif si la compo est vide. */
export function autofillCoachPitchLineup(
  lineup: CoachPitchLineup,
  rosterUids: string[],
): CoachPitchLineup {
  if (startersPlacedCount(lineup) > 0 || rosterUids.length === 0) return lineup;
  const n = pitchSlotCount(lineup.formation);
  return {
    ...lineup,
    starterUids: Array.from({ length: n }, (_, i) => rosterUids[i] ?? null),
  };
}

/** Place un joueur (banc ou terrain) sur un cran ; échange si déjà titulaire. */
export function assignUidToSlot(
  lineup: CoachPitchLineup,
  uid: string,
  slotIndex: number,
): CoachPitchLineup {
  if (slotIndex < 0 || slotIndex >= lineup.starterUids.length) return lineup;
  const starterUids = [...lineup.starterUids];
  const prevIndex = starterUids.indexOf(uid);
  const displaced = starterUids[slotIndex];
  starterUids[slotIndex] = uid;
  if (prevIndex >= 0 && prevIndex !== slotIndex) {
    starterUids[prevIndex] = displaced ?? null;
  }
  return { ...lineup, starterUids };
}

export function clearPitchSlot(
  lineup: CoachPitchLineup,
  slotIndex: number,
): CoachPitchLineup {
  if (slotIndex < 0 || slotIndex >= lineup.starterUids.length) return lineup;
  const starterUids = [...lineup.starterUids];
  starterUids[slotIndex] = null;
  return { ...lineup, starterUids };
}

export function swapPitchSlots(
  lineup: CoachPitchLineup,
  a: number,
  b: number,
): CoachPitchLineup {
  if (a === b) return lineup;
  if (a < 0 || b < 0 || a >= lineup.starterUids.length || b >= lineup.starterUids.length) {
    return lineup;
  }
  const starterUids = [...lineup.starterUids];
  const tmp = starterUids[a];
  starterUids[a] = starterUids[b];
  starterUids[b] = tmp;
  return { ...lineup, starterUids };
}

export function changeCoachPitchFormation(
  lineup: CoachPitchLineup,
  next: CoachPitchFormation,
): CoachPitchLineup {
  if (next === lineup.formation) return lineup;
  const n = pitchSlotCount(next);
  const starterUids = Array.from({ length: n }, (_, i) => lineup.starterUids[i] ?? null);
  return { formation: next, starterUids };
}

export function coachPitchStorageKey(teamId: string): string {
  return `${STORAGE_PREFIX}${teamId}`;
}

export function coachPresetsStorageKey(teamId: string): string {
  return `${PRESETS_STORAGE_PREFIX}${teamId}`;
}

export async function loadCoachPitchLineup(
  teamId: string,
): Promise<Partial<CoachPitchLineup> | null> {
  try {
    const raw = await AsyncStorage.getItem(coachPitchStorageKey(teamId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CoachPitchLineup>;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCoachPitchLineup(
  teamId: string,
  lineup: CoachPitchLineup,
): Promise<void> {
  try {
    await AsyncStorage.setItem(coachPitchStorageKey(teamId), JSON.stringify(lineup));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Génère les compositions par défaut pour une équipe */
export function buildDefaultCoachPresets(rosterUids: string[]): CoachTacticalPreset[] {
  const get11 = (offset = 0) => {
    const arr: (string | null)[] = [];
    for (let i = 0; i < 11; i++) {
      arr.push(rosterUids[(i + offset) % Math.max(1, rosterUids.length)] ?? null);
    }
    return arr;
  };

  return [
    {
      id: 'equipe_type',
      name: '11 Type (4-3-3)',
      badge: 'Étoile',
      formation: '4-3-3',
      starterUids: get11(0),
      directive: 'projection',
      description: 'Composition équilibrée avec maîtrise du ballon et percussion sur les ailes.',
      aiRationale: 'Schéma classique favorisant les dédoublements latéraux et l’occupation haute du terrain.',
      keyInstructions: [
        'Dédoublement systématique des latéraux',
        'Relance courte vers les relayeurs axiaux',
        'Attaquant axial en fixation des deux centraux adverses',
      ],
    },
    {
      id: 'pressing_haut',
      name: 'Pressing Tout-Terrain (4-2-3-1)',
      badge: '⚡ Intensité',
      formation: '4-2-3-1',
      starterUids: get11(0),
      directive: 'pressing',
      description: 'Récupération haute agressive et verticalité immédiate dès la perte.',
      aiRationale: 'Double pivot défensif stabilisateur et pressing coordonné du bloc offensif dès les 30 mètres adverses.',
      keyInstructions: [
        'Cadrage agressif dès la première passe adverse',
        'Fermeture de l’axe par le meneur et le numéro 9',
        'Transition offensive directe en moins de 3 passes',
      ],
    },
    {
      id: 'bloc_compact',
      name: 'Bloc Compact & Contre (3-5-2)',
      badge: '🛡️ Solidité',
      formation: '3-5-2',
      starterUids: get11(0),
      directive: 'bloc',
      description: 'Densité axiale maximale et contre-attaques rapides dans les espaces.',
      aiRationale: 'Défense à 3 protégée par 5 milieux pour asphyxier les attaques adverses et exploser en transition.',
      keyInstructions: [
        'Coulissement latéral compact sans ouvrir d’intervalles',
        'Pistons en appui-soutien sur les couloirs',
        'Recherche rapide du duo d’attaques sur les seconds ballons',
      ],
    },
    {
      id: 'rotation_b',
      name: 'Rotation & Temps de Jeu (4-4-2)',
      badge: '🔄 Rotation',
      formation: '4-4-2',
      starterUids: get11(4),
      directive: 'none',
      description: 'Structure simple et rigoureuse pour donner du temps de jeu et préserver les cadres.',
      aiRationale: 'Structure en lignes serrées 4-4-2 facilitant les repères collectifs des joueurs de rotation.',
      keyInstructions: [
        'Lignes défensive et médiane très rapprochées',
        'Simplicité technique et jeu vers l’avant sans risque',
        'Communication constante entre les deux pointes',
      ],
    },
  ];
}

export async function loadCoachPitchPresets(
  teamId: string,
  rosterUids: string[],
): Promise<CoachTacticalPreset[]> {
  try {
    const raw = await AsyncStorage.getItem(coachPresetsStorageKey(teamId));
    if (raw) {
      const parsed = JSON.parse(raw) as CoachTacticalPreset[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    /* fallback defaults */
  }
  return buildDefaultCoachPresets(rosterUids);
}

export async function saveCoachPitchPresets(
  teamId: string,
  presets: CoachTacticalPreset[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(coachPresetsStorageKey(teamId), JSON.stringify(presets));
  } catch {
    /* ignore */
  }
}

import { resolveJoueurPositionGroup } from './joueurExperienceTheme';
import { parseFormationLines } from './formationPitch';

export type AiLineupRequestType =
  | 'ideal'
  | 'offensive'
  | 'defensive'
  | 'counter'
  | 'rotation'
  | 'custom';

export type AiMatchAnalysis = {
  overallScore: number;
  chemistryScore: number;
  fitnessScore: number;
  expectedGoals: string;
  attackScore: number;
  midfieldScore: number;
  defenseScore: number;
  keeperScore: number;
  strengths: string;
  focusPoint: string;
  keyRoles: {
    captainUid?: string | null;
    freeKickUid?: string | null;
    penaltyUid?: string | null;
  };
  recommendedSubs: Array<{
    minute: number;
    title: string;
    subInUid: string;
    subOutUid: string;
    rationale: string;
  }>;
};

/**
 * Moteur IA Coach pour générer intelligemment une composition
 */
export function generateAiLineup(
  roster: Array<{ uid: string; name: string; position?: string }>,
  requestType: AiLineupRequestType,
  customPrompt?: string,
): {
  name: string;
  formation: CoachPitchFormation;
  directive: TacticalAnimationDirective;
  starterUids: (string | null)[];
  aiRationale: string;
  keyInstructions: string[];
} {
  const promptLower = (customPrompt || '').toLowerCase();
  const matchFormation = customPrompt?.match(/\b([1-5](?:-[1-5]){1,4})\b/);

  // Determine requested formation from custom prompt if present
  let formation: CoachPitchFormation = '4-3-3';
  let directive: TacticalAnimationDirective = 'projection';
  let name = '11 Idéal IA (4-3-3)';
  let aiRationale =
    "Le 4-3-3 offre la meilleure couverture du terrain et favorise la possession offensive avec des dédoublements sur les côtés.";
  let keyInstructions = [
    'Dédoublement systématique des latéraux offensifs',
    'Sentinelle en couverture des deux relayeurs',
    'Ailiers rentrants pour frapper ou centrer au second poteau',
  ];

  if (matchFormation && matchFormation[1]) {
    formation = matchFormation[1];
    name = `Compo IA • ${formation}`;
    if (formation.startsWith('5-') || formation === '3-5-2' || formation === '4-5-1') {
      directive = 'bloc';
      aiRationale = `Organisation ultra solide en ${formation} avec verrouillage axial et relances directes.`;
    } else if (formation.includes('4-2-3-1') || formation === '4-3-3' || formation === '3-4-3' || formation === '4-2-4') {
      directive = 'pressing';
      aiRationale = `Schéma en ${formation} conçu pour imposer une forte pression haute et une transition tranchante.`;
    } else {
      directive = 'projection';
      aiRationale = `Structure en ${formation} équilibrant la largeur et la verticalité offensive.`;
    }
  } else if (promptLower.includes('4-2-3-1') || requestType === 'offensive') {
    formation = '4-2-3-1';
    directive = 'pressing';
    name = 'Compo IA • 4-2-3-1 Haute Intensité';
    aiRationale =
      'Schéma en 4-2-3-1 conçu pour maximiser le pressing haut et la transition rapide avec un meneur libre entre les lignes adverses.';
    keyInstructions = [
      'Pressing coordonné dès les 30m adverses',
      'Le numéro 10 oriente le jeu en 1 ou 2 touches',
      'Projection des ailiers vers la surface sur les centres',
    ];
  } else if (
    promptLower.includes('3-5-2') ||
    promptLower.includes('5-3-2') ||
    requestType === 'defensive' ||
    requestType === 'counter'
  ) {
    formation = promptLower.includes('5-3-2') ? '5-3-2' : '3-5-2';
    directive = 'bloc';
    name = `Compo IA • ${formation} Bloc Compact`;
    aiRationale =
      'Organisation solide pour verrouiller l’axe et exploiter la vitesse des attaquants en contre-attaque.';
    keyInstructions = [
      'Bloc médian très compact, coulissement latéral',
      'Pistons actifs sur toute la longueur du terrain',
      'Verticalité directe vers les deux attaquants de pointe',
    ];
  } else if (promptLower.includes('4-4-2') || requestType === 'rotation') {
    formation = '4-4-2';
    directive = 'none';
    name = 'Compo IA • 4-4-2 Équilibré & Rotation';
    aiRationale =
      'Structure classique en 4-4-2 avec des rôles clairs pour intégrer les remplaçants en conservant un équilibre parfait.';
    keyInstructions = [
      'Lignes serrées à 20 mètres maximum de distance',
      'Complémentarité entre l’attaquant pivot et le rapide',
      'Simplicité technique et sécurité dans les transmissions',
    ];
  } else if (promptLower.includes('3-4-3')) {
    formation = '3-4-3';
    directive = 'projection';
    name = 'Compo IA • 3-4-3 Attaque Totale';
    aiRationale =
      'Schéma offensif puissant pour submerger le bloc adverse sur toute la largeur.';
    keyInstructions = [
      'Occupation haute des couloirs',
      'Pressing à la perte immédiat',
      'Recherche du surnombre dans la surface adverse',
    ];
  } else if (promptLower.includes('4-1-2-1-2') || promptLower.includes('losange') || promptLower.includes('diamant')) {
    formation = '4-1-2-1-2';
    directive = 'projection';
    name = 'Compo IA • 4-1-2-1-2 Losange';
    aiRationale = 'Domination axiale par le milieu en diamant et soutien des latéraux pour apporter la largeur.';
    keyInstructions = [
      'Numéro 10 au cœur de toutes les transitions',
      'Latéraux apportant l’unique largeur sur les phases offensives',
      'Duo d’attaquants combinant en une touche',
    ];
  } else if (promptLower.includes('4-3-2-1') || promptLower.includes('sapin')) {
    formation = '4-3-2-1';
    directive = 'pressing';
    name = 'Compo IA • 4-3-2-1 Sapin de Noël';
    aiRationale = 'Densité maximale dans l’axe avec deux numéros 10 en soutien du buteur.';
    keyInstructions = [
      'Contrôle total de l’entrejeu',
      'Combinaisons rapides dans les demi-espaces',
      'Projection des relayeurs',
    ];
  } else if (promptLower.includes('5-4-1') || promptLower.includes('mur')) {
    formation = '5-4-1';
    directive = 'bloc';
    name = 'Compo IA • 5-4-1 Mur Infranchissable';
    aiRationale = 'Double rideau défensif hermétique pour neutraliser les attaques adverses.';
    keyInstructions = [
      'Lignes très basses et resserrées',
      'Départ en flèche des ailiers à la récupération',
      'Attaquant pivot en point d’ancrage',
    ];
  } else if (promptLower.includes('3-3-1')) {
    formation = '3-3-1';
    directive = 'projection';
    name = 'Compo IA • 3-3-1 Foot à 8';
    aiRationale = 'Schéma classique et formateur de Foot à 8 garantissant équilibre et jeu combiné.';
    keyInstructions = [
      '3 défenseurs solides assurant la couverture',
      'Milieu à 3 créatif et actif',
      'Attaquant mobile en fixation',
    ];
  } else if (promptLower.includes('2-3-1')) {
    formation = '2-3-1';
    directive = 'projection';
    name = 'Compo IA • 2-3-1 Foot à 7';
    aiRationale = 'Disposition idéale en foot à 7 pour dynamiser le milieu et libérer les couloirs.';
    keyInstructions = [
      'Relance propre des 2 défenseurs',
      'Milieu en triangle pour monopoliser le ballon',
    ];
  } else if (promptLower.includes('1-2-1') || promptLower.includes('five') || promptLower.includes('futsal')) {
    formation = '1-2-1';
    directive = 'pressing';
    name = 'Compo IA • 1-2-1 Futsal / Five';
    aiRationale = 'Losange classique de Futsal avec équilibre parfait entre défenseur axial, ailiers et pivot.';
    keyInstructions = [
      'Permutations constantes',
      'Jeu rapide à terre en 1 touche',
    ];
  }

  // Partition available roster by position groups
  const pool = [...roster];
  if (requestType === 'rotation') {
    pool.reverse();
  }

  const gks = pool.filter((p) => resolveJoueurPositionGroup(p.position) === 'goalkeeper');
  const defs = pool.filter((p) => resolveJoueurPositionGroup(p.position) === 'defender');
  const mids = pool.filter((p) => resolveJoueurPositionGroup(p.position) === 'midfielder');
  const atts = pool.filter((p) => resolveJoueurPositionGroup(p.position) === 'forward');
  const others = pool.filter((p) => resolveJoueurPositionGroup(p.position) === 'unknown');

  const lines = parseFormationLines(formation);
  const used = new Set<string>();

  function takeFrom(list: typeof roster): string | null {
    for (const p of list) {
      if (!used.has(p.uid)) {
        used.add(p.uid);
        return p.uid;
      }
    }
    return null;
  }

  function pickBestForRole(role: 'gk' | 'def' | 'mid' | 'att'): string | null {
    if (role === 'gk') {
      return takeFrom(gks) || takeFrom(others) || takeFrom(defs) || takeFrom(pool);
    }
    if (role === 'def') {
      return takeFrom(defs) || takeFrom(others) || takeFrom(mids) || takeFrom(pool);
    }
    if (role === 'mid') {
      return (
        takeFrom(mids) ||
        takeFrom(others) ||
        takeFrom(defs) ||
        takeFrom(atts) ||
        takeFrom(pool)
      );
    }
    return takeFrom(atts) || takeFrom(others) || takeFrom(mids) || takeFrom(pool);
  }

  const starters: (string | null)[] = [];
  lines.forEach((count, lineIndex) => {
    let role: 'gk' | 'def' | 'mid' | 'att' = 'mid';
    if (lineIndex === 0) role = 'gk';
    else if (lineIndex === 1) role = 'def';
    else if (lineIndex === lines.length - 1) role = 'att';
    else role = 'mid';

    for (let i = 0; i < count; i++) {
      starters.push(pickBestForRole(role));
    }
  });

  return {
    name,
    formation,
    directive,
    starterUids: starters,
    aiRationale,
    keyInstructions,
  };
}

export function computeAiMatchAnalysis(
  lineup: CoachPitchLineup,
  roster: Array<{ uid: string; name: string; position?: string }>,
  benchUids: string[],
): AiMatchAnalysis {
  const onPitchUids = lineup.starterUids.filter((uid): uid is string => Boolean(uid));
  const starterCount = onPitchUids.length;

  // Rating scores based on completeness and formation synergy
  const base = starterCount >= 11 ? 88 : Math.max(50, starterCount * 8);
  const overallScore = Math.min(96, base + (lineup.formation === '4-2-3-1' ? 2 : 1));
  const chemistryScore = Math.min(98, 86 + starterCount);
  const fitnessScore = 95;

  const keyRoles = {
    captainUid: onPitchUids[0] ?? null,
    freeKickUid: onPitchUids[Math.min(2, onPitchUids.length - 1)] ?? null,
    penaltyUid: onPitchUids[Math.min(onPitchUids.length - 1, 9)] ?? null,
  };

  const recommendedSubs: AiMatchAnalysis['recommendedSubs'] = [];
  if (benchUids.length > 0 && onPitchUids.length > 5) {
    recommendedSubs.push({
      minute: 60,
      title: 'Accélération & Impact Couloir',
      subInUid: benchUids[0],
      subOutUid: onPitchUids[Math.min(onPitchUids.length - 2, 7)],
      rationale: 'Exploiter la fatigue des latéraux adverses par des courses en profondeur.',
    });
  }
  if (benchUids.length > 1 && onPitchUids.length > 6) {
    recommendedSubs.push({
      minute: 75,
      title: 'Verrouillage Défensif',
      subInUid: benchUids[1],
      subOutUid: onPitchUids[Math.min(onPitchUids.length - 1, 8)],
      rationale: 'Sécuriser les transitions et solidifier le bloc équipe pour la fin de match.',
    });
  }

  return {
    overallScore,
    chemistryScore,
    fitnessScore,
    expectedGoals: '+2.3 xG',
    attackScore: 87,
    midfieldScore: 91,
    defenseScore: 89,
    keeperScore: 88,
    strengths: 'Supériorité technique axiale (84%) et pressing synchronisé.',
    focusPoint: 'Vigilance sur le replacement des latéraux lors des contre-attaques adverses.',
    keyRoles,
    recommendedSubs,
  };
}

export function generateAiPreMatchSpeech(
  formation: CoachPitchFormation,
  directive: TacticalAnimationDirective,
  teamName: string = 'l’équipe',
): string {
  const tacticDesc =
    directive === 'pressing'
      ? 'Dès le coup d’envoi, on met une pression étouffante sur leurs premières relances. Rien ne passe dans l’axe.'
      : directive === 'bloc'
        ? 'Aujourd’hui c’est la discipline absolue. Bloc compact, coulissement parfait, on explose comme des flèches dès la récupération.'
        : 'On impose notre maîtrise technique. Décrochages, dédoublements sur les côtés, fluidité et audace dans les 30 derniers mètres.';

  return `« Messieurs, regardez-vous. Aujourd’hui en ${formation}, on ne laisse aucune place au doute pour ${teamName}. ${tacticDesc} Chaque duel gagné est un message envoyé à l’adversaire. On joue ensemble, on communique, on se bat les uns pour les autres pendant 90 minutes. La victoire est pour nous, rentrez sur le terrain et prenez-la ! »`;
}


