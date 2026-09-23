import React, { useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { G, Line, Rect } from 'react-native-svg';
import {
  CoachFutPlayerCard,
  type PlayerMarkerSize,
} from './CoachFutPlayerCard';
import type { SquadPlayer } from '../../utils/coachSquadRoster';
import {
  CoachPitchSurface,
  coachPitchInsets,
} from './CoachPitchSurface';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import {
  COACH_COMPONENT_FALLBACK,
  COACH_PITCH,
  type CoachComponentTokens,
} from '../../features/coach/theme/coachPitchTokens';
import { proRadius } from '../../theme/professionalDesign';
import {
  resolvePitchLines,
  type CoachPitchLineKind,
} from '../../utils/coachLineupGuide';

export {
  MatchFormatKey,
  TacticalCategory,
  PitchSlot,
  TacticalSystem,
  MATCH_FORMATS_CONFIG,
  ALL_FORMATION_COORDINATES,
  ALL_CHEMISTRY_LINKS,
  ALL_TACTICAL_SYSTEMS,
  TACTICAL_SYSTEMS_BY_ID,
  DEFENSE_4_SYSTEMS,
  DEFENSE_3_5_SYSTEMS,
  HISTORICAL_HYBRID_SYSTEMS,
  SMALL_SIDED_SYSTEMS,
} from '../../constants/tacticalMatrix';

import {
  MATCH_FORMATS_CONFIG,
  type MatchFormatKey,
  type PitchSlot,
} from '../../constants/tacticalMatrix';
import {
  ALL_CHEMISTRY_LINKS,
  ALL_FORMATION_COORDINATES,
} from '../../constants/tacticalMatrix';

/** Jeton en cours de déplacement (repère du terrain, en points). */
type DragState = {
  slotIndex: number;
  player: SquadPlayer;
  x: number;
  y: number;
  /** Poste le plus proche du doigt — celui qui s'allume. */
  targetIndex: number;
  /** Demi-largeur de la colonne du jeton d'origine, pour borner le geste. */
  half: number;
};

export type FormationKey = string;
export const FORMATION_COORDINATES = ALL_FORMATION_COORDINATES;
export const CHEMISTRY_LINKS = ALL_CHEMISTRY_LINKS;

/**
 * Poste le plus proche d'un point — la seule règle qui décide où tombe un
 * jeton relâché.
 *
 * Un terrain n'a pas de position libre : les crans de la formation **sont** les
 * positions possibles. On accroche donc toujours au cran le plus proche, ce qui
 * rend le dépôt prévisible où que le doigt se lève, sans zone morte.
 * Renvoie `-1` quand il n'y a aucun cran (formation inconnue).
 */
export function nearestPointIndex(
  points: readonly { x: number; y: number }[],
  x: number,
  y: number,
): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}

export type CoachPitchViewProps = {
  /** Onze positionnel : index de cran → joueur, ou `null` pour un poste libre. */
  slots?: (SquadPlayer | null)[];
  /** Raccourci : onze fourni dans l'ordre des crans. */
  starters?: SquadPlayer[];
  format?: MatchFormatKey;
  formation: string;
  selectedPlayerId?: string | null;
  selectedSlotIndex?: number | null;
  onSelectPlayer?: (player: SquadPlayer, slotIndex: number) => void;
  /** Touche un poste libre (ou occupé) pendant la séquence guidée. */
  onSelectSlot?: (slotIndex: number, slot: PitchSlot) => void;
  onSwapPositions?: (playerA: SquadPlayer, playerB: SquadPlayer) => void;
  /**
   * Glisser-déposer d'un jeton vers un autre poste — **alternative au
   * sélecteur**. Activé seulement si le parent sait quoi faire du déplacement :
   * sans cette prop, aucun geste n'est capté.
   */
  onMovePlayer?: (player: SquadPlayer, toSlotIndex: number) => void;
  /** Ligne mise en avant pendant la séquence guidée. */
  highlightLine?: CoachPitchLineKind | null;
  /** Traits de liaison tactiques — **désactivés par défaut** (décor superflu). */
  showChemistry?: boolean;
  /** Hauteur imposée (sinon ratio de format, borné). */
  height?: number;
  /** Jetons du socle professionnel injectés par l'écran (repli hors shell). */
  tokens?: CoachComponentTokens;
  style?: StyleProp<ViewStyle>;
};

const MIN_HEIGHT = 260;
const MAX_HEIGHT = 660;
/**
 * Largeur maximale du terrain. Sans cette borne, un desktop élargirait la
 * pelouse sur toute la largeur du contenu (1 180 px) et le rapport 1:1,34
 * donnerait un terrain écrasé : on garde une **portrait** naturel à toutes les
 * tailles d'écran.
 */
const MAX_WIDTH = 520;

function pitchRatio(format: MatchFormatKey): number {
  switch (format) {
    case 'futsal':
      return 1.14;
    case '5v5':
      return 1.2;
    case '4v4':
      return 1.08;
    case '3v3':
      return 1.02;
    case '8v8':
      return 1.28;
    case '11v11':
    default:
      return 1.34;
  }
}

/**
 * Terrain de composition — sobre, proportionné, sans commandes sur la pelouse.
 *
 * Principes respectés :
 * - **Tracé discret** : blancs alpha très bas sur un vert profond, une seule
 *   bande de ton ; aucun damier à fort contraste, aucun décor de stade.
 * - **Jetons homogènes** : un seul disque par joueur (photo ou initiales), le
 *   numéro en pastille, le nom juste en dessous — mêmes dimensions partout.
 * - **Aucun chevauchement** : la largeur d'une ligne est divisée par son nombre
 *   de crans, ce qui borne le diamètre des jetons et la largeur des libellés.
 * - **Commandes hors pelouse** : ce composant ne dessine que le terrain.
 * - **Adaptatif** : la hauteur découle de la largeur mesurée et du format, donc
 *   le terrain reste juste de l'iPhone au desktop.
 *
 * Deux façons de placer un joueur, pour ne pas dépendre d'un seul geste :
 * **toucher** un poste (le parent ouvre alors son sélecteur) ou **maintenir puis
 * faire glisser** un jeton sur un autre poste. Le glisser commence par un appui
 * long, précisément parce que le terrain vit dans une liste qui défile : sans
 * ça, un balayage vertical sur un jeton ferait glisser le joueur au lieu de
 * faire défiler la page.
 */
export const CoachPitchView: React.FC<CoachPitchViewProps> = ({
  slots: slotsProp,
  starters = [],
  format = '11v11',
  formation,
  selectedPlayerId = null,
  selectedSlotIndex = null,
  onSelectPlayer,
  onSelectSlot,
  onSwapPositions,
  onMovePlayer,
  highlightLine = null,
  showChemistry = false,
  height,
  tokens = COACH_COMPONENT_FALLBACK,
  style,
}) => {
  const [measuredWidth, setMeasuredWidth] = useState(340);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 80) setMeasuredWidth(width);
  };

  const formationSlots: PitchSlot[] = useMemo(
    () => ALL_FORMATION_COORDINATES[formation] ?? ALL_FORMATION_COORDINATES['4-3-3'] ?? [],
    [formation],
  );

  const players: (SquadPlayer | null)[] = useMemo(() => {
    if (slotsProp) return slotsProp;
    return formationSlots.map((_, index) => starters[index] ?? null);
  }, [slotsProp, starters, formationSlots]);

  const lines = useMemo(
    () => resolvePitchLines(formationSlots, formation),
    [formationSlots, formation],
  );

  const isFutsal = format === 'futsal' || MATCH_FORMATS_CONFIG[format]?.isFutsal === true;
  const canvasHeight = height ?? Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, measuredWidth * pitchRatio(format)));
  const width = measuredWidth;
  /** Marge du tracé — fournie par la géométrie partagée, comme le tracé lui-même. */
  const inset = coachPitchInsets(width, canvasHeight);
  const usableWidth = Math.max(120, width - inset.x * 2);

  /**
   * Diamètre des jetons : trois contraintes, la plus serrée gagne.
   * 1. la **colonne** la plus dense (aucun jeton ne touche son voisin de ligne),
   * 2. la **verticale** la plus serrée (aucune ligne ne recouvre la suivante),
   * 3. une proportion de la largeur du terrain, pour rester élégant.
   */
  const avatarSize = useMemo(() => {
    const narrowest = lines.reduce((min, line) => Math.min(min, line.slotIndexes.length), 99);
    const column = usableWidth / Math.max(1, narrowest);
    const fromColumns = Math.floor(column - 12);
    const fromWidth = Math.floor(width * 0.13);

    let tightestGap = canvasHeight;
    for (let index = 1; index < lines.length; index += 1) {
      tightestGap = Math.min(tightestGap, (lines[index]!.y - lines[index - 1]!.y) * canvasHeight);
    }
    const fromVertical = Math.floor(tightestGap - 20);

    return Math.max(26, Math.min(52, fromColumns, fromWidth, fromVertical));
  }, [canvasHeight, lines, usableWidth, width]);

  /** Hauteur de bande pour le cadrage d'étape : la ligne mise en avant respire. */
  const bandHeight = canvasHeight / Math.max(3, lines.length * 1.35);

  const linesForSlot = useMemo(() => {
    const map = new Map<number, CoachPitchLineKind>();
    lines.forEach((line) => {
      line.slotIndexes.forEach((index) => map.set(index, line.kind));
    });
    return map;
  }, [lines]);

  const highlighted = highlightLine
    ? lines.find((line) => line.kind === highlightLine) ?? null
    : null;

  /**
   * Position de repos de chaque jeton, dans le repère du terrain.
   *
   * Calculée **une seule fois** : c'est le même point qui place le jeton, qui
   * résout le poste le plus proche pendant le glisser, et qui sert de repère de
   * retour. Sans ce calcul partagé, le glisser pourrait « atterrir » ailleurs
   * que là où le jeton est dessiné.
   */
  const slotGeometry = useMemo(
    () =>
      formationSlots.map((slot, index) => {
        const columnCount = Math.max(
          1,
          lines.find((line) => line.slotIndexes.includes(index))?.slotIndexes.length ?? 1,
        );
        const columnWidth = usableWidth / columnCount;
        const half = Math.min(columnWidth, avatarSize + 18) / 2;
        const cx = Math.max(inset.x + half, Math.min(width - inset.x - half, slot.x * width));
        const cy = Math.max(
          inset.y + avatarSize * 0.75,
          Math.min(canvasHeight - inset.y - avatarSize * 1.1, slot.y * canvasHeight),
        );
        return { cx, cy, half };
      }),
    [avatarSize, canvasHeight, formationSlots, inset.x, inset.y, lines, usableWidth, width],
  );

  // ——— Glisser-déposer d'un jeton ———
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const claimedRef = useRef(false);
  /**
   * Les gestionnaires du `PanResponder` sont créés une fois : ils lisent donc
   * toujours l'état **courant** via ces références, jamais via une closure
   * figée au premier rendu.
   */
  const geometryRef = useRef({ slotGeometry, players, onMovePlayer });
  geometryRef.current = { slotGeometry, players, onMovePlayer };

  const clampX = (value: number, half: number) =>
    Math.max(inset.x + half, Math.min(width - inset.x - half, value));
  const clampY = (value: number) =>
    Math.max(
      inset.y + avatarSize * 0.75,
      Math.min(canvasHeight - inset.y - avatarSize * 1.1, value),
    );

  /** Le dépôt s'accroche toujours au cran le plus proche (voir `nearestPointIndex`). */
  const snapSlotIndex = (x: number, y: number) =>
    nearestPointIndex(
      geometryRef.current.slotGeometry.map((point) => ({ x: point.cx, y: point.cy })),
      x,
      y,
    );

  const beginDrag = (slotIndex: number, player: SquadPlayer) => {
    if (!onMovePlayer) return;
    const start = slotGeometry[slotIndex];
    if (!start) return;
    const next: DragState = {
      slotIndex,
      player,
      x: start.cx,
      y: start.cy,
      targetIndex: slotIndex,
      half: start.half,
    };
    claimedRef.current = false;
    dragRef.current = next;
    setDrag(next);
    prodayHaptics.press();
  };

  /** Fin de geste : le jeton rejoint le poste le plus proche, ou revient à sa place. */
  const endDrag = (apply: boolean) => {
    const current = dragRef.current;
    dragRef.current = null;
    claimedRef.current = false;
    setDrag(null);
    if (!current || !apply) return;
    /** Reposé sur son propre poste : aucun changement, donc rien à annuler. */
    if (current.targetIndex === current.slotIndex) return;
    /**
     * Poste libre **ou** occupé : c'est le parent qui tranche, parce que lui seul
     * sait qui occupe le poste et comment l'échange doit se comporter.
     */
    geometryRef.current.onMovePlayer?.(current.player, current.targetIndex);
  };

  const dragControlsRef = useRef({ move: (_dx: number, _dy: number) => {}, end: (_apply: boolean) => {} });
  dragControlsRef.current = {
    move: (dx: number, dy: number) => {
      const current = dragRef.current;
      if (!current) return;
      const start = geometryRef.current.slotGeometry[current.slotIndex];
      if (!start) return;
      const x = clampX(start.cx + dx, current.half);
      const y = clampY(start.cy + dy);
      const target = snapSlotIndex(x, y);
      const next: DragState = {
        ...current,
        x,
        y,
        /** `-1` ne peut pas arriver (le terrain a toujours des crans) ; on garde le poste. */
        targetIndex: target >= 0 ? target : current.targetIndex,
      };
      dragRef.current = next;
      setDrag(next);
    },
    end: (apply: boolean) => endDrag(apply),
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        /** Le toucher simple reste au jeton (il ouvre le sélecteur du parent). */
        onStartShouldSetPanResponder: () => false,
        /** Le glisser ne démarre qu'après l'appui long qui a levé le jeton. */
        onMoveShouldSetPanResponder: () => dragRef.current !== null,
        onMoveShouldSetPanResponderCapture: () => false,
        /** Une fois le jeton levé, la liste ne doit plus reprendre la main. */
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          claimedRef.current = true;
        },
        onPanResponderMove: (_event, gesture) => {
          dragControlsRef.current.move(gesture.dx, gesture.dy);
        },
        onPanResponderRelease: () => {
          dragControlsRef.current.end(true);
        },
        onPanResponderTerminate: () => {
          dragControlsRef.current.end(false);
        },
      }),
    [],
  );

  const handlePress = (player: SquadPlayer, slotIndex: number) => {
    if (onSelectSlot) {
      onSelectSlot(slotIndex, formationSlots[slotIndex]!);
      return;
    }
    if (!onSelectPlayer) return;
    if (selectedPlayerId && selectedPlayerId !== player.id && onSwapPositions) {
      const previous = players.find((entry) => entry?.id === selectedPlayerId);
      if (previous) {
        onSwapPositions(previous, player);
        return;
      }
    }
    onSelectPlayer(player, slotIndex);
  };

  const labelWidth = Math.max(
    56,
    Math.min(96, usableWidth / Math.max(3, Math.min(5, lines.length + 1))),
  );

  return (
    <View
      style={[
        styles.canvas,
        { height: canvasHeight, backgroundColor: COACH_PITCH.canvas, borderColor: tokens.border },
        style,
      ]}
      onLayout={onLayout}
      {...panResponder.panHandlers}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <CoachPitchSurface
          width={width}
          height={canvasHeight}
          isFutsal={isFutsal}
          gradientId="coachTurf"
        />

        {/* Cadrage d'étape : une bande douce derrière la ligne travaillée. */}
        {highlighted ? (
          <Rect
            x={inset.x / 2}
            y={highlighted.y * canvasHeight - bandHeight / 2}
            width={width - inset.x}
            height={bandHeight}
            rx={proRadius.lg}
            fill={tokens.accent}
            opacity={0.1}
          />
        ) : null}

        {showChemistry ? (
          <G stroke={tokens.accent} strokeWidth="1" strokeDasharray="3,5" opacity={0.35}>
            {(ALL_CHEMISTRY_LINKS[formation] ?? []).map(([from, to], index) => {
              const a = formationSlots[from];
              const b = formationSlots[to];
              if (!a || !b) return null;
              return (
                <Line
                  key={`link-${index}`}
                  x1={a.x * width}
                  y1={a.y * canvasHeight}
                  x2={b.x * width}
                  y2={b.y * canvasHeight}
                />
              );
            })}
          </G>
        ) : null}
      </Svg>

      {/* Poste visé pendant un glisser : une cible lisible, jamais un décor. */}
      {drag && drag.targetIndex !== drag.slotIndex ? (
        <View
          pointerEvents="none"
          style={[
            styles.dropTarget,
            {
              left: slotGeometry[drag.targetIndex]!.cx - (avatarSize + 10) / 2,
              top: slotGeometry[drag.targetIndex]!.cy - (avatarSize + 10) / 2,
              width: avatarSize + 10,
              height: avatarSize + 10,
              borderRadius: proRadius.pill,
              borderColor: tokens.accent,
            },
          ]}
        />
      ) : null}

      {/* Jetons — positionnés dans les bornes du terrain, jamais sur le tracé. */}
      {formationSlots.map((slot, index) => {
        const player = players[index] ?? null;
        const lineKind = linesForSlot.get(index) ?? null;
        const geometry = slotGeometry[index]!;
        const isDragged = drag?.slotIndex === index;
        const isSwapTarget =
          drag !== null && drag.targetIndex === index && !isDragged && player !== null;
        /**
         * Le cadrage d'étape atténue les lignes non travaillées, mais jamais le
         * jeton qu'on tient : on ne déplace pas ce qu'on ne voit pas.
         */
        const dim = highlightLine !== null && lineKind !== highlightLine && !isDragged;
        const cx = isDragged ? drag.x : geometry.cx;
        const cy = isDragged ? drag.y : geometry.cy;

        const markerSize: PlayerMarkerSize = avatarSize < 36 ? 'bench' : 'pitch';

        return (
          <View
            key={`slot-${index}`}
            style={[
              styles.marker,
              isDragged && styles.markerDragged,
              {
                left: cx - geometry.half,
                top: cy - avatarSize * 0.75,
                width: geometry.half * 2,
                opacity: dim || isSwapTarget ? 0.42 : 1,
              },
            ]}
          >
            {player ? (
              <CoachFutPlayerCard
                player={player}
                size={markerSize}
                tokens={tokens}
                avatarSize={avatarSize}
                /** Le libellé ne dépasse jamais la colonne : il se tronque proprement. */
                labelWidth={Math.min(labelWidth, geometry.half * 2)}
                isSelected={
                  isDragged || selectedPlayerId === player.id || selectedSlotIndex === index
                }
                hideName={avatarSize < 30}
                onPress={() => handlePress(player, index)}
                onLongPress={
                  onMovePlayer ? () => beginDrag(index, player) : undefined
                }
                onPressOut={
                  onMovePlayer
                    ? () => {
                        /** Appui long relâché sans glisser : le jeton se repose. */
                        if (!claimedRef.current) endDrag(false);
                      }
                    : undefined
                }
              />
            ) : (
              <EmptySlotMarker
                position={slot.defaultPos}
                size={avatarSize}
                tokens={tokens}
                onPress={onSelectSlot ? () => onSelectSlot(index, slot) : undefined}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

/** Poste libre — cible tactile explicite, même gabarit que les jetons occupés. */
function EmptySlotMarker({
  position,
  size,
  tokens,
  onPress,
}: {
  position: string;
  size: number;
  tokens: CoachComponentTokens;
  onPress?: () => void;
}) {
  return (
    <PressableSpring
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityLabel={`Poste ${position} à composer`}
      style={styles.emptyRoot}
    >
      <View
        style={[
          styles.emptyCircle,
          {
            width: size,
            height: size,
            borderRadius: proRadius.pill,
            borderColor: tokens.border,
            backgroundColor: tokens.elevated,
          },
        ]}
      >
        <Text
          style={[styles.emptyLabel, { color: tokens.muted, fontSize: Math.max(9, size * 0.28) }]}
          allowFontScaling={false}
        >
          {position}
        </Text>
      </View>
      <Text style={[styles.emptyHint, { color: tokens.muted }]} numberOfLines={1} allowFontScaling={false}>
        Choisir
      </Text>
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    borderRadius: proRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  /** Jeton tenu : au-dessus des autres, légèrement levé, jamais translucide. */
  markerDragged: {
    zIndex: 5,
    elevation: 5,
    transform: [{ scale: 1.06 }],
  },
  /** Poste visé : contour d'accent pointillé, comme la sélection de puce. */
  dropTarget: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  emptyRoot: {
    alignItems: 'center',
    gap: 4,
  },
  emptyCircle: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  emptyHint: {
    fontSize: 9.5,
    fontWeight: '600',
  },
});
