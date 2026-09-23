/**
 * Parcours guidé de composition — **modèle pur**, testable hors rendu.
 *
 * Ordre approuvé : Attaquants → Milieux → Défenseurs → Gardien → Remplaçants →
 * Vue complète. Le coach construit donc son onze de l'avant vers l'arrière,
 * puis complète le banc, puis relit l'ensemble.
 *
 * Le découpage en lignes ne se déduit **pas** du libellé de la formation : les
 * 57 systèmes de `tacticalMatrix` ne se nomment pas tous `4-3-3`. Quand le
 * libellé est exploitable on lit ses nombres, sinon on regroupe les crans par
 * ordonnée (`y`) — la donnée réelle, pas une convention de nommage.
 */

import type { PitchSlot } from '../constants/tacticalMatrix';
import { parseFormationLines } from './formationPitch';

export type CoachLineupStepId = 'att' | 'mid' | 'def' | 'gk' | 'subs' | 'review';

export type CoachPitchLineKind = 'att' | 'mid' | 'def' | 'gk';

export type CoachLineupStep = {
  id: CoachLineupStepId;
  /** Libellé long (titre d'étape). */
  label: string;
  /** Libellé court (barre de progression). */
  shortLabel: string;
  /** Consigne affichée au coach. */
  hint: string;
  /** Une étape « terrain » désigne une ligne précise ; `null` = banc / relecture. */
  line: CoachPitchLineKind | null;
};

/** Séquence approuvée — l'ordre est une décision produit, verrouillé par test. */
export const COACH_LINEUP_STEPS: readonly CoachLineupStep[] = [
  {
    id: 'att',
    label: 'Attaquants',
    shortLabel: 'Attaque',
    hint: 'Choisissez les joueurs de devant. Touchez un poste pour ouvrir le sélecteur.',
    line: 'att',
  },
  {
    id: 'mid',
    label: 'Milieux',
    shortLabel: 'Milieu',
    hint: 'Complétez le milieu de terrain.',
    line: 'mid',
  },
  {
    id: 'def',
    label: 'Défenseurs',
    shortLabel: 'Défense',
    hint: 'Posez la ligne défensive.',
    line: 'def',
  },
  {
    id: 'gk',
    label: 'Gardien',
    shortLabel: 'Gardien',
    hint: 'Désignez le gardien titulaire.',
    line: 'gk',
  },
  {
    id: 'subs',
    label: 'Remplaçants',
    shortLabel: 'Banc',
    hint: 'Composez le banc. Vous pourrez encore permuter ici.',
    line: null,
  },
  {
    id: 'review',
    label: 'Vue complète',
    shortLabel: 'Vue',
    hint: 'Relisez le onze et le banc, puis enregistrez ou publiez.',
    line: null,
  },
] as const;

export function coachLineupStepIndex(stepId: CoachLineupStepId): number {
  const index = COACH_LINEUP_STEPS.findIndex((step) => step.id === stepId);
  return index < 0 ? 0 : index;
}

export function coachLineupStepAt(index: number): CoachLineupStep {
  const clamped = Math.max(0, Math.min(COACH_LINEUP_STEPS.length - 1, index));
  return COACH_LINEUP_STEPS[clamped]!;
}

export function nextCoachLineupStep(stepId: CoachLineupStepId): CoachLineupStepId {
  return coachLineupStepAt(coachLineupStepIndex(stepId) + 1).id;
}

export function previousCoachLineupStep(stepId: CoachLineupStepId): CoachLineupStepId {
  return coachLineupStepAt(coachLineupStepIndex(stepId) - 1).id;
}

export type CoachPitchLine = {
  /** 0 = ligne la plus haute (attaque), n-1 = gardien. */
  lineIndex: number;
  kind: CoachPitchLineKind;
  /** Ordonnée moyenne des crans de la ligne (0 haut → 1 bas). */
  y: number;
  /** Index des crans du onze appartenant à la ligne, ordre gauche → droite. */
  slotIndexes: number[];
};

/**
 * Découpe les crans d'une formation en lignes, du haut (attaque) vers le bas
 * (gardien), puis nomme chaque ligne.
 */
export function resolvePitchLines(slots: PitchSlot[], formation: string): CoachPitchLine[] {
  if (slots.length === 0) return [];

  /**
   * Les lignes sont réordonnées **du haut vers le bas** avant d'être nommées :
   * les crans du onze sont déclarés gardien d'abord, mais le terrain se lit
   * attaque en haut. Sans ce tri, la première ligne (le gardien) serait
   * étiquetée « attaque ».
   */
  const rows = groupSlotIndexesByRow(slots, formation)
    .map((slotIndexes) => ({
      slotIndexes,
      y: mean(slotIndexes.map((index) => slots[index]?.y ?? 0)),
    }))
    .sort((a, b) => a.y - b.y);
  const lastIndex = rows.length - 1;

  return rows.map((row, lineIndex) => ({
    lineIndex,
    kind: classifyLine(lineIndex, lastIndex),
    y: row.y,
    slotIndexes: row.slotIndexes,
  }));
}

/**
 * Regroupement en lignes : les nombres du libellé quand leur somme retombe sur
 * le nombre de crans, sinon un regroupement par proximité d'ordonnée.
 */
function groupSlotIndexesByRow(slots: PitchSlot[], formation: string): number[][] {
  const declared = parseFormationLines(formation);
  const total = declared.reduce((sum, count) => sum + count, 0);
  if (total === slots.length && declared.length > 1) {
    const rows: number[][] = [];
    let cursor = 0;
    for (const count of declared) {
      rows.push(
        Array.from({ length: count }, (_, i) => cursor + i).filter((i) => i < slots.length),
      );
      cursor += count;
    }
    return rows;
  }
  return clusterSlotIndexesByY(slots);
}

function clusterSlotIndexesByY(slots: PitchSlot[]): number[][] {
  const ordered = slots
    .map((slot, index) => ({ index, y: slot.y }))
    .sort((a, b) => b.y - a.y);
  const rows: number[][] = [];
  let current: number[] = [];
  let anchor = Number.NaN;

  for (const entry of ordered) {
    if (current.length === 0 || Math.abs(entry.y - anchor) <= 0.07) {
      if (current.length === 0) anchor = entry.y;
      current.push(entry.index);
    } else {
      rows.push(current);
      current = [entry.index];
      anchor = entry.y;
    }
  }
  if (current.length > 0) rows.push(current);

  return rows.map((row) => row.sort((a, b) => slots[a]!.x - slots[b]!.x));
}

/**
 * Nomme une ligne : la plus basse est le gardien, la plus haute l'attaque, et
 * celle posée juste devant le gardien la défense. Ce qui reste est le milieu.
 */
function classifyLine(lineIndex: number, lastIndex: number): CoachPitchLineKind {
  if (lineIndex === lastIndex) return 'gk';
  if (lineIndex === 0) return 'att';
  if (lineIndex === lastIndex - 1) return 'def';
  return 'mid';
}

/** Crans du onze concernés par une ligne (vide pour le banc et la relecture). */
export function stepSlotIndexes(
  line: CoachPitchLineKind | null,
  slots: PitchSlot[],
  formation: string,
): number[] {
  if (!line) return [];
  const match = resolvePitchLines(slots, formation).find((row) => row.kind === line);
  return match ? [...match.slotIndexes] : [];
}

/** Position d'une étape dans la séquence (1-based) — pour « Étape 2/6 ». */
export function coachLineupProgress(stepId: CoachLineupStepId): {
  index: number;
  total: number;
  label: string;
} {
  return {
    index: coachLineupStepIndex(stepId) + 1,
    total: COACH_LINEUP_STEPS.length,
    label: coachLineupStepAt(coachLineupStepIndex(stepId)).label,
  };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
