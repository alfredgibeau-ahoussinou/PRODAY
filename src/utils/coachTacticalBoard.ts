/**
 * Tableau tactique Coach — **modèle et normalisation purs**.
 *
 * L'écran ne fait que dessiner et interagir : la lecture de l'état persisté vit
 * ici, pour deux raisons.
 *
 * 1. **Honnêteté de la reprise** : un état enregistré peut venir d'une version
 *    antérieure (le mode « 3D isométrique », retiré depuis, était persisté sous
 *    `boardMode: '3d'`) ou être corrompu. On ne réinjecte jamais tel quel ce
 *    qu'on relit : on normalise, et une valeur inconnue retombe sur le défaut.
 * 2. **Testabilité** : la migration et le bornage se vérifient sans monter
 *    l'écran ni toucher AsyncStorage.
 */

import { MATCH_FORMATS_CONFIG, type MatchFormatKey } from '../constants/tacticalMatrix';

export type TacticalPlayerTeam = 'home' | 'away';
/** Deux modes seulement : le tableau plat, et le laboratoire CPA. */
export type TacticalBoardMode = '2d' | 'cpa';
export type TacticalBoardTool = 'select' | 'pass' | 'run' | 'cone';
export type TacticalVectorType = 'pass' | 'run';
export type TacticalPhase = 1 | 2 | 3;

export interface TacticalPlayer {
  id: string;
  num: number;
  name: string;
  /** 0-100 (largeur). */
  x: number;
  /** 0-135 (hauteur) — repère normalisé du tableau. */
  y: number;
  team: TacticalPlayerTeam;
  role: string;
}

export interface TacticalVector {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: TacticalVectorType;
  /**
   * Phase du tracé — le schéma se relit en trois temps (relance, progression,
   * finition) : la lecture met en avant les tracés de la phase courante au lieu
   * de faire clignoter un cadre vide.
   */
  phase: TacticalPhase;
}

export interface TacticalCone {
  id: string;
  x: number;
  y: number;
}

export type TacticalBoardSnapshot = {
  selectedFormat: MatchFormatKey;
  boardMode: TacticalBoardMode;
  activeFormation: string;
  players: TacticalPlayer[];
  vectors: TacticalVector[];
  cones: TacticalCone[];
};

/** Clé de persistance du schéma — définie avec le modèle, pas avec l'écran. */
export const TACTICAL_BOARD_STORAGE_KEY = '@proday_tactical_board_state';

/** Bornes du repère normalisé du tableau (0-135 en hauteur). */
export const TACTICAL_BOARD_BOUNDS = { maxX: 100, maxY: 135 } as const;

const FORMAT_KEYS = Object.keys(MATCH_FORMATS_CONFIG) as MatchFormatKey[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, value));
}

function readText(value: unknown, maxLength = 60): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

function readPlayer(value: unknown): TacticalPlayer | null {
  if (!isRecord(value)) return null;
  const id = readText(value.id);
  const x = readNumber(value.x, 0, TACTICAL_BOARD_BOUNDS.maxX);
  const y = readNumber(value.y, 0, TACTICAL_BOARD_BOUNDS.maxY);
  const num = readNumber(value.num, 0, 99);
  const team = value.team === 'away' ? 'away' : value.team === 'home' ? 'home' : null;
  if (!id || x === null || y === null || num === null || !team) return null;
  return {
    id,
    num: Math.round(num),
    name: readText(value.name, 40) ?? `#${Math.round(num)}`,
    x: Math.round(x),
    y: Math.round(y),
    team,
    role: readText(value.role, 8) ?? '—',
  };
}

function readVector(value: unknown): TacticalVector | null {
  if (!isRecord(value)) return null;
  const id = readText(value.id);
  const fromX = readNumber(value.fromX, 0, TACTICAL_BOARD_BOUNDS.maxX);
  const fromY = readNumber(value.fromY, 0, TACTICAL_BOARD_BOUNDS.maxY);
  const toX = readNumber(value.toX, 0, TACTICAL_BOARD_BOUNDS.maxX);
  const toY = readNumber(value.toY, 0, TACTICAL_BOARD_BOUNDS.maxY);
  const type = value.type === 'run' ? 'run' : value.type === 'pass' ? 'pass' : null;
  if (!id || fromX === null || fromY === null || toX === null || toY === null || !type) {
    return null;
  }
  /** Les tracés enregistrés avant les séquences retombent sur la première phase. */
  const phase = value.phase === 2 ? 2 : value.phase === 3 ? 3 : 1;
  return {
    id,
    fromX: Math.round(fromX),
    fromY: Math.round(fromY),
    toX: Math.round(toX),
    toY: Math.round(toY),
    type,
    phase,
  };
}

function readCone(value: unknown): TacticalCone | null {
  if (!isRecord(value)) return null;
  const id = readText(value.id);
  const x = readNumber(value.x, 0, TACTICAL_BOARD_BOUNDS.maxX);
  const y = readNumber(value.y, 0, TACTICAL_BOARD_BOUNDS.maxY);
  if (!id || x === null || y === null) return null;
  return { id, x: Math.round(x), y: Math.round(y) };
}

function readList<T>(value: unknown, reader: (entry: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  return value.map(reader).filter((entry): entry is T => entry !== null);
}

/**
 * Normalise un état enregistré. Les clés absentes ou invalides sont **omises**
 * du résultat : l'écran garde alors sa valeur par défaut, plutôt que d'hériter
 * d'une donnée douteuse. En particulier, l'ancien mode `'3d'` retombe sur le
 * tableau plat (le mode isométrique n'existe plus).
 */
export function normalizeTacticalBoardState(raw: unknown): Partial<TacticalBoardSnapshot> {
  if (!isRecord(raw)) return {};
  const out: Partial<TacticalBoardSnapshot> = {};

  const format = raw.selectedFormat;
  if (typeof format === 'string' && (FORMAT_KEYS as string[]).includes(format)) {
    out.selectedFormat = format as MatchFormatKey;
  }

  out.boardMode = raw.boardMode === 'cpa' ? 'cpa' : '2d';

  const formation = readText(raw.activeFormation, 40);
  if (formation) out.activeFormation = formation;

  const players = readList(raw.players, readPlayer);
  if (players && players.length > 0) out.players = players;

  const vectors = readList(raw.vectors, readVector);
  if (vectors) out.vectors = vectors;

  const cones = readList(raw.cones, readCone);
  if (cones) out.cones = cones;

  return out;
}
